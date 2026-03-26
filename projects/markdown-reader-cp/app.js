import {
  clampText,
  collectMarkdownHeadings,
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

const metricsNode = document.querySelector("#reader-metrics")
const documentsNode = document.querySelector("#reader-documents")
const titleNode = document.querySelector("#reader-title")
const metaNode = document.querySelector("#reader-meta")
const tabsNode = document.querySelector("#reader-tabs")
const bodyNode = document.querySelector("#reader-body")
const outlineNode = document.querySelector("#reader-outline")
const librarySearchNode = document.querySelector("#reader-library-search")
const contentSearchNode = document.querySelector("#reader-search")
const uploadNode = document.querySelector("#reader-upload")

const TABS = [
  { id: "content", label: "原文" },
  { id: "analysis", label: "AI分析" },
  { id: "translation", label: "翻译" },
  { id: "critical", label: "批判阅读" },
  { id: "visualization", label: "信息图" },
]

const LOCAL_ID = "__local_markdown__"

const state = {
  documents: [],
  selectedId: null,
  tab: "content",
  libraryQuery: "",
  contentQuery: "",
  localDocument: null,
}

const currentDocument = () => {
  if (state.selectedId === LOCAL_ID) return state.localDocument
  return state.documents.find((item) => item.id === state.selectedId)
}

const renderMetrics = (totals) => {
  metricsNode.innerHTML = [
    { value: totals.documents ?? 0, label: "公开文档" },
    { value: totals.analysis ?? 0, label: "分析结果" },
    { value: totals.translation ?? 0, label: "翻译结果" },
    { value: totals.visualization ?? 0, label: "信息图" },
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

const visibleDocuments = () => {
  const keyword = state.libraryQuery.trim().toLowerCase()
  const allDocuments = state.localDocument ? [state.localDocument, ...state.documents] : state.documents
  if (!keyword) return allDocuments

  return allDocuments.filter((item) => {
    const text = `${item.title} ${item.summary || ""} ${item.pathLabel || ""}`.toLowerCase()
    return text.includes(keyword)
  })
}

const renderDocuments = () => {
  const items = visibleDocuments()
  if (!items.length) {
    documentsNode.innerHTML = `<div class="empty-card">没有匹配的文档。</div>`
    return
  }

  if (!items.some((item) => item.id === state.selectedId)) {
    state.selectedId = items[0].id
  }

  documentsNode.innerHTML = items
    .map(
      (item) => `
        <button class="item-button ${item.id === state.selectedId ? "is-active" : ""}" type="button" data-id="${item.id}">
          <div class="badge-row">
            ${item.id === LOCAL_ID ? createBadge("本地文件", "success") : createBadge(item.collection, "primary")}
            ${item.updatedAt ? createBadge(formatDate(item.updatedAt), "neutral") : ""}
          </div>
          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <div class="item-summary">${escapeHtml(item.summary || "暂无摘要。")}</div>
          <div class="badge-row">
            ${item.availableTabs?.analysis ? createBadge("分析", "success") : ""}
            ${item.availableTabs?.translation ? createBadge("翻译", "warning") : ""}
            ${item.availableTabs?.critical ? createBadge("批判阅读", "neutral") : ""}
            ${item.availableTabs?.visualization ? createBadge("信息图", "primary") : ""}
          </div>
        </button>
      `,
    )
    .join("")

  Array.from(documentsNode.querySelectorAll("[data-id]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id
      state.tab = "content"
      renderDocuments()
      renderTabs()
      renderContent()
    })
  })
}

const renderTabs = () => {
  const doc = currentDocument()
  const tabs = TABS.filter((tab) => {
    if (!doc) return false
    if (tab.id === "content") return true
    if (tab.id === "analysis") return doc.availableTabs?.analysis
    if (tab.id === "translation") return doc.availableTabs?.translation
    if (tab.id === "critical") return doc.availableTabs?.critical
    if (tab.id === "visualization") return doc.availableTabs?.visualization
    return false
  })

  if (!tabs.some((tab) => tab.id === state.tab)) {
    state.tab = "content"
  }

  tabsNode.innerHTML = tabs
    .map(
      (tab) => `
        <button class="tab-button ${tab.id === state.tab ? "is-active" : ""}" type="button" data-tab="${tab.id}">
          ${tab.label}
        </button>
      `,
    )
    .join("")

  Array.from(tabsNode.querySelectorAll("[data-tab]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab
      renderTabs()
      renderContent()
    })
  })
}

