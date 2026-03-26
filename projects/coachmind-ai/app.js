import {
  createBadge,
  fetchJson,
  formatDate,
  renderMarkdown,
  setActiveState,
} from "../common.js"

const metricsNode = document.querySelector("#coachmind-metrics")
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
}

const renderMetrics = (stats) => {
  metricsNode.innerHTML = [
    { value: stats.reports, label: "研究报告" },
    { value: stats.documents, label: "项目文档" },
    { value: stats.total, label: "公开文档" },
    { value: "在线", label: "阅读方式" },
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
      renderSelected()
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

const init = async () => {
  const data = await fetchJson("./data.json")
  state.documents = data.documents || []
  state.selectedId = state.documents[0]?.id ?? null
  renderMetrics(data.stats || {})
  renderFilters()
  renderList()
  await renderSelected()
}

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<p>${error.message}</p>`
})
