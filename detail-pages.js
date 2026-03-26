const body = document.body

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderMarkdownReaderDemo = () => {
  const buttons = Array.from(document.querySelectorAll('[data-doc-button]'))
  const title = document.querySelector('[data-reader-title]')
  const meta = document.querySelector('[data-reader-meta]')
  const bodyNode = document.querySelector('[data-reader-body]')
  const outlineNode = document.querySelector('[data-reader-outline]')

  if (!buttons.length || !title || !meta || !bodyNode || !outlineNode || typeof marked === 'undefined') {
    return
  }

  const documents = {
    policy: {
      title: '研究备忘：体育中外人文交流的政策框架',
      meta: '政策研究 · 文档阅读与研究整理',
      markdown: `# 研究备忘：体育中外人文交流的政策框架

## 研究问题

如何在国际组织倡议、国家政策与高校实践之间建立一条可分析、可比较的政策链条，是这一主题的核心问题。

## 资料结构

- 国际组织报告：观察全球议程与话语框架
- 国内政策文件：识别制度安排与执行逻辑
- 典型案例：比较不同项目中的组织模式与传播路径

## 初步判断

当前讨论往往停留在政策口号层面，真正有价值的工作在于把**政策目标、执行机制与项目产出**拆成可以持续比较的研究单元。

## 后续延展

下一步适合把政策文本、典型案例与高校项目页面放在同一阅读环境中，统一做批注、提纲与研究问题整理。`,
    },
    literature: {
      title: '文献梳理：AI 工具如何进入研究流程',
      meta: '文献综述 · 阅读、批注与写作准备',
      markdown: `# 文献梳理：AI 工具如何进入研究流程

## 主题

AI 工具不只是回答问题，更适合嵌入**资料筛选、问题拆解、结构整理与写作推进**这些研究节点。

## 观察

### 1. 资料处理环节

研究者最先需要的往往不是生成整篇文章，而是快速理解一批材料的异同、问题意识与证据结构。

### 2. 写作推进环节

如果能把分散笔记转成章节提纲、论证链与下一轮写作清单，AI 才真正进入研究工作流。

### 3. 工具设计环节

研究类工具应优先考虑：

- 文档阅读体验
- 分层笔记与批注
- 文献扩展与关键词链
- 写作任务拆解

## 结论

好的研究助手更像一张工作台，而不是一个单一对话框。`,
    },
    notes: {
      title: '项目札记：从文档阅读到研究助手',
      meta: '项目笔记 · Markdown Reader 与研究工作台',
      markdown: `# 项目札记：从文档阅读到研究助手

## 起点

很多研究工作其实从“读材料”开始，而不是从“提问题”开始。没有稳定的阅读环境，后续的问题设计和写作推进都会变得零散。

## 为什么采用 Markdown

Markdown 适合长期积累：

- 便于版本管理
- 便于结构化阅读
- 便于导出、整理与再利用

## 项目方向

Markdown Reader 负责把材料读清楚，AI 研究助手负责把材料变成研究问题、写作提纲与下一步任务。

## 对外使用场景

这个项目适合用于：

- 研究资料阅读
- 项目文档归档
- 政策文本比较
- 论文写作准备`,
    },
  }

  const buildOutline = (markdown) => {
    const items = Array.from(markdown.matchAll(/^##\s+(.+)$/gm)).map((match) => match[1].trim())
    if (!items.length) {
      outlineNode.innerHTML = '<h4>目录</h4><ul><li>当前文档未生成目录</li></ul>'
      return
    }

    outlineNode.innerHTML = `
      <h4>目录</h4>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    `
  }

  const activate = (id) => {
    const doc = documents[id]
    if (!doc) {
      return
    }

    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.docButton === id)
    })

    title.textContent = doc.title
    meta.textContent = doc.meta
    bodyNode.innerHTML = marked.parse(doc.markdown)
    buildOutline(doc.markdown)
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      activate(button.dataset.docButton)
    })
  })

  activate(buttons[0].dataset.docButton)
}

