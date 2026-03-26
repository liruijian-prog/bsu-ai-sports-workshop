#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import shutil
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path, PureWindowsPath
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
SIBLINGS = ROOT.parent
PROJECTS_ROOT = ROOT / "projects"

COACHMIND_ROOT = SIBLINGS / "coachmind-ai"
SCHOLARMIND_ROOT = SIBLINGS / "scholarmind-ai"
MARKDOWN_READER_ROOT = SIBLINGS / "markdown-reader-cp"
YOUTH_RESEARCH_ROOT = SIBLINGS / "youth-football-research"


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def strip_frontmatter(content: str) -> str:
    return re.sub(r"^---\s*\n.*?\n---\s*\n?", "", content, flags=re.DOTALL)


def frontmatter_title(content: str) -> str:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", content, flags=re.DOTALL)
    if not match:
        return ""
    for line in match.group(1).splitlines():
        if line.lower().startswith("title:"):
            return line.split(":", 1)[1].strip()
    return ""


def first_heading(content: str, fallback: str) -> str:
    meta_title = frontmatter_title(content)
    if meta_title:
        return meta_title
    for line in strip_frontmatter(content).splitlines():
        if line.startswith("#"):
            return line.lstrip("#").strip()
    return fallback


def first_paragraph(content: str) -> str:
    cleaned = strip_frontmatter(content)
    blocks = [block.strip() for block in re.split(r"\n\s*\n", cleaned) if block.strip()]
    for block in blocks:
        if block.startswith("#") or block.startswith(">") or block.startswith("```") or block.startswith("!["):
            continue
        plain = re.sub(r"[*_`>#-]", " ", block).strip()
        plain = re.sub(r"\s+", " ", plain)
        if plain:
            return plain[:220]
    return ""


