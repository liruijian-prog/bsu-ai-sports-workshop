import {
  createBadge,
  fetchJson,
  formatDate,
  renderMarkdown,
  setActiveState,
} from "../common.js"

const metricsNode = document.querySelector("#scholarmind-metrics")
const projectsNode = document.querySelector("#scholarmind-projects")
const titleNode = document.querySelector("#scholarmind-title")
const metaNode = document.querySelector("#scholarmind-meta")
const tabsNode = document.querySelector("#scholarmind-tabs")
const bodyNode = document.querySelector("#scholarmind-body")

const TAB_LABELS = [
  { id: "overview", label: "总览" },
  { id: "literature", label: "文献" },
  { id: "analysis", label: "分析" },
  { id: "evidence", label: "证据" },
  { id: "writing", label: "写作" },
]

const state = {
  projects: [],
  selectedId: null,
  tab: "overview",
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
    metricCard(totals.analysis ?? 0, "分析结果"),
    metricCard(totals.writing ?? 0, "写作稿"),
  ].join("")
}

const currentProject = () => state.projects.find((item) => item.id === state.selectedId)

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
      state.tab = "overview"
      renderProjects()
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
  const notes = project.notes.length
    ? project.notes
        .slice(0, 4)
        .map(
          (item) => `
            <article class="note-card">
              <div class="badge-row">
                ${item.sourceLabel ? createBadge(item.sourceLabel, "neutral") : ""}
                ${createBadge(formatDate(item.createdAt), "neutral")}
              </div>
              <p class="note-line">${item.content}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">当前项目暂无公开研究笔记。</div>`

  bodyNode.innerHTML = `
    <div class="info-grid two-col">
      <article class="info-card">
        <h3>研究问题</h3>
        <p>${project.researchQuestion}</p>
      </article>
      <article class="info-card">
        <h3>项目状态</h3>
        <p>阶段 ${project.stage} · 创建于 ${formatDate(project.createdAt)} · 最近更新于 ${formatDate(project.updatedAt)}</p>
      </article>
    </div>
    <div class="info-grid two-col" style="margin-top: 14px;">
      <article class="info-card">
        <h3>内容分布</h3>
        <p>文献 ${project.counts.literature} · 分析 ${project.counts.analysis} · 证据 ${project.counts.evidence} · 笔记 ${project.counts.notes} · 写作 ${project.counts.writing}</p>
      </article>
      <article class="info-card">
        <h3>定位</h3>
        <p>${project.expectedContribution || "研究型工作台，强调文献、分析、证据与写作的连续联动。"}</p>
      </article>
    </div>
    <section style="margin-top: 18px;">
      <h3 class="section-title">最近研究笔记</h3>
      <div class="info-grid" style="margin-top: 12px;">
        ${notes}
      </div>
    </section>
  `
}

const renderLiterature = (project) => {
  if (!project.literature.length) {
    bodyNode.innerHTML = `<div class="empty-state">当前项目暂无公开文献。</div>`
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
          <h3 style="margin-top: 10px;">${item.title}</h3>
          <p>${(item.authors || []).join(" · ") || "作者信息待补充"}</p>
          <p class="note-line">${item.journal || "未标注期刊"} · 录入于 ${formatDate(item.createdAt)}</p>
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
    bodyNode.innerHTML = `<div class="empty-state">当前项目暂无公开分析结果。</div>`
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
          <h3 style="margin-top: 10px;">${item.question}</h3>
          <div class="viewer-markdown" data-analysis-body>${item.answer}</div>
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
    bodyNode.innerHTML = `<div class="empty-state">当前项目暂无公开证据片段。</div>`
    return
  }
  bodyNode.innerHTML = project.evidence
    .map(
      (item) => `
        <article class="quote-card">
          <div class="badge-row">
            ${item.literatureTitle ? createBadge(item.literatureTitle, "neutral") : ""}
            ${createBadge(`第 ${item.pageNumber} 页`, "warning")}
          </div>
          <blockquote style="margin-top: 12px;">${item.text}</blockquote>
          <p class="note-line" style="margin-top: 12px;">${item.label || "证据片段"} · ${formatDate(item.createdAt)}</p>
        </article>
      `,
    )
    .join("")
}

const renderWriting = (project) => {
  if (!project.writing.length) {
    bodyNode.innerHTML = `<div class="empty-state">当前项目暂无公开写作内容。</div>`
    return
  }
  const first = project.writing[0]
  bodyNode.innerHTML = `
    <div class="info-card">
      <div class="badge-row">
        ${createBadge(`${first.wordCount} 词`, "primary")}
        ${createBadge(`AI痕迹 ${first.aiTracePercentage}%`, "warning")}
        ${createBadge(`更新于 ${formatDate(first.updatedAt)}`, "neutral")}
      </div>
      <h3 style="margin-top: 10px;">${first.title}</h3>
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

const renderContent = () => {
  const project = currentProject()
  if (!project) return

  titleNode.textContent = project.title
  metaNode.textContent = `阶段 ${project.stage} · 最近更新于 ${formatDate(project.updatedAt)}`

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
  renderTabs()
  renderContent()
}

init().catch((error) => {
  titleNode.textContent = "页面加载失败"
  metaNode.textContent = "请稍后再试。"
  bodyNode.innerHTML = `<p>${error.message}</p>`
})
