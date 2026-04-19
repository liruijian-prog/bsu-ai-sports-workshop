(() => {
  const form = document.querySelector('#training-signup-form')

  if (!(form instanceof HTMLFormElement)) {
    return
  }

  const statusBanner = document.querySelector('#training-form-status')
  const resultCard = document.querySelector('#training-form-result')
  const resetButton = document.querySelector('#training-form-reset')
  const copyButton = document.querySelector('#training-copy-summary')
  const downloadJsonButton = document.querySelector('#training-download-json')
  const exportCsvButton = document.querySelector('#training-export-csv')

  const resultReference = document.querySelector('#result-reference')
  const resultTrack = document.querySelector('#result-track')
  const resultScene = document.querySelector('#result-scene')
  const resultCollaboration = document.querySelector('#result-collaboration')
  const resultNote = document.querySelector('#result-note')

  if (
    !(statusBanner instanceof HTMLElement) ||
    !(resultCard instanceof HTMLElement) ||
    !(resetButton instanceof HTMLButtonElement) ||
    !(copyButton instanceof HTMLButtonElement) ||
    !(downloadJsonButton instanceof HTMLButtonElement) ||
    !(exportCsvButton instanceof HTMLButtonElement) ||
    !(resultReference instanceof HTMLElement) ||
    !(resultTrack instanceof HTMLElement) ||
    !(resultScene instanceof HTMLElement) ||
    !(resultCollaboration instanceof HTMLElement) ||
    !(resultNote instanceof HTMLElement)
  ) {
    return
  }

  const STORAGE_KEY = 'bsu-ai-training-signups'
  const TRAINING_DATE = '20260426'

  const labelMaps = {
    role: {
      student: '学生',
      teacher: '教师',
      coach: '教练',
      researcher: '科研人员',
      manager: '项目 / 管理人员',
    },
    audience_type: {
      bsu_student: '北体学生',
      bsu_teacher: '北体教师',
      bsu_staff: '北体教职工',
      external: '校外意向报名',
    },
    ai_experience: {
      new: '刚开始接触',
      light: '零散使用过',
      medium: '已开始稳定使用',
      high: '可独立推进小型成果',
    },
    priority_scene: {
      teaching: '教学课程',
      research: '科研论文 / 资料整理',
      training: '训练执教 / 复盘',
      operations: '赛事管理 / 项目组织',
      exchange: '国际交流 / 双语资料 / 对外展示',
    },
    expected_outcome: {
      page: '可展示的页面',
      assistant: '助手或工作流程',
      organize: '资料、数据和流程组织',
      explore: '现场明确方向并确定成果形式',
    },
    materials_ready: {
      none: '暂无成型材料',
      notes: '已有零散笔记或截图',
      structured: '已有表格、记录、数据或论文材料',
      package: '已有较完整材料包',
    },
    full_day: {
      yes: '可以全程参加',
      maybe: '大概率可以，仍需协调',
      no: '暂时无法确认',
    },
    collaboration_interest: {
      yes: '希望继续联合推进应用开发',
      maybe: '可进一步沟通',
      no: '暂时以参加培训为主',
    },
  }

  let currentReceipt = null
  const optionalEmailControl = form.querySelector('input[name="email"]')

  const requiredControls = Array.from(
    form.querySelectorAll('input[required], select[required], textarea[required]'),
  ).filter((control) => !(control instanceof HTMLInputElement && control.type === 'radio'))

  const requiredGroups = Array.from(form.querySelectorAll('[data-required-group]')).filter(
    (group) => group instanceof HTMLFieldSetElement,
  )

  const statusVariants = ['is-success', 'is-error', 'is-loading']

  const getLabel = (group, value) => {
    if (!value) {
      return '未填写'
    }

    return labelMaps[group]?.[value] ?? value
  }

  const makeStatusLine = (tag, text) => {
    const element = document.createElement(tag)
    element.textContent = text
    return element
  }

  const showStatus = (type, title, description) => {
    statusBanner.hidden = false
    statusBanner.classList.remove(...statusVariants)

    if (type) {
      statusBanner.classList.add(type)
    }

    statusBanner.replaceChildren(
      makeStatusLine('strong', title),
      makeStatusLine('span', description),
    )
  }

  const hideStatus = () => {
    statusBanner.hidden = true
    statusBanner.classList.remove(...statusVariants)
    statusBanner.replaceChildren()
  }

  const showResult = () => {
    resultCard.hidden = false
  }

  const hideResult = () => {
    resultCard.hidden = true
    resultReference.textContent = '-'
    resultTrack.textContent = '-'
    resultScene.textContent = '-'
    resultCollaboration.textContent = '-'
    resultNote.textContent = ''
  }

  const getStoredSubmissions = () => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY)

      if (!rawValue) {
        return []
      }

      const parsed = JSON.parse(rawValue)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }

  const saveStoredSubmissions = (submissions) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
      return true
    } catch (error) {
      return false
    }
  }

  const downloadBlob = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 0)
  }

  const createReference = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      .toUpperCase()
      .slice(-6)

    return `BSU-${TRAINING_DATE}-${seed}`
  }

  const computeTrack = (payload) => {
    const hasMaterials = ['structured', 'package'].includes(payload.materials_ready)
    const hasExperience = ['medium', 'high'].includes(payload.ai_experience)
    const needsWarmup = ['new', 'light'].includes(payload.ai_experience)
    const needsTemplate = ['none', 'notes'].includes(payload.materials_ready)

    if (needsWarmup && needsTemplate) {
      return {
        name: '入门带练路径',
        note: '建议从现成模板进入，先把一个体育场景完整跑通，再围绕个人需求调整内容与结构。',
      }
    }

    if (
      payload.priority_scene === 'operations' ||
      payload.priority_scene === 'exchange' ||
      payload.expected_outcome === 'organize'
    ) {
      return {
        name: '流程改造路径',
        note: '适合把通知、资料、排期、双语内容和协同流程重新组织成更清晰的工作链路。',
      }
    }

    if (hasMaterials && hasExperience) {
      return {
        name: '进阶成果路径',
        note: '适合直接围绕已有材料推进成果表达，在现场完成结构重组、功能迭代与展示优化。',
      }
    }

    return {
      name: '场景落地路径',
      note: '适合先明确问题边界，再把已有材料和模板拼接成可继续推进的一版成果。',
    }
  }

  const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')

  const markControlInvalid = (control) => {
    control.setAttribute('aria-invalid', 'true')
    control.closest('.field')?.classList.add('is-invalid')
  }

  const clearControlInvalid = (control) => {
    control.removeAttribute('aria-invalid')
    control.closest('.field')?.classList.remove('is-invalid')
  }

  const markGroupInvalid = (group) => {
    group.classList.add('is-invalid')
    group.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.setAttribute('aria-invalid', 'true')
    })
  }

  const clearGroupInvalid = (group) => {
    group.classList.remove('is-invalid')
    group.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.removeAttribute('aria-invalid')
    })
  }

  const clearValidationState = () => {
    requiredControls.forEach((control) => {
      clearControlInvalid(control)
    })

    requiredGroups.forEach((group) => {
      clearGroupInvalid(group)
    })
  }

  const validateForm = () => {
    clearValidationState()

    let firstInvalid = null

    requiredControls.forEach((control) => {
      const value = normalizeText(control.value)

      if (!value) {
        markControlInvalid(control)
        firstInvalid = firstInvalid ?? control
        return
      }

      if (control instanceof HTMLInputElement && control.type === 'email' && !control.checkValidity()) {
        markControlInvalid(control)
        firstInvalid = firstInvalid ?? control
      }
    })

    requiredGroups.forEach((group) => {
      const groupName = group.dataset.requiredGroup

      if (!groupName) {
        return
      }

      const checked = form.querySelector(`input[name="${groupName}"]:checked`)

      if (!checked) {
        markGroupInvalid(group)
        firstInvalid = firstInvalid ?? group.querySelector(`input[name="${groupName}"]`)
      }
    })

    if (
      optionalEmailControl instanceof HTMLInputElement &&
      normalizeText(optionalEmailControl.value) &&
      !optionalEmailControl.checkValidity()
    ) {
      markControlInvalid(optionalEmailControl)
      firstInvalid = firstInvalid ?? optionalEmailControl
    }

    return {
      isValid: firstInvalid === null,
      firstInvalid,
    }
  }

  const getFormValue = (formData, key) => normalizeText(String(formData.get(key) ?? ''))

  const buildPayload = () => {
    const formData = new FormData(form)

    return {
      name: getFormValue(formData, 'name'),
      organization: getFormValue(formData, 'organization'),
      role: getFormValue(formData, 'role'),
      contact: getFormValue(formData, 'contact'),
      email: getFormValue(formData, 'email'),
      audience_type: getFormValue(formData, 'audience_type'),
      scenario: getFormValue(formData, 'scenario'),
      notes: getFormValue(formData, 'notes'),
      ai_experience: getFormValue(formData, 'ai_experience'),
      priority_scene: getFormValue(formData, 'priority_scene'),
      expected_outcome: getFormValue(formData, 'expected_outcome'),
      materials_ready: getFormValue(formData, 'materials_ready'),
      full_day: getFormValue(formData, 'full_day'),
      collaboration_interest: getFormValue(formData, 'collaboration_interest'),
    }
  }

  const buildReceipt = (payload) => {
    const track = computeTrack(payload)

    return {
      reference: createReference(),
      submittedAt: new Date().toISOString(),
      trainingDate: '2026-04-26',
      payload,
      labels: {
        role: getLabel('role', payload.role),
        audienceType: getLabel('audience_type', payload.audience_type),
        aiExperience: getLabel('ai_experience', payload.ai_experience),
        priorityScene: getLabel('priority_scene', payload.priority_scene),
        expectedOutcome: getLabel('expected_outcome', payload.expected_outcome),
        materialsReady: getLabel('materials_ready', payload.materials_ready),
        fullDay: getLabel('full_day', payload.full_day),
        collaborationInterest: getLabel('collaboration_interest', payload.collaboration_interest),
      },
      recommendation: track,
      submissionMode: 'local',
    }
  }

  const persistReceipt = (receipt) => {
    const submissions = getStoredSubmissions()
    submissions.push(receipt)
    return saveStoredSubmissions(submissions)
  }

  const syncToEndpoint = async (receipt) => {
    const endpoint = form.dataset.submitEndpoint?.trim()

    if (!endpoint) {
      return { mode: 'local', detail: '当前站点为静态页，信息已保存在本机浏览器，可直接导出。' }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receipt),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return { mode: 'remote', detail: '报名信息已同步到报名端，同时保留本机留档。' }
  }

  const renderReceipt = (receipt, syncDetail) => {
    resultReference.textContent = receipt.reference
    resultTrack.textContent = receipt.recommendation.name
    resultScene.textContent = receipt.labels.priorityScene
    resultCollaboration.textContent = receipt.labels.collaborationInterest
    resultNote.textContent =
      `${receipt.recommendation.note} ${syncDetail}`.trim()

    showResult()
  }

  const getReceiptSummary = (receipt) => {
    return [
      `AI+体育能力跃迁培训报名回执`,
      `回执编号：${receipt.reference}`,
      `姓名：${receipt.payload.name}`,
      `院系 / 单位：${receipt.payload.organization}`,
      `身份角色：${receipt.labels.role}`,
      `参训身份：${receipt.labels.audienceType}`,
      `重点场景：${receipt.labels.priorityScene}`,
      `建议训练路径：${receipt.recommendation.name}`,
      `合作意向：${receipt.labels.collaborationInterest}`,
      `联系方式：${receipt.payload.contact}`,
      `提交时间：${receipt.submittedAt}`,
    ].join('\n')
  }

  const toCsv = (records) => {
    const rows = [
      [
        'reference',
        'submittedAt',
        'name',
        'organization',
        'role',
        'contact',
        'email',
        'audienceType',
        'priorityScene',
        'expectedOutcome',
        'materialsReady',
        'fullDay',
        'collaborationInterest',
        'track',
        'scenario',
        'notes',
      ],
    ]

    records.forEach((record) => {
      rows.push([
        record.reference,
        record.submittedAt,
        record.payload?.name ?? '',
        record.payload?.organization ?? '',
        record.labels?.role ?? '',
        record.payload?.contact ?? '',
        record.payload?.email ?? '',
        record.labels?.audienceType ?? '',
        record.labels?.priorityScene ?? '',
        record.labels?.expectedOutcome ?? '',
        record.labels?.materialsReady ?? '',
        record.labels?.fullDay ?? '',
        record.labels?.collaborationInterest ?? '',
        record.recommendation?.name ?? '',
        record.payload?.scenario ?? '',
        record.payload?.notes ?? '',
      ])
    })

    return rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')
  }

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const helper = document.createElement('textarea')
    helper.value = text
    helper.setAttribute('readonly', 'true')
    helper.style.position = 'fixed'
    helper.style.opacity = '0'
    document.body.append(helper)
    helper.select()
    document.execCommand('copy')
    helper.remove()
  }

  const setSubmitting = (isSubmitting) => {
    const submitButtons = Array.from(form.querySelectorAll('button[type="submit"]'))
    submitButtons.forEach((button) => {
      if (button instanceof HTMLButtonElement) {
        button.disabled = isSubmitting
      }
    })

    resetButton.disabled = isSubmitting
  }

  form.addEventListener('input', (event) => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      clearControlInvalid(target)
    }
  })

  form.addEventListener('change', (event) => {
    const target = event.target

    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') {
      return
    }

    const group = target.closest('[data-required-group]')

    if (group instanceof HTMLFieldSetElement) {
      clearGroupInvalid(group)
    }
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const validation = validateForm()

    if (!validation.isValid) {
      showStatus(
        'is-error',
        '还有信息未填写完整',
        '请补全报名信息和预问卷后再提交，红色高亮处为当前需要处理的内容。',
      )

      validation.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      validation.firstInvalid?.focus({ preventScroll: true })
      return
    }

    const payload = buildPayload()
    const receipt = buildReceipt(payload)
    currentReceipt = receipt

    setSubmitting(true)
    showStatus('is-loading', '正在生成回执', '系统正在整理报名信息，并生成训练建议。')

    let syncDetail = '当前站点为静态页，信息已保存在本机浏览器，可直接导出。'
    let syncState = 'local'

    try {
      const syncResult = await syncToEndpoint(receipt)
      syncDetail = syncResult.detail
      syncState = syncResult.mode
    } catch (error) {
      syncDetail = '远端接口暂未响应，信息已先保存在本机浏览器，可继续导出或稍后同步。'
      syncState = 'fallback'
    }

    receipt.submissionMode = syncState
    const savedLocally = persistReceipt(receipt)

    if (!savedLocally) {
      syncDetail = '当前浏览器未完成本机保存。你仍可立即下载 JSON 回执，但如需长期留档，建议尽快接入真实提交接口。'

      if (syncState === 'local') {
        syncState = 'storage_unavailable'
      }
    }

    receipt.submissionMode = syncState
    renderReceipt(receipt, syncDetail)

    showStatus(
      syncState === 'fallback' || syncState === 'storage_unavailable' ? 'is-error' : 'is-success',
      '报名信息已生成回执',
      syncDetail,
    )

    setSubmitting(false)
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  resetButton.addEventListener('click', () => {
    form.reset()
    clearValidationState()
    hideStatus()
    hideResult()
    currentReceipt = null
  })

  copyButton.addEventListener('click', async () => {
    if (!currentReceipt) {
      showStatus('is-error', '暂无可复制内容', '请先提交报名信息并生成回执。')
      return
    }

    try {
      await copyText(getReceiptSummary(currentReceipt))
      showStatus('is-success', '回执摘要已复制', '可以直接粘贴到微信、邮件或报名汇总表中。')
    } catch (error) {
      showStatus('is-error', '复制失败', '当前浏览器未完成复制操作，请改用 JSON 或 CSV 导出。')
    }
  })

  downloadJsonButton.addEventListener('click', () => {
    if (!currentReceipt) {
      showStatus('is-error', '暂无可下载回执', '请先提交报名信息并生成回执。')
      return
    }

    downloadBlob(
      `${currentReceipt.reference}.json`,
      `${JSON.stringify(currentReceipt, null, 2)}\n`,
      'application/json;charset=utf-8',
    )

    showStatus('is-success', 'JSON 回执已下载', '可直接发送给联系人，或作为后续导入真实报名系统的原始数据。')
  })

  exportCsvButton.addEventListener('click', () => {
    const submissions = getStoredSubmissions()

    if (submissions.length === 0) {
      showStatus('is-error', '暂无可导出的记录', '当前浏览器里还没有报名数据，请先完成至少一次提交。')
      return
    }

    downloadBlob(
      `bsu-training-signups-${TRAINING_DATE}.csv`,
      `${toCsv(submissions)}\n`,
      'text/csv;charset=utf-8',
    )

    showStatus(
      'is-success',
      'CSV 记录已导出',
      `当前浏览器中的 ${submissions.length} 条报名记录已导出，可直接用于汇总和筛选。`,
    )
  })

  hideStatus()
  hideResult()
})()
