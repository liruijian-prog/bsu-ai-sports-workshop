import { createBadge, fetchJson, formatDate } from "../common.js"

const metricsNode = document.querySelector("#youth-metrics")
const itemsNode = document.querySelector("#youth-items")
const titleNode = document.querySelector("#youth-title")
const metaNode = document.querySelector("#youth-meta")
const summaryNode = document.querySelector("#youth-summary")
const frameNode = document.querySelector("#youth-frame")
const openNode = document.querySelector("#youth-open")

const state = {
  items: [],
  selectedHref: null,
}

const currentItem = () => state.items.find((item) => item.href === state.selectedHref)

const renderMetrics = (items) => {
  metricsNode.innerHTML = [
    { value: items.length, label: "公开页面" },
    { value: "持续", label: "更新方式" },
    { value: "在线", label: "阅读体验" },
    { value: "同步", label: "发布状态" },
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

const renderItems = () => {
  itemsNode.innerHTML = state.items
    .map(
      (item) => `
        <button class="item-button ${item.href === state.selectedHref ? "is-active" : ""}" type="button" data-href="${item.href}">
          <div class="badge-row">
            ${createBadge(formatDate(item.updatedAt), "neutral")}
          </div>
          <h3 class="item-title">${item.title}</h3>
          <div class="item-summary">${item.summary}</div>
        </button>
      `,
    )
    .join("")

  Array.from(itemsNode.querySelectorAll("[data-href]")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedHref = button.dataset.href
      renderItems()
      renderSelected()
    })
  })
}

const renderSelected = () => {
  const item = currentItem()
  if (!item) return

  titleNode.textContent = item.title
  metaNode.textContent = `更新于 ${formatDate(item.updatedAt)}`
  summaryNode.textContent = item.summary
  frameNode.src = item.href
  openNode.href = item.href
}

const init = async () => {
  const data = await fetchJson("./data.json")
  state.items = data.items || []
  state.selectedHref = state.items[0]?.href ?? null
  renderMetrics(state.items)
  renderItems()
  renderSelected()
}

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  summaryNode.textContent = error.message
})
