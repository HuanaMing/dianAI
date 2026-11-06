const hostname = document.querySelector("#hostname");
const clientTime = document.querySelector("#client-time");
const healthDot = document.querySelector("#health-dot");
const healthLabel = document.querySelector("#health-label");
const healthDetail = document.querySelector("#health-detail");
const healthRefresh = document.querySelector("#health-refresh");

hostname.textContent = window.location.host;
clientTime.textContent = new Date().toLocaleString("zh-TW");

async function checkHealth() {
  healthRefresh.disabled = true;
  healthLabel.textContent = "檢查中";
  healthDetail.textContent = "正在確認 Worker API 是否正常回應。";
  healthDot.style.background = "#e7c77f";

  try {
    const response = await fetch("/health", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    healthDot.style.background = "#54e0ae";
    healthLabel.textContent = "運作正常";
    healthDetail.textContent = `Worker 已回應 · ${new Date(data.timestamp).toLocaleTimeString("zh-TW")}`;
  } catch (error) {
    healthDot.style.background = "#fb7185";
    healthLabel.textContent = "檢查失敗";
    healthDetail.textContent = error.message || "無法連線到 /health";
  } finally {
    healthRefresh.disabled = false;
  }
}

healthRefresh.addEventListener("click", checkHealth);
checkHealth();

let count = 0;
document.querySelector("#count-button").addEventListener("click", () => {
  count += 1;
  document.querySelector("#count").textContent = String(count);
  document.querySelector("#interaction-feedback").textContent = `互動成功！目前已觸發 ${count} 次。`;
});
