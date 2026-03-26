import {
  clampText,
  createBadge,
  escapeHtml,
  excerptForTerms,
  fetchJson,
  formatDate,
  queryTerms,
  renderMarkdown,
  scoreText,
  stripMarkdown,
} from "../common.js"

const metricsNode = document.querySelector("#scholarmind-metrics")
const projectsNode = document.querySelector("#scholarmind-projects")
const titleNode = document.querySelector("#scholarmind-title")
const metaNode = document.querySelector("#scholarmind-meta")
const tabsNode = document.querySelector("#scholarmind-tabs")
const bodyNode = document.querySelector("#scholarmind-body")
const queryForm = document.querySelector("#scholarmind-query-form")
const queryInput = document.querySelector("#scholarmind-query")
const promptsNode = document.querySelector("#scholarmind-prompts")

const TAB_LABELS = [
  { id: "assistant", label: "助手" },
  { id: "overview", label: "总览" },
  { id: "literature", label: "文献" },
  { id: "analysis", label: "分析" },
  { id: "evidence", label: "证据" },
  { id: "writing", label: "写作" },
]

const state = {
  projects: [],
  selectedId: null,
  tab: "assistant",
  assistantQuery: "",
}

const metricCard = (value, label) => `
  <article class="metric-card">
    <div class="metric-value">${value}</div>
    <div class="metric-label">${label}</div>
  </article>
`

const renderMetrics = (totals) => {
  metricsNode.innerHTML = [
    metricCard(totals.projects ?? 0, "公开项目"),
    metricCard(totals.literature ?? 0, "文献"),
    metricCard(totals.analysis ?? 0, "分析"),
    metricCard(totals.writing ?? 0, "写作稿"),
  ].join("")
}

const currentProject = () => state.projects.find((item) => item.id === state.selectedId)

const promptSet = (project) => {
  if (!project) return []
  return [
    `这个项目的核心研究问题是什么？`,
    `围绕“${project.title}”，目前有哪些已经形成的分析结论？`,
    `这个项目已经积累了哪些证据和文献？`,
    `这个项目现在已经写出了什么内容？`,
  ]
}

const renderPrompts = () => {
  const prompts = promptSet(currentProject())
  promptsNode.innerHTML = prompts
    .map(
      (prompt) => `
        <button class="prompt-button" type="button" data-prompt="${escapeHtml(prompt)}">
          <div>
            <strong>${escapeHtml(clampText(prompt, 24))}</strong>
            <span>${escapeHtml(prompt)}</span>
          </div>
        </button>
      `,
    )
    .join("")

  Array.from(promptsNode.querySelectorAll("[data-prompt]")).forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.prompt || ""
      queryInput.value = prompt
      state.assistantQuery = prompt
      state.tab = "assistant"
      renderTabs()
      renderContent()
    })
  })
}

const renderProjects = () => {
  projectsNode.innerHTML = state.projects
    .map(
      (item) => `
        <button class="item-button ${item.id === state.selectedId ? "is-active" : ""}" type="button" data-id="${item.id}">
          <div class="badge-row">
            ${createBadge(`阶段 ${item.stage}`, "primary")}
            ${createBadge(`${item.counts.literature} 文献`, "neutral")}
          </div>
          <h3 class="item-title">${item.title}</h3>
          <div class="item-summary">${item.researchQuestion}</div>
          <div class="item-meta">
            分析 ${item.counts.analysis} · 证据 ${item.counts.evidence} · 写作 ${item.counts.writing}
          </div>
        </button>
      `,
    )
    .join("")

  Array.from(projectsNode.querySelectorAll("[data-id]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id
      state.tab = "assistant"
      state.assistantQuery = ""
      renderProjects()
      renderPrompts()
      renderTabs()
      renderContent()
    })
  })
}

const renderTabs = () => {
  tabsNode.innerHTML = TAB_LABELS.map(
    (tab) => `
      <button class="tab-button ${tab.id === state.tab ? "is-active" : ""}" type="button" data-tab="${tab.id}">
        ${tab.label}
      </button>
    `,
  ).join("")

  Array.from(tabsNode.querySelectorAll("[data-tab]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab
      renderTabs()
      renderContent()
    })
  })
}

