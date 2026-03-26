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
