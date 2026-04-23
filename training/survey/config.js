window.TRAINING_SURVEY_CONFIG = {
  apiBase:
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8022"
      : "https://bsu-ai-sports-workshop-production.up.railway.app",
};