const renderOverview = (project) => {
  const latestNotes = project.notes.length
    ? project.notes
        .slice(0, 4)
        .map(
          (item) => `
            <article class="note-card">
              <div class="badge-row">
                ${item.sourceLabel ? createBadge(item.sourceLabel, "neutral") : ""}
                ${createBadge(formatDate(item.createdAt), "neutral")}
              </div>
              <p class="note-line">${escapeHtml(item.content)}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-card">当前项目暂无公开研究笔记。</div>`

  bodyNode.innerHTML = `
    <div class="result-grid cols-2">
      <article class="result-card">
        <h3>研究问题</h3>
        <p class="support-text">${escapeHtml(project.researchQuestion)}</p>
      </article>
      <article class="result-card">
        <h3>当前阶段</h3>
        <p class="support-text">阶段 ${project.stage} · 创建于 ${formatDate(project.createdAt)} · 最近更新于 ${formatDate(project.updatedAt)}</p>
      </article>
      <article class="result-card">
        <h3>预期贡献</h3>
        <p class="support-text">${escapeHtml(project.expectedContribution || "围绕研究问题组织文献、分析、证据与写作内容。")}</p>
      </article>
      <article class="result-card">
        <h3>内容分布</h3>
        <p class="support-text">文献 ${project.counts.literature} · 分析 ${project.counts.analysis} · 证据 ${project.counts.evidence} · 笔记 ${project.counts.notes} · 写作 ${project.counts.writing}</p>
      </article>
    </div>
    <section style="margin-top: 18px;">
      <h3 class="section-title">最近研究笔记</h3>
      <div class="info-grid" style="margin-top: 12px;">
        ${latestNotes}
      </div>
    </section>
  `
}

const renderLiterature = (project) => {
  if (!project.literature.length) {
    bodyNode.innerHTML = `<div class="empty-card">当前项目暂无公开文献。</div>`
    return
  }
  bodyNode.innerHTML = project.literature
    .map(
      (item) => `
        <article class="info-card">
          <div class="badge-row">
            ${item.year ? createBadge(String(item.year), "neutral") : ""}
            ${item.relevanceScore ? createBadge(`相关度 ${item.relevanceScore}`, "primary") : ""}
          </div>
          <h3 style="margin-top: 10px;">${escapeHtml(item.title)}</h3>
          <p>${escapeHtml((item.authors || []).join(" · ") || "作者信息待补充")}</p>
          <p class="note-line">${escapeHtml(item.journal || "未标注期刊")} · 录入于 ${formatDate(item.createdAt)}</p>
          <div class="badge-row" style="margin-top: 10px;">
            ${(item.tags || []).slice(0, 6).map((tag) => createBadge(tag, "neutral")).join("")}
          </div>
        </article>
      `,
    )
    .join("")
}

const renderAnalysis = (project) => {
  if (!project.analysis.length) {
    bodyNode.innerHTML = `<div class="empty-card">当前项目暂无公开分析结果。</div>`
    return
  }
  bodyNode.innerHTML = project.analysis
    .map(
      (item) => `
        <article class="info-card" style="margin-bottom: 14px;">
          <div class="badge-row">
            ${createBadge(item.mode || "analysis", "primary")}
            ${createBadge(item.model || "AI", "success")}
            ${createBadge(formatDate(item.createdAt), "neutral")}
          </div>
          <h3 style="margin-top: 10px;">${escapeHtml(item.question)}</h3>
          <div class="viewer-markdown" data-analysis-body>${escapeHtml(item.answer)}</div>
        </article>
      `,
    )
    .join("")

  Array.from(bodyNode.querySelectorAll("[data-analysis-body]")).forEach((node) => {
    renderMarkdown(node, node.textContent)
  })
}

const renderEvidence = (project) => {
  if (!project.evidence.length) {
    bodyNode.innerHTML = `<div class="empty-card">当前项目暂无公开证据片段。</div>`
    return
  }
  bodyNode.innerHTML = project.evidence
    .map(
      (item) => `
        <article class="quote-card">
          <div class="badge-row">
            ${item.literatureTitle ? createBadge(item.literatureTitle, "neutral") : ""}
            ${item.pageNumber ? createBadge(`第 ${item.pageNumber} 页`, "warning") : ""}
          </div>
          <blockquote style="margin-top: 12px;">${escapeHtml(item.text)}</blockquote>
          <p class="note-line" style="margin-top: 12px;">${escapeHtml(item.label || "证据片段")} · ${formatDate(item.createdAt)}</p>
        </article>
      `,
    )
    .join("")
}

const renderWriting = (project) => {
  if (!project.writing.length) {
    bodyNode.innerHTML = `<div class="empty-card">当前项目暂无公开写作内容。</div>`
    return
  }
  const first = project.writing[0]
  bodyNode.innerHTML = `
    <div class="info-card">
      <div class="badge-row">
        ${createBadge(`${first.wordCount} 词`, "primary")}
        ${first.aiTracePercentage != null ? createBadge(`AI痕迹 ${first.aiTracePercentage}%`, "warning") : ""}
        ${createBadge(`更新于 ${formatDate(first.updatedAt)}`, "neutral")}
      </div>
      <h3 style="margin-top: 10px;">${escapeHtml(first.title)}</h3>
      <div class="viewer-rich" id="scholarmind-writing-content"></div>
    </div>
  `
  const container = document.querySelector("#scholarmind-writing-content")
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(first.content)
  if (looksLikeHtml) {
    container.innerHTML = first.content
  } else {
    renderMarkdown(container, first.content)
  }
}

const buildCorpus = (project) => {
  const items = [
    {
      kind: "project",
      label: "研究问题",
      title: project.title,
      body: `${project.researchQuestion}\n${project.expectedContribution || ""}\n${project.targetJournal || ""}`,
      tone: "primary",
    },
  ]

  project.literature.forEach((item) => {
    items.push({
      kind: "literature",
      label: "文献",
      title: item.title,
      body: `${(item.authors || []).join(" ")} ${item.journal || ""} ${(item.tags || []).join(" ")} ${item.year || ""}`,
      tone: "neutral",
    })
  })

  project.analysis.forEach((item) => {
    items.push({
      kind: "analysis",
      label: item.question,
      title: item.mode || "分析",
      body: item.answer,
      tone: "success",
    })
  })

  project.evidence.forEach((item) => {
    items.push({
      kind: "evidence",
      label: item.label || "证据片段",
      title: item.literatureTitle || "证据",
      body: item.text,
      tone: "warning",
    })
  })

  project.notes.forEach((item) => {
    items.push({
      kind: "note",
      label: item.sourceLabel || "研究笔记",
      title: "研究笔记",
      body: item.content,
      tone: "neutral",
    })
  })

  project.writing.forEach((item) => {
    items.push({
      kind: "writing",
      label: item.title,
      title: "写作内容",
      body: stripMarkdown(item.content),
      tone: "primary",
    })
  })

  return items
}

const weightForKind = (kind) => {
  if (kind === "project") return 5
  if (kind === "analysis") return 4
  if (kind === "evidence") return 3
  if (kind === "writing") return 3
  if (kind === "literature") return 2
  return 1
}

const renderAssistant = (project) => {
  const query = state.assistantQuery.trim()
  if (!query) {
    bodyNode.innerHTML = `
      <div class="response-block">
        <h3>当前项目</h3>
        <p class="support-text">${escapeHtml(project.researchQuestion)}</p>
      </div>
      <div class="result-grid cols-2">
        <article class="result-card">
          <h3>文献</h3>
          <p class="support-text">当前公开 ${project.counts.literature} 篇，可进入“文献”页签查看。</p>
        </article>
        <article class="result-card">
          <h3>分析</h3>
          <p class="support-text">当前公开 ${project.counts.analysis} 条分析结果，可直接继续追问。</p>
        </article>
        <article class="result-card">
          <h3>证据</h3>
          <p class="support-text">当前公开 ${project.counts.evidence} 条证据片段，用于支撑研究判断。</p>
        </article>
        <article class="result-card">
          <h3>写作</h3>
          <p class="support-text">当前公开 ${project.counts.writing} 份写作内容，可查看阶段性稿件。</p>
        </article>
      </div>
    `
    return
  }

  const terms = queryTerms(query)
  const ranked = buildCorpus(project)
    .map((item) => ({
      ...item,
      score:
        scoreText(`${item.title} ${item.label}`, terms) * weightForKind(item.kind) +
        scoreText(item.body, terms),
      excerpt: excerptForTerms(item.body, terms, 220),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  if (!ranked.length) {
    bodyNode.innerHTML = `
      <div class="empty-card">
        这个问题在当前公开材料里没有找到足够直接的匹配。可以换成更具体的研究问题、文献、证据或写作相关提问。
      </div>
    `
    return
  }

  const lead = ranked[0]
  const literature = ranked.filter((item) => item.kind === "literature").slice(0, 3)
  const evidence = ranked.filter((item) => item.kind === "evidence").slice(0, 3)
  const analysis = ranked.filter((item) => item.kind === "analysis").slice(0, 2)
  const writing = ranked.filter((item) => item.kind === "writing").slice(0, 1)

  bodyNode.innerHTML = `
    <div class="response-block">
      <h3>助手回答</h3>
      <p class="support-text">${escapeHtml(lead.excerpt)}</p>
    </div>

    <div class="result-grid cols-2">
      <article class="result-card">
        <h3>优先查看</h3>
        <p class="support-text">${escapeHtml(lead.title)} · ${escapeHtml(lead.label)}</p>
      </article>
      <article class="result-card">
        <h3>问题来源</h3>
        <p class="support-text">当前问题：${escapeHtml(query)}</p>
      </article>
    </div>

    ${
      literature.length
        ? `
          <section style="margin-top: 18px;">
            <h3 class="section-title">相关文献</h3>
            <div class="info-grid" style="margin-top: 12px;">
              ${literature
                .map(
                  (item) => `
                    <article class="info-card">
                      <div class="badge-row">${createBadge("文献", "neutral")}</div>
                      <h3 style="margin-top: 10px;">${escapeHtml(item.title)}</h3>
                      <p class="support-text">${escapeHtml(item.excerpt)}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }

    ${
      evidence.length
        ? `
          <section style="margin-top: 18px;">
            <h3 class="section-title">相关证据</h3>
            <div class="info-grid" style="margin-top: 12px;">
              ${evidence
                .map(
                  (item) => `
                    <article class="quote-card">
                      <div class="badge-row">${createBadge("证据", "warning")}</div>
                      <blockquote style="margin-top: 12px;">${escapeHtml(item.excerpt)}</blockquote>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }

    ${
      analysis.length
        ? `
          <section style="margin-top: 18px;">
            <h3 class="section-title">已有分析</h3>
            <div class="info-grid" style="margin-top: 12px;">
              ${analysis
                .map(
                  (item, index) => `
                    <article class="info-card">
                      <div class="badge-row">
                        ${createBadge("分析", "success")}
                      </div>
                      <h3 style="margin-top: 10px;">${escapeHtml(item.label)}</h3>
                      <div class="viewer-markdown" data-assistant-analysis="${index}">${escapeHtml(item.body)}</div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }

    ${
      writing.length
        ? `
          <section style="margin-top: 18px;">
            <h3 class="section-title">相关写作</h3>
            <div class="info-card" style="margin-top: 12px;">
              <div class="badge-row">${createBadge("写作", "primary")}</div>
              <h3 style="margin-top: 10px;">${escapeHtml(writing[0].label)}</h3>
              <p class="support-text">${escapeHtml(writing[0].excerpt)}</p>
            </div>
          </section>
        `
        : ""
    }
  `

  Array.from(bodyNode.querySelectorAll("[data-assistant-analysis]")).forEach((node) => {
    renderMarkdown(node, node.textContent)
  })
}

const renderContent = () => {
  const project = currentProject()
  if (!project) return

  titleNode.textContent = project.title
  metaNode.textContent = `阶段 ${project.stage} · 最近更新于 ${formatDate(project.updatedAt)}`

  if (state.tab === "assistant") renderAssistant(project)
  if (state.tab === "overview") renderOverview(project)
  if (state.tab === "literature") renderLiterature(project)
  if (state.tab === "analysis") renderAnalysis(project)
  if (state.tab === "evidence") renderEvidence(project)
  if (state.tab === "writing") renderWriting(project)
}

const init = async () => {
  const data = await fetchJson("./data.json")
  state.projects = data.projects || []
  state.selectedId = state.projects[0]?.id ?? null
  renderMetrics(data.totals || {})
  renderProjects()
  renderPrompts()
  renderTabs()
  renderContent()
}

queryForm.addEventListener("submit", (event) => {
  event.preventDefault()
  state.assistantQuery = queryInput.value.trim()
  state.tab = "assistant"
  renderTabs()
  renderContent()
})

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<div class="empty-card">${escapeHtml(error.message)}</div>`
})
