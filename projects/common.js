export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

export const formatDate = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export const renderMarkdown = (node, markdown) => {
  if (!node) return
  if (window.marked) {
    node.innerHTML = window.marked.parse(markdown || "")
    return
  }
  node.textContent = markdown || ""
}

export const stripMarkdown = (value) =>
  String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

export const clampText = (value, maxLength = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

export const queryTerms = (value) => {
  const input = String(value || "").toLowerCase().trim()
  if (!input) return []

  const words = input.split(/[^a-z0-9\u4e00-\u9fff]+/).filter(Boolean)
  const cjkRuns = input.match(/[\u4e00-\u9fff]{2,}/g) || []
  const fragments = []

  cjkRuns.forEach((run) => {
    fragments.push(run)
    if (run.length <= 2) return
    for (let index = 0; index < run.length - 1; index += 1) {
      fragments.push(run.slice(index, index + 2))
    }
  })

  return Array.from(new Set([...words, ...fragments]))
    .filter((item) => item.length > 1)
    .sort((left, right) => right.length - left.length)
}

export const scoreText = (text, terms) => {
  const source = String(text || "").toLowerCase()
  if (!source || !terms?.length) return 0

  return terms.reduce((total, term) => {
    if (!term) return total
    let index = source.indexOf(term)
    let count = 0
    while (index !== -1) {
      count += 1
      index = source.indexOf(term, index + term.length)
    }
    return total + count
  }, 0)
}

export const excerptForTerms = (text, terms, maxLength = 220) => {
  const plain = stripMarkdown(text)
  if (!plain) return ""

  const paragraphs = plain
    .split(/\n\s*\n/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  if (!paragraphs.length) {
    return clampText(plain, maxLength)
  }

  const ranked = paragraphs
    .map((paragraph) => ({
      paragraph,
      score: scoreText(paragraph, terms),
    }))
    .sort((left, right) => right.score - left.score)

  const winner = ranked[0]?.score ? ranked[0].paragraph : paragraphs[0]
  return clampText(winner, maxLength)
}

export const collectMarkdownHeadings = (markdown) =>
  String(markdown || "")
    .split("\n")
    .map((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (!match) return null
      return {
        depth: match[1].length,
        text: match[2].trim(),
        slug: `heading-${index}-${match[2]
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
          .replace(/^-+|-+$/g, "")}`,
      }
    })
    .filter(Boolean)

export const createBadge = (label, tone = "neutral") =>
  `<span class="badge ${tone}">${escapeHtml(label)}</span>`

export const setActiveState = (elements, predicate) => {
  elements.forEach((element) => {
    element.classList.toggle("is-active", predicate(element))
  })
}

export const fetchJson = async (path) => {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`)
  }
  return response.json()
}
