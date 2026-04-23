const API_BASE =
  window.TRAINING_SURVEY_CONFIG?.apiBase ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8022"
    : "https://survey-api.liruijian.com");

const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");
const refreshButton = document.getElementById("refreshButton");
const exportButton = document.getElementById("exportButton");
const tableBody = document.getElementById("tableBody");
const totalCount = document.getElementById("totalCount");
const withProjectCount = document.getElementById("withProjectCount");
const followupCount = document.getElementById("followupCount");
const detailModal = document.getElementById("detailModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalButton = document.getElementById("closeModalButton");
const detailTitle = document.getElementById("detailTitle");
const detailList = document.getElementById("detailList");

let adminPassword = "";
let registrations = [];

function escapeHtml(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}

function parseMaybeJson(value) {
  if (!value) return "—";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.length ? parsed.join("、") : "—";
    return String(parsed);
  } catch {
    return String(value);
  }
}

function getAuthHeaders() {
  const token = btoa(unescape(encodeURIComponent(`admin:${adminPassword}`)));
  return {
    Authorization: `Basic ${token}`,
  };
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("密码错误");
    }
    throw new Error("加载失败，请稍后重试");
  }

  return response.json();
}

function renderStats(items) {
  totalCount.textContent = String(items.length);
  withProjectCount.textContent = String(items.filter((item) => item.has_project && item.has_project !== "先体验再说").length);
  followupCount.textContent = String(
    items.filter((item) => item.followup_interest && item.followup_interest !== "先参加本次体验营").length,
  );
}

function openModal(item) {
  detailTitle.textContent = `${item.name} · 报名详情`;
  const rows = [
    ["提交时间", formatDate(item.submitted_at)],
    ["手机", item.phone || "—"],
    ["微信", item.wechat || "—"],
    ["院系 / 部门", item.department || "—"],
    ["职称 / 年级", item.title_or_grade || "—"],
    ["身份", item.identity || "—"],
    ["体育角色", item.sports_role || "—"],
    ["专项 / 研究方向", item.sports_specialty || "—"],
    ["从业时间", item.experience_years || "—"],
    ["AI工具", parseMaybeJson(item.ai_tools)],
    ["AI频率", item.ai_frequency || "—"],
    ["AI熟练度", item.ai_confidence || "—"],
    ["AI用途", parseMaybeJson(item.ai_use_cases)],
    ["AI问题", item.ai_biggest_problem || "—"],
    ["工作场景", parseMaybeJson(item.work_scenes)],
    ["最大痛点", item.biggest_pain || "—"],
    ["当前做法", item.current_solution || "—"],
    ["服务对象", item.target_audience || "—"],
    ["首选赛道", item.preferred_track || "—"],
    ["感兴趣场景", parseMaybeJson(item.scenario_choices)],
    ["优先场景", item.primary_scenario || item.custom_scenario || "—"],
    ["预期成果", item.want_to_build || "—"],
    ["训练营目标", item.goal_after_camp || "—"],
    ["项目状态", item.has_project || "—"],
    ["项目描述", item.project_description || "—"],
    ["展示意愿", item.showcase_willingness || "—"],
    ["后续意向", item.followup_interest || "—"],
    ["推动权限", item.decision_power || "—"],
    ["每周投入时间", item.weekly_hours || "—"],
  ];

  detailList.innerHTML = rows
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <div class="detail-label">${escapeHtml(label)}</div>
          <div class="detail-value">${escapeHtml(value)}</div>
        </div>`,
    )
    .join("");

  detailModal.hidden = false;
}

function closeModal() {
  detailModal.hidden = true;
}

function renderTable(items) {
  if (!items.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">暂无提交记录。</td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = items
    .map(
      (item, index) => `
        <tr data-index="${index}">
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.identity || "—")}<br /><span>${escapeHtml(item.department || "—")}</span></td>
          <td>${escapeHtml(item.biggest_pain || "—")}</td>
          <td>${escapeHtml(item.primary_scenario || item.custom_scenario || "—")}</td>
          <td>${escapeHtml(item.want_to_build || "—")}</td>
          <td>${escapeHtml(formatDate(item.submitted_at))}</td>
        </tr>`,
    )
    .join("");

  tableBody.querySelectorAll("tr[data-index]").forEach((row) => {
    row.addEventListener("click", () => {
      const item = registrations[Number(row.dataset.index)];
      if (item) openModal(item);
    });
  });
}

async function loadRegistrations() {
  refreshButton.disabled = true;
  refreshButton.textContent = "刷新中...";
  registrations = await fetchJson("/api/registrations");
  renderStats(registrations);
  renderTable(registrations);
  refreshButton.disabled = false;
  refreshButton.textContent = "刷新";
}

async function login() {
  loginError.textContent = "";
  const password = passwordInput.value.trim();
  if (!password) {
    loginError.textContent = "请输入管理员密码";
    return;
  }

  adminPassword = password;
  loginButton.disabled = true;
  loginButton.textContent = "验证中...";

  try {
    await loadRegistrations();
    loginCard.hidden = true;
    dashboard.hidden = false;
  } catch (error) {
    loginError.textContent = error instanceof Error ? error.message : "登录失败";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "进入后台";
  }
}

async function exportCsv() {
  exportButton.disabled = true;
  exportButton.textContent = "导出中...";

  try {
    const response = await fetch(`${API_BASE}/api/registrations/export/csv`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(response.status === 403 ? "密码错误" : "导出失败");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "registrations.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error instanceof Error ? error.message : "导出失败");
  } finally {
    exportButton.disabled = false;
    exportButton.textContent = "导出 CSV";
  }
}

loginButton.addEventListener("click", login);
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});
refreshButton.addEventListener("click", loadRegistrations);
exportButton.addEventListener("click", exportCsv);
modalBackdrop.addEventListener("click", closeModal);
closeModalButton.addEventListener("click", closeModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detailModal.hidden) closeModal();
});
