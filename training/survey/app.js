const API_BASE =
  window.TRAINING_SURVEY_CONFIG?.apiBase ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8022"
    : "https://survey-api.liruijian.com");

const form = document.getElementById("surveyForm");
const errorBanner = document.getElementById("errorBanner");
const submitButton = document.getElementById("submitButton");
const successCard = document.getElementById("successCard");
const successSummary = document.getElementById("successSummary");
const resetButton = document.getElementById("resetButton");

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function getCheckboxValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function clearInvalid() {
  form.querySelectorAll(".invalid").forEach((element) => element.classList.remove("invalid"));
}

function showError(message, fieldIds = []) {
  errorBanner.hidden = false;
  errorBanner.textContent = message;
  clearInvalid();
  fieldIds.forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.classList.add("invalid");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearError() {
  errorBanner.hidden = true;
  errorBanner.textContent = "";
  clearInvalid();
}

function validatePayload(payload) {
  if (!payload.name) return { message: "请填写姓名", fieldIds: ["name"] };
  if (!payload.phone) return { message: "请填写手机号", fieldIds: ["phone"] };
  if (!payload.biggest_pain) return { message: "请填写当前最真实、最耗时的体育工作问题", fieldIds: ["biggest_pain"] };
  if (!payload.primary_scenario && !payload.custom_scenario) {
    return { message: "请至少确认一个优先场景", fieldIds: ["primary_scenario", "custom_scenario"] };
  }
  if (!payload.want_to_build) return { message: "请填写你希望当天做出的成果", fieldIds: ["want_to_build"] };
  return null;
}

function buildPayload() {
  return {
    name: getValue("name"),
    department: getValue("department"),
    title_or_grade: getValue("title_or_grade"),
    phone: getValue("phone"),
    wechat: getValue("wechat"),
    identity: getValue("identity"),
    sports_role: getValue("sports_role"),
    sports_specialty: getValue("sports_specialty"),
    experience_years: getRadio("experience_years"),
    ai_tools: getCheckboxValues("ai_tools"),
    ai_frequency: getRadio("ai_frequency"),
    ai_confidence: getRadio("ai_confidence"),
    ai_use_cases: getCheckboxValues("ai_use_cases"),
    ai_biggest_problem: getValue("ai_biggest_problem"),
    work_scenes: getCheckboxValues("work_scenes"),
    biggest_pain: getValue("biggest_pain"),
    current_solution: getValue("current_solution"),
    target_audience: getValue("target_audience"),
    preferred_track: getRadio("preferred_track"),
    scenario_choices: getCheckboxValues("scenario_choices"),
    primary_scenario: getValue("primary_scenario"),
    custom_scenario: getValue("custom_scenario"),
    want_to_build: getValue("want_to_build"),
    goal_after_camp: getValue("goal_after_camp"),
    has_project: getRadio("has_project"),
    project_description: getValue("project_description"),
    showcase_willingness: getRadio("showcase_willingness"),
    followup_interest: getRadio("followup_interest"),
    decision_power: getRadio("decision_power"),
    weekly_hours: getRadio("weekly_hours"),
  };
}

function renderSuccess(payload) {
  const rows = [
    ["姓名", payload.name],
    ["手机", payload.phone],
    ["身份", payload.identity || "未填写"],
    ["优先场景", payload.primary_scenario || payload.custom_scenario || "未填写"],
    ["预期成果", payload.want_to_build],
  ];

  successSummary.innerHTML = `<dl>${rows
    .map(
      ([label, value]) => `
        <div>
          <dt>${label}</dt>
          <dd>${String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")}</dd>
        </div>`,
    )
    .join("")}</dl>`;

  successCard.hidden = false;
  form.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function submitForm(event) {
  event.preventDefault();
  clearError();

  const payload = buildPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    showError(validationError.message, validationError.fieldIds);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "提交中...";

  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("提交失败，请稍后重试");
    }

    renderSuccess(payload);
    form.reset();
  } catch (error) {
    showError(error instanceof Error ? error.message : "提交失败，请稍后重试");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交报名信息";
  }
}

form.addEventListener("submit", submitForm);

resetButton.addEventListener("click", () => {
  successCard.hidden = true;
  form.hidden = false;
  clearError();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
