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

const promptList = [
  "如果一支青少年球队要做赛后复盘，CoachMind 的演示流程该怎么开始？",
  "CoachMind 如何把计算机视觉和战术分析结合起来？",
  "如果现场网络不稳定，这个项目应该怎么部署？",
  "教练最先能看到哪些训练和比赛指标？",
]

const metricsNode = document.querySelector("#coachmind-metrics")
const promptsNode = document.querySelector("#coachmind-prompts")
const queryForm = document.querySelector("#coachmind-query-form")
const queryInput = document.querySelector("#coachmind-query")
const responseTitleNode = document.querySelector("#coachmind-response-title")
const responseMetaNode = document.querySelector("#coachmind-response-meta")
const responseNode = document.querySelector("#coachmind-response")
const sourcesNode = document.querySelector("#coachmind-sources")
const filtersNode = document.querySelector("#coachmind-filters")
const listNode = document.querySelector("#coachmind-list")
const titleNode = document.querySelector("#coachmind-title")
const metaNode = document.querySelector("#coachmind-meta")
const badgesNode = document.querySelector("#coachmind-badges")
const bodyNode = document.querySelector("#coachmind-body")
const downloadNode = document.querySelector("#coachmind-download")

const state = {
  filter: "全部",
  selectedId: null,
  documents: [],
  contentCache: new Map(),
  currentQuery: "",
}

const renderMetrics = (stats) => {
  metricsNode.innerHTML = [
    { value: stats.reports, label: "研究报告" },
    { value: stats.documents, label: "项目文档" },
    { value: stats.total, label: "公开文档" },
    { value: "本地", label: "检索方式" },
  ]
    .map(
      (item) => `
        <article class="metric-card">
          <div class="metric-value">${item.value}</div>
          <div class="metric-label">${item.label}</div>
        </article>
      `,
    )
    .join("")
}

const renderPrompts = () => {
  promptsNode.innerHTML = promptList
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
      void runAssistant(prompt)
    })
  })
}

const renderFilters = () => {
  const filters = ["全部", "研究报告", "项目文档"]
  filtersNode.innerHTML = filters
    .map(
      (filter) => `
        <button class="filter-button ${filter === state.filter ? "is-active" : ""}" type="button" data-filter="${filter}">
          ${filter}
        </button>
      `,
    )
    .join("")

  Array.from(filtersNode.querySelectorAll("[data-filter]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter
      renderFilters()
      renderList()
    })
  })
}

const visibleDocuments = () =>
  state.documents.filter((item) => state.filter === "全部" || item.type === state.filter)

const renderList = () => {
  const items = visibleDocuments()
  if (!items.length) {
    listNode.innerHTML = `<div class="empty-state">当前筛选条件下暂无文档。</div>`
    return
  }

  if (!items.some((item) => item.id === state.selectedId)) {
    state.selectedId = items[0].id
  }

  listNode.innerHTML = items
    .map(
      (item) => `
        <button class="item-button ${item.id === state.selectedId ? "is-active" : ""}" type="button" data-id="${item.id}">
          <div class="badge-row">
            ${createBadge(item.type, item.type === "研究报告" ? "primary" : "warning")}
          </div>
          <h3 class="item-title">${item.title}</h3>
          <div class="item-meta">更新于 ${formatDate(item.updatedAt)} · 约 ${item.wordCount} 词</div>
          <div class="item-summary">${item.summary || "暂无摘要。"}</div>
        </button>
      `,
    )
    .join("")

  Array.from(listNode.querySelectorAll("[data-id]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id
      renderList()
      void renderSelected()
    })
  })
}

const loadContent = async (item) => {
  if (state.contentCache.has(item.path)) {
    return state.contentCache.get(item.path)
  }
  const response = await fetch(item.path)
  const content = response.ok ? await response.text() : "# 文档暂不可用"
  state.contentCache.set(item.path, content)
  return content
}

const renderSelected = async () => {
  const item = state.documents.find((entry) => entry.id === state.selectedId)
  if (!item) return

  titleNode.textContent = item.title
  metaNode.textContent = `${item.type} · 更新于 ${formatDate(item.updatedAt)} · 约 ${item.wordCount} 词`
  badgesNode.innerHTML = [
    createBadge(item.type, item.type === "研究报告" ? "primary" : "warning"),
    createBadge("公开阅读", "success"),
  ].join("")
  downloadNode.href = item.path

  const markdown = await loadContent(item)
  renderMarkdown(bodyNode, markdown)
}

const rankingTerms = (query) => {
  const terms = queryTerms(query)
  if (terms.length) return terms
  const raw = String(query || "").trim().toLowerCase()
  return raw ? [raw] : []
}

