import { createBadge, escapeHtml, fetchJson, formatDate } from "../common.js"

const metricsNode = document.querySelector("#youth-metrics")
const filtersNode = document.querySelector("#youth-filters")
const itemsNode = document.querySelector("#youth-items")
const titleNode = document.querySelector("#youth-title")
const metaNode = document.querySelector("#youth-meta")
const summaryNode = document.querySelector("#youth-summary")
const displayNode = document.querySelector("#youth-display")
const openNode = document.querySelector("#youth-open")

const state = {
  items: [],
  charts: [],
  filter: "page",
  selectedKey: null,
}

const selectedItems = () => (state.filter === "page" ? state.items : state.charts)

const currentItem = () => selectedItems().find((item) => item.key === state.selectedKey)

const renderMetrics = () => {
  metricsNode.innerHTML = [
    { value: state.items.length, label: "研究页面" },
    { value: state.charts.length, label: "图表证据" },
    { value: "持续", label: "更新方式" },
    { value: "在线", label: "浏览方式" },
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
  const options = [
    { id: "page", label: "研究页面" },
    { id: "chart", label: "图表证据" },
  ]

  filtersNode.innerHTML = options
    .map(
      (option) => `
        <button class="filter-button ${option.id === state.filter ? "is-active" : ""}" type="button" data-filter="${option.id}">
          ${option.label}
        </button>
      `,
    )
    .join("")

  Array.from(filtersNode.querySelectorAll("[data-filter]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter
      state.selectedKey = selectedItems()[0]?.key ?? null
      renderFilters()
      renderItems()
      renderSelected()
    })
  })
}

const renderItems = () => {
  const entries = selectedItems()
  if (!entries.length) {
    itemsNode.innerHTML = `<div class="empty-card">当前分类下暂无内容。</div>`
    return
  }

  if (!entries.some((item) => item.key === state.selectedKey)) {
    state.selectedKey = entries[0].key
  }

  itemsNode.innerHTML = entries
    .map(
      (item) => `
        <button class="item-button ${item.key === state.selectedKey ? "is-active" : ""}" type="button" data-key="${item.key}">
          <div class="badge-row">
            ${createBadge(item.group || (state.filter === "page" ? "页面" : "图表"), item.group ? "primary" : "neutral")}
            ${createBadge(formatDate(item.updatedAt), "neutral")}
          </div>
          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <div class="item-summary">${escapeHtml(item.summary)}</div>
        </button>
      `,
    )
    .join("")

  Array.from(itemsNode.querySelectorAll("[data-key]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedKey = button.dataset.key
      renderItems()
      renderSelected()
    })
  })
}

const renderSelected = () => {
  const item = currentItem()
  if (!item) return

  titleNode.textContent = item.title
  metaNode.textContent = `${state.filter === "page" ? "研究页面" : "图表证据"} · 更新于 ${formatDate(item.updatedAt)}`
  summaryNode.textContent = item.summary
  openNode.href = item.href

  if (state.filter === "page") {
    displayNode.innerHTML = `
      <iframe class="viewer-embed" src="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}"></iframe>
    `
    return
  }

  displayNode.innerHTML = `
    <article class="figure-card">
      <div class="badge-row">
        ${item.group ? createBadge(item.group, "primary") : ""}
        ${createBadge("图表", "warning")}
      </div>
      <h3 style="margin-top: 12px;">${escapeHtml(item.title)}</h3>
      <p class="figure-meta">${escapeHtml(item.summary)}</p>
      <img src="${escapeHtml(item.href)}" alt="${escapeHtml(item.title)}" style="margin-top: 14px;" />
    </article>
  `
}

const init = async () => {
  const data = await fetchJson("./data.json")
  state.items = (data.items || []).map((item) => ({
    ...item,
    key: `page:${item.href}`,
  }))
  state.charts = (data.charts || []).map((item) => ({
    ...item,
    key: `chart:${item.href}`,
  }))
  state.selectedKey = state.items[0]?.key ?? state.charts[0]?.key ?? null

  renderMetrics()
  renderFilters()
  renderItems()
  renderSelected()
}

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  summaryNode.textContent = error.message
})