const renderResearchAssistantDemo = () => {
  const buttons = Array.from(document.querySelectorAll('[data-mode-button]'))
  const title = document.querySelector('[data-assistant-title]')
  const meta = document.querySelector('[data-assistant-meta]')
  const response = document.querySelector('[data-assistant-response]')
  const notes = document.querySelector('[data-assistant-notes]')

  if (!buttons.length || !title || !meta || !response || !notes) {
    return
  }

  const modes = {
    paper_review: {
      title: '文献拆解',
      meta: '围绕一篇文献拆解研究问题、方法、发现与局限',
      sections: [
        {
          heading: '研究问题',
          content:
            '这篇研究最重要的价值，不在于重复已有结论，而在于重新界定体育人文交流的分析单位：它把政策、组织与项目实践放在同一框架中讨论。',
        },
        {
          heading: '方法与证据',
          content:
            '适合继续追问的是资料来源是否足以支撑跨案例比较，以及研究结论究竟来自文本分析、案例访谈还是项目跟踪。',
        },
        {
          heading: '可继续延展的方向',
          content:
            '下一步可以补充国际组织报告、国内政策文件与高校实践案例三类材料，形成更完整的比较链条。',
        },
      ],
      notes: ['继续扩展相邻文献', '补充反例案例', '把问题转换为章节提纲'],
    },
    literature_expansion: {
      title: '扩展文献',
      meta: '围绕当前主题继续扩展关键词链、经典文献与争议点',
      sections: [
        {
          heading: '关键词链',
          content:
            '体育中外人文交流、sports diplomacy、public humanities、higher education exchange、international sports cooperation。',
        },
        {
          heading: '建议扩展路径',
          content:
            '先找国际组织与政策类文献，再补充高校与赛事案例研究，最后回到传播、组织与人才培养的应用层讨论。',
        },
        {
          heading: '争议点',
          content:
            '需要区分“政策表述中的交流”与“项目执行中的交流”，两者并不总是同步发生。',
        },
      ],
      notes: ['从政策文本进入', '补充案例研究', '追踪近三年新文献'],
    },
    data_strategy: {
      title: '数据与变量',
      meta: '围绕研究问题梳理数据来源、指标设计与可行性',
      sections: [
        {
          heading: '可用数据',
          content:
            '政策文件、项目名单、交流活动记录、合作院校信息、传播材料与项目成果报告，都可以作为结构化整理的起点。',
        },
        {
          heading: '变量设计',
          content:
            '可从项目类型、参与主体、合作层级、持续时间、产出形式和国际传播效果几个维度建立比较表。',
        },
        {
          heading: '风险提醒',
          content:
            '很多公开项目只展示成果，不展示过程数据，因此需要提前区分“可验证变量”与“叙述性信息”。',
        },
      ],
      notes: ['先搭变量表', '区分公开信息与内部数据', '保留可追溯出处'],
    },
    writing_guidance: {
      title: '写作推进',
      meta: '把已有笔记收束成章节结构、论证链与下一轮写作任务',
      sections: [
        {
          heading: '文章结构',
          content:
            '可以采用“问题提出 - 政策框架 - 案例比较 - 机制分析 - 结论与建议”的五段式结构。',
        },
        {
          heading: '本轮重点',
          content:
            '当前更适合先写清楚问题意识和比较框架，再补足案例与材料，不必一开始就追求篇幅完整。',
        },
        {
          heading: '下一步任务',
          content:
            '整理一份 800 字以内的写作提纲，列出每一节的核心论点、证据来源和需要继续补充的材料。',
        },
      ],
      notes: ['先写提纲', '再填材料', '保留下一轮追问列表'],
    },
  }

  const activate = (id) => {
    const mode = modes[id]
    if (!mode) {
      return
    }

    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.modeButton === id)
    })

    title.textContent = mode.title
    meta.textContent = mode.meta
    response.innerHTML = mode.sections
      .map(
        (section) => `
          <section>
            <h4>${escapeHtml(section.heading)}</h4>
            <p>${escapeHtml(section.content)}</p>
          </section>
        `,
      )
      .join('')
    notes.innerHTML = `
      <h4>后续动作</h4>
      <ul>${mode.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    `
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      activate(button.dataset.modeButton)
    })
  })

  activate(buttons[0].dataset.modeButton)
}

const setupRedirectPage = () => {
  const target = body.dataset.redirectTarget
  if (!target) {
    return
  }

  window.setTimeout(() => {
    window.location.replace(target)
  }, 180)
}

if (body?.dataset.page === 'research-projects') {
  renderMarkdownReaderDemo()
}

if (body?.dataset.page === 'ai-research-assistant') {
  renderResearchAssistantDemo()
}

if (body?.dataset.redirectTarget) {
  setupRedirectPage()
}