const rankDocuments = async (query) => {
  const terms = rankingTerms(query)
  const ranked = await Promise.all(
    state.documents.map(async (item) => {
      const content = await loadContent(item)
      const plain = stripMarkdown(content)
      const score =
        scoreText(item.title, terms) * 6 +
        scoreText(item.summary || "", terms) * 3 +
        scoreText(plain, terms)

      return {
        item,
        score,
        excerpt: excerptForTerms(content, terms, 220),
      }
    }),
  )

  return ranked.filter((item) => item.score > 0).sort((left, right) => right.score - left.score)
}

const renderAssistantEmpty = () => {
  responseTitleNode.textContent = "从问题进入 CoachMind"
  responseMetaNode.textContent = "输入训练、战术或部署问题后，这里会显示一轮公开演示结果。"
  responseNode.innerHTML = `
    <div class="empty-card">
      试试上方的快速体验问题，或直接问一个更具体的场景，例如“如何给校队做赛后复盘”。
    </div>
  `
  sourcesNode.innerHTML = ""
}

const focusDocument = async (documentId) => {
  state.selectedId = documentId
  renderList()
  await renderSelected()
  document.querySelector("#reports")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

const renderAssistantResults = (query, matches) => {
  responseTitleNode.textContent = `关于“${query}”`
  responseMetaNode.textContent = `基于 ${matches.length} 份公开报告整理出的演示建议。`

  const topMatches = matches.slice(0, 4)
  const summaryItems = topMatches
    .slice(0, 3)
    .map(
      (match) => `
        <li>
          <strong>${escapeHtml(match.item.title)}</strong>：
          ${escapeHtml(match.excerpt)}
        </li>
      `,
    )
    .join("")

  const sequenceCards = topMatches
    .map(
      (match, index) => `
        <article class="insight-card">
          <div class="badge-row">
            ${createBadge(`步骤 ${index + 1}`, "primary")}
            ${createBadge(match.item.type, match.item.type === "研究报告" ? "neutral" : "warning")}
          </div>
          <h3>${escapeHtml(match.item.title)}</h3>
          <p class="support-text">${escapeHtml(match.excerpt)}</p>
        </article>
      `,
    )
    .join("")

  responseNode.innerHTML = `
    <div class="response-block">
      <h3>建议摘要</h3>
      <ul>${summaryItems}</ul>
    </div>
    <div class="response-block">
      <h3>建议浏览顺序</h3>
      <div class="card-stack">${sequenceCards}</div>
    </div>
  `

  sourcesNode.innerHTML = topMatches
    .map(
      (match) => `
        <button class="source-button" type="button" data-source-id="${match.item.id}">
          <div>
            <strong>${escapeHtml(match.item.title)}</strong>
            <span>${escapeHtml(clampText(match.excerpt, 96))}</span>
          </div>
        </button>
      `,
    )
    .join("")

  Array.from(sourcesNode.querySelectorAll("[data-source-id]")).forEach((button) => {
    button.addEventListener("click", () => {
      void focusDocument(button.dataset.sourceId)
    })
  })
}

const runAssistant = async (query) => {
  const trimmed = String(query || "").trim()
  state.currentQuery = trimmed
  if (!trimmed) {
    renderAssistantEmpty()
    return
  }

  responseTitleNode.textContent = `正在整理“${trimmed}”`
  responseMetaNode.textContent = "正在检索公开报告内容。"
  responseNode.innerHTML = `<div class="empty-card">正在读取报告并整理演示结果，请稍候。</div>`
  sourcesNode.innerHTML = ""

  const matches = await rankDocuments(trimmed)
  if (!matches.length) {
    responseTitleNode.textContent = `没有直接匹配“${trimmed}”`
    responseMetaNode.textContent = "可以换一个更具体的比赛、训练或部署问题。"
    responseNode.innerHTML = `
      <div class="empty-card">
        当前公开报告里没有找到足够直接的匹配。可以试试“赛后复盘”“战术分析”“边缘部署”“训练指标”这类关键词。
      </div>
    `
    return
  }

  renderAssistantResults(trimmed, matches)
}

const init = async () => {
  const data = await fetchJson("./data.json")
  state.documents = data.documents || []
  state.selectedId = state.documents[0]?.id ?? null

  renderMetrics(data.stats || {})
  renderPrompts()
  renderFilters()
  renderList()
  await renderSelected()
  await runAssistant(promptList[0])
}

queryForm.addEventListener("submit", (event) => {
  event.preventDefault()
  void runAssistant(queryInput.value)
})

init().catch((error) => {
  responseTitleNode.textContent = "页面加载失败"
  responseMetaNode.textContent = "请稍后再试。"
  responseNode.innerHTML = `<div class="empty-card">${escapeHtml(error.message)}</div>`
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<p>${escapeHtml(error.message)}</p>`
})