const renderCritical = (doc) => {
  bodyNode.innerHTML = doc.critical
    .map(
      (group) => `
        <section class="annotation-group">
          <h3>${escapeHtml(group.heading)}</h3>
          ${group.items
            .map(
              (item) => `
                <article class="annotation-card">
                  <div class="badge-row">
                    ${createBadge(item.type || "annotation", "warning")}
                  </div>
                  <div class="annotation-text">${escapeHtml(item.text || "")}</div>
                  <p class="annotation-comment">${escapeHtml(item.comment || "暂无评论。")}</p>
                </article>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("")
}

const applyHeadingIds = (markdown) => {
  const headings = collectMarkdownHeadings(markdown)
  const nodes = Array.from(bodyNode.querySelectorAll("h1, h2, h3"))
  nodes.forEach((node, index) => {
    if (!headings[index]) return
    node.id = headings[index].slug
  })
  return headings
}

const renderOutline = (markdown, emptyMessage = "当前视图没有可定位目录。") => {
  const headings = collectMarkdownHeadings(markdown)
  const terms = queryTerms(state.contentQuery)
  const searchBlocks = terms.length
    ? stripMarkdown(markdown)
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .map((paragraph) => ({
          paragraph,
          score: scoreText(paragraph, terms),
        }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4)
    : []

  const blocks = []
  if (searchBlocks.length) {
    blocks.push(`
      <article class="source-card">
        <h3>检索结果</h3>
        <div class="card-stack">
          ${searchBlocks
            .map((item) => `<p class="support-text">${escapeHtml(clampText(item.paragraph, 130))}</p>`)
            .join("")}
        </div>
      </article>
    `)
  }

  if (headings.length) {
    blocks.push(
      headings
        .map(
          (heading) => `
            <a class="outline-link depth-${heading.depth}" href="#${heading.slug}">
              ${escapeHtml(heading.text)}
            </a>
          `,
        )
        .join(""),
    )
  }

  outlineNode.innerHTML = blocks.length ? blocks.join("") : `<p class="support-text">${emptyMessage}</p>`
}

const renderVisualization = (doc) => {
  bodyNode.innerHTML = `
    <iframe
      class="viewer-embed"
      title="${escapeHtml(doc.title)} 信息图"
      src="${escapeHtml(doc.visualizationHref)}"
    ></iframe>
  `
  outlineNode.innerHTML = `
    <article class="source-card">
      <h3>信息图说明</h3>
      <p class="support-text">这个视图来自 Markdown Reader 已生成的可视化结果，可直接在页面内浏览。</p>
      <a class="mini-link" href="${escapeHtml(doc.visualizationHref)}" target="_blank" rel="noreferrer">单独打开</a>
    </article>
  `
}

const renderContent = () => {
  const doc = currentDocument()
  if (!doc) return

  titleNode.textContent = doc.title
  metaNode.textContent = `${doc.pathLabel || "本地文件"}${doc.updatedAt ? ` · 更新于 ${formatDate(doc.updatedAt)}` : ""}`

  if (state.tab === "content") {
    renderMarkdown(bodyNode, doc.content)
    applyHeadingIds(doc.content)
    renderOutline(doc.content)
    return
  }

  if (state.tab === "analysis") {
    renderMarkdown(bodyNode, doc.analysis || "暂无分析结果。")
    applyHeadingIds(doc.analysis || "")
    renderOutline(doc.analysis || "", "当前分析结果没有结构化目录。")
    return
  }

  if (state.tab === "translation") {
    renderMarkdown(bodyNode, doc.translation || "暂无翻译结果。")
    applyHeadingIds(doc.translation || "")
    renderOutline(doc.translation || "", "当前翻译结果没有结构化目录。")
    return
  }

  if (state.tab === "critical") {
    renderCritical(doc)
    outlineNode.innerHTML = `
      <article class="source-card">
        <h3>批判阅读</h3>
        <p class="support-text">这里展示的是该文档已经生成的批判阅读标注与评论。</p>
      </article>
    `
    return
  }

  if (state.tab === "visualization") {
    renderVisualization(doc)
  }
}

const loadLocalFile = async (file) => {
  const content = await file.text()
  state.localDocument = {
    id: LOCAL_ID,
    title: file.name.replace(/\.md$/i, ""),
    collection: "本地导入",
    pathLabel: "本地 Markdown",
    updatedAt: "",
    summary: excerptForTerms(content, [], 120) || "本地导入文件",
    content,
    analysis: "",
    translation: "",
    critical: [],
    visualizationHref: "",
    availableTabs: {
      analysis: false,
      translation: false,
      critical: false,
      visualization: false,
    },
  }
  state.selectedId = LOCAL_ID
  state.tab = "content"
  renderDocuments()
  renderTabs()
  renderContent()
}

const init = async () => {
  const data = await fetchJson("./data.json")
  state.documents = data.documents || []
  state.selectedId = state.documents[0]?.id ?? null
  renderMetrics(data.totals || {})
  renderDocuments()
  renderTabs()
  renderContent()
}

librarySearchNode.addEventListener("input", () => {
  state.libraryQuery = librarySearchNode.value
  renderDocuments()
})

contentSearchNode.addEventListener("input", () => {
  state.contentQuery = contentSearchNode.value
  renderContent()
})

uploadNode.addEventListener("change", async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  await loadLocalFile(file)
  uploadNode.value = ""
})

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<div class="empty-card">${escapeHtml(error.message)}</div>`
  outlineNode.innerHTML = ""
})