def iso_mtime(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds")


def zh_date(value: str | None) -> str:
    if not value:
        return ""
    raw = value.replace("T", " ").replace("Z", "").strip()
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            parsed = datetime.strptime(raw, fmt)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return value[:10]


def parse_json_field(value: Any, fallback: Any) -> Any:
    if value in (None, ""):
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def word_count(text: str) -> int:
    tokens = re.findall(r"[\u4e00-\u9fff]|[A-Za-z0-9_]+", text)
    return len(tokens)


def block_markdown(blocks: dict[str, Any]) -> str:
    pieces: list[str] = []
    for block in blocks.values():
        heading = str(block.get("heading") or "").strip()
        content = str(block.get("text") or block.get("content") or "").strip()
        if heading:
            pieces.append(f"## {heading}")
        if content:
            pieces.append(content)
    return "\n\n".join(piece for piece in pieces if piece).strip()


def source_key_from_path(source_path: str) -> str:
    parts = list(PureWindowsPath(source_path).parts)
    anchors = {
        "article",
        "pdf-center",
        "book",
        "podcast",
        "batch-ask",
        "skill",
        "connector",
    }
    for index, part in enumerate(parts):
        if part in anchors:
            return "/".join(parts[index:])
    return PureWindowsPath(source_path).name


def sync_coachmind() -> None:
    source_docs = COACHMIND_ROOT / "website" / "public" / "docs"
    dest_root = ensure_dir(PROJECTS_ROOT / "coachmind-ai")
    dest_docs = ensure_dir(dest_root / "docs")

    if dest_docs.exists():
        for existing in dest_docs.glob("*.md"):
            existing.unlink()

    documents = []
    for source_file in sorted(source_docs.glob("*.md")):
        dest_file = dest_docs / source_file.name
        shutil.copy2(source_file, dest_file)
        content = read_text(source_file)
        is_report = bool(re.match(r"^\d{2}_", source_file.name))
        doc_type = "研究报告" if is_report else "项目文档"
        documents.append(
            {
                "id": source_file.stem.replace(".", "-"),
                "title": first_heading(content, source_file.stem.replace("_", " ")),
                "summary": first_paragraph(content),
                "type": doc_type,
                "path": f"./docs/{source_file.name}",
                "updatedAt": iso_mtime(source_file),
                "wordCount": word_count(content),
            }
        )

    stats = Counter(doc["type"] for doc in documents)
    payload = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "stats": {
            "reports": stats.get("研究报告", 0),
            "documents": stats.get("项目文档", 0),
            "total": len(documents),
        },
        "documents": documents,
    }
    (dest_root / "data.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def select_best_response(responses_raw: Any) -> dict[str, Any] | None:
    responses = parse_json_field(responses_raw, [])
    for item in responses:
        content = str(item.get("content") or "").strip()
        if not content:
            continue
        if "模型调用失败" in content or "Service temporarily unavailable" in content:
            continue
        return {
            "model": item.get("model") or item.get("model_id") or "AI",
            "content": content,
        }
    return None


def sync_scholarmind() -> None:
    dest_root = ensure_dir(PROJECTS_ROOT / "scholarmind-ai")
    db_path = SCHOLARMIND_ROOT / "backend" / "scholarmind.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    count_map: dict[str, dict[str, int]] = defaultdict(dict)
    for table in (
        "literature",
        "analysis_sessions",
        "evidence_snippets",
        "research_notes",
        "writing_documents",
    ):
        rows = conn.execute(
            f"select project_id, count(*) as total from {table} group by project_id"
        ).fetchall()
        for row in rows:
            count_map[row["project_id"]][table] = int(row["total"])

    project_rows = conn.execute(
        "select * from projects order by updated_at desc, created_at desc"
    ).fetchall()

    projects: list[dict[str, Any]] = []
    totals = Counter()

    for row in project_rows:
        project_id = row["id"]
        counts = {
            "literature": count_map[project_id].get("literature", 0),
            "analysis": count_map[project_id].get("analysis_sessions", 0),
            "evidence": count_map[project_id].get("evidence_snippets", 0),
            "notes": count_map[project_id].get("research_notes", 0),
            "writing": count_map[project_id].get("writing_documents", 0),
        }

        if not any(counts.values()):
            continue

        literature_rows = conn.execute(
            """
            select id, title, authors, year, journal, tags, relevance_score,
                   reading_progress, is_annotated, created_at
            from literature
            where project_id = ?
            order by created_at desc
            limit 12
            """,
            (project_id,),
        ).fetchall()
        literature = [
            {
                "id": item["id"],
                "title": item["title"],
                "authors": parse_json_field(item["authors"], []),
                "year": item["year"],
                "journal": item["journal"],
                "tags": parse_json_field(item["tags"], []),
                "relevanceScore": item["relevance_score"],
                "readingProgress": item["reading_progress"],
                "annotated": bool(item["is_annotated"]),
                "createdAt": item["created_at"],
            }
            for item in literature_rows
        ]

        analysis_rows = conn.execute(
            """
            select id, mode, question, responses, created_at
            from analysis_sessions
            where project_id = ?
            order by created_at desc
            limit 8
            """,
            (project_id,),
        ).fetchall()
        analysis = []
        for item in analysis_rows:
            best = select_best_response(item["responses"])
            if not best:
                continue
            analysis.append(
                {
                    "id": item["id"],
                    "mode": item["mode"],
                    "question": item["question"],
                    "createdAt": item["created_at"],
                    "answer": best["content"],
                    "model": best["model"],
                }
            )

        evidence_rows = conn.execute(
            """
            select e.id, e.label, e.selected_text, e.page_number, e.created_at,
                   l.title as literature_title
            from evidence_snippets e
            left join literature l on l.id = e.literature_id
            where e.project_id = ?
            order by e.created_at desc
            limit 12
            """,
            (project_id,),
        ).fetchall()
        evidence = [
            {
                "id": item["id"],
                "label": item["label"],
                "text": item["selected_text"],
                "pageNumber": item["page_number"],
                "literatureTitle": item["literature_title"],
                "createdAt": item["created_at"],
            }
            for item in evidence_rows
        ]

        notes_rows = conn.execute(
            """
            select id, content, source_label, created_at
            from research_notes
            where project_id = ?
            order by created_at desc
            limit 8
            """,
            (project_id,),
        ).fetchall()
        notes = [
            {
                "id": item["id"],
                "sourceLabel": item["source_label"],
                "content": item["content"],
                "createdAt": item["created_at"],
            }
            for item in notes_rows
        ]

        writing_rows = conn.execute(
            """
            select id, title, content, word_count, ai_trace_percentage, outline, updated_at
            from writing_documents
            where project_id = ?
            order by updated_at desc
            limit 6
            """,
            (project_id,),
        ).fetchall()
        writing = [
            {
                "id": item["id"],
                "title": item["title"],
                "content": item["content"],
                "wordCount": item["word_count"],
                "aiTracePercentage": item["ai_trace_percentage"],
                "outline": parse_json_field(item["outline"], []),
                "updatedAt": item["updated_at"],
            }
            for item in writing_rows
        ]

        projects.append(
            {
                "id": project_id,
                "title": row["title"],
                "researchQuestion": row["research_question"],
                "expectedContribution": row["expected_contribution"],
                "targetJournal": row["target_journal"],
                "stage": row["stage"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "counts": counts,
                "literature": literature,
                "analysis": analysis,
                "evidence": evidence,
                "notes": notes,
                "writing": writing,
            }
        )

        totals.update(
            {
                "projects": 1,
                "literature": counts["literature"],
                "analysis": len(analysis),
                "evidence": counts["evidence"],
                "writing": counts["writing"],
            }
        )

    conn.close()

    payload = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "totals": totals,
        "projects": projects,
    }
    (dest_root / "data.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def sync_markdown_reader() -> None:
    dest_root = ensure_dir(PROJECTS_ROOT / "markdown-reader-cp")
    docs_root = MARKDOWN_READER_ROOT / "data" / "docs"
    outputs_root = MARKDOWN_READER_ROOT / "data" / "outputs"

    analysis_map: dict[str, dict[str, Any]] = {}
    for file_path in sorted((outputs_root / "analysis").glob("*.json")):
        data = json.loads(read_text(file_path))
        key = source_key_from_path(str(data.get("sourcePath") or ""))
        if key:
            analysis_map.setdefault(key, data)

    translation_map: dict[str, dict[str, Any]] = {}
    for file_path in sorted((outputs_root / "translation").glob("*.json")):
        data = json.loads(read_text(file_path))
        key = source_key_from_path(str(data.get("sourcePath") or ""))
        if key:
            translation_map.setdefault(key, data)

    critical_map: dict[str, dict[str, Any]] = {}
    for file_path in sorted((outputs_root / "critical-reading").glob("*.json")):
        data = json.loads(read_text(file_path))
        key = source_key_from_path(str(data.get("sourcePath") or ""))
        if key:
            critical_map.setdefault(key, data)

    selected_docs: list[Path] = []
    selected_docs.extend(sorted((docs_root / "article").rglob("*.md")))
    selected_docs.extend(sorted((docs_root / "pdf-center").rglob("*.md"))[:2])
    selected_docs = selected_docs[:7]

    documents: list[dict[str, Any]] = []
    totals = Counter()
    for file_path in selected_docs:
        relative = file_path.relative_to(docs_root).as_posix()
        content = read_text(file_path)
        analysis_data = analysis_map.get(relative)
        translation_data = translation_map.get(relative)
        critical_data = critical_map.get(relative)

        critical_groups = []
        if critical_data:
            for block in critical_data.get("blocks", {}).values():
                annotations = block.get("annotations") or []
                if not annotations:
                    continue
                critical_groups.append(
                    {
                        "heading": block.get("heading") or "批判阅读",
                        "items": [
                            {
                                "type": item.get("type"),
                                "text": item.get("text"),
                                "comment": item.get("comment"),
                            }
                            for item in annotations
                        ],
                    }
                )

        documents.append(
            {
                "id": relative.replace("/", "__").replace(".", "-"),
                "title": first_heading(content, file_path.stem),
                "collection": file_path.parts[-3] if len(file_path.parts) >= 3 else file_path.parent.name,
                "pathLabel": relative,
                "updatedAt": iso_mtime(file_path),
                "summary": first_paragraph(content),
                "content": content,
                "analysis": block_markdown(analysis_data.get("blocks", {})) if analysis_data else "",
                "translation": block_markdown(translation_data.get("blocks", {})) if translation_data else "",
                "critical": critical_groups,
                "availableTabs": {
                    "analysis": bool(analysis_data),
                    "translation": bool(translation_data),
                    "critical": bool(critical_groups),
                },
            }
        )
        totals.update(
            {
                "documents": 1,
                "analysis": int(bool(analysis_data)),
                "translation": int(bool(translation_data)),
                "critical": int(bool(critical_groups)),
            }
        )

    payload = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "totals": totals,
        "documents": documents,
    }
    (dest_root / "data.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def html_title(path: Path, fallback: str) -> str:
    match = re.search(r"<title>(.*?)</title>", read_text(path), flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return fallback
    return re.sub(r"\s+", " ", match.group(1)).strip()


def sync_youth_research() -> None:
    dest_root = ensure_dir(PROJECTS_ROOT / "youth-football-research")
    pages = [
        {
            "source": YOUTH_RESEARCH_ROOT / "plan" / "21day-plan.html",
            "target": dest_root / "21day-plan.html",
            "summary": "21天研究计划总览，展示青少年足球研究的任务结构、阶段进度与资料入口。",
        },
        {
            "source": YOUTH_RESEARCH_ROOT / "outputs" / "第一阶段_问题诊断篇_研究综述.html",
            "target": dest_root / "stage-one-review.html",
            "summary": "第一阶段问题诊断篇研究综述，汇总数据危机、结构密码、选材迷雾与教练困局等核心结论。",
        },
    ]

    items = []
    for page in pages:
        shutil.copy2(page["source"], page["target"])
        items.append(
            {
                "title": html_title(page["source"], page["target"].stem),
                "summary": page["summary"],
                "href": f"./{page['target'].name}",
                "updatedAt": iso_mtime(page["source"]),
            }
        )

    payload = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "items": items,
    }
    (dest_root / "data.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    ensure_dir(PROJECTS_ROOT)
    sync_coachmind()
    sync_scholarmind()
    sync_markdown_reader()
    sync_youth_research()
    print("Synced linked projects:")
    print(" - coachmind-ai")
    print(" - scholarmind-ai")
    print(" - markdown-reader-cp")
    print(" - youth-football-research")


if __name__ == "__main__":
    main()
