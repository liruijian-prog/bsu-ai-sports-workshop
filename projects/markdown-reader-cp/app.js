import {
  createBadge,
  fetchJson,
  formatDate,
  renderMarkdown,
} from "../common.js"

const metricsNode = document.querySelector("#reader-metrics")
const documentsNode = document.querySelector("#reader-documents")
const titleNode = document.querySelector("#reader-title")
const metaNode = document.querySelector("#reader-meta")
const tabsNode = document.querySelector("#reader-tabs")
const bodyNode = document.querySelector("#reader-body")

const TABS = [
  { id: "content", label: "原文" },
  { id: "analysis", label: "AI分析" },
  { id: "translation", label: "翻译" },
  { id: "critical", label: "批判阅读" },
]

const state = {
  documents: [],
  selectedId: null,
  tab: "content",
}

const currentDocument = () => state.documents.find((item) => item.id === state.selectedId)

const renderMetrics = (totals) => {
  metricsNode.innerHTML = [
    { value: totals.documents ?? 0, label: "公开文档" },
    { value: totals.analysis ?? 0, label: "分析结果" },
    { value: totals.translation ?? 0, label: "翻译结果" },
    { value: totals.critical ?? 0, label: "批判阅读" },
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

const renderDocuments = () => {
  documentsNode.innerHTML = state.documents
    .map(
      (item) => `
        <button class="item-button ${item.id === state.selectedId ? "is-active" : ""}" type="button" data-id="${item.id}">
          <div class="badge-row">
            ${createBadge(item.collection, "primary")}
            ${createBadge(formatDate(item.updatedAt), "neutral")}
          </div>
          <h3 class="item-title">${item.title}</h3>
          <div class="item-summary">${item.summary || "暂无摘要。"}</div>
          <div class="badge-row">
            ${item.availableTabs.analysis ? createBadge("分析", "success") : ""}
            ${item.availableTabs.translation ? createBadge("翻译", "warning") : ""}
            ${item.availableTabs.critical ? createBadge("批判阅读", "neutral") : ""}
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
  tabsNode.innerHTML = TABS.filter((tab) => {
    if (!doc) return false
    if (tab.id === "content") return true
    if (tab.id === "analysis") return doc.availableTabs.analysis
    if (tab.id === "translation") return doc.availableTabs.translation
    if (tab.id === "critical") return doc.availableTabs.critical
    return false
  })
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
          <h3>${group.heading}</h3>
          ${group.items
            .map(
              (item) => `
                <article class="annotation-card">
                  <div class="badge-row">
                    ${createBadge(item.type || "annotation", "warning")}
                  </div>
                  <div class="annotation-text">${item.text || ""}</div>
                  <p class="annotation-comment">${item.comment || "暂无评论。"}</p>
                </article>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("")
}

const renderContent = () => {
  const doc = currentDocument()
  if (!doc) return

  titleNode.textContent = doc.title
  metaNode.textContent = `${doc.pathLabel} · 更新于 ${formatDate(doc.updatedAt)}`

  if (state.tab === "content") {
    renderMarkdown(bodyNode, doc.content)
    return
  }

  if (state.tab === "analysis") {
    renderMarkdown(bodyNode, doc.analysis || "暂无分析结果。")
    return
  }

  if (state.tab === "translation") {
    renderMarkdown(bodyNode, doc.translation || "暂无翻译结果。")
    return
  }

  if (state.tab === "critical") {
    renderCritical(doc)
  }
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

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<p>${error.message}</p>`
})
