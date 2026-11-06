# dianAI 架構（初始測試站）

## 執行流程

瀏覽器請求先進入 Cloudflare Worker（`src/index.js`）。

- `GET /health`：由 Worker 回傳健康狀態 JSON，供測試站確認 Worker 可正常執行。
- 其他路徑：交由 Wrangler 設定的 Static Assets binding（`ASSETS`）處理，靜態檔案根目錄為 `src/ui/`。

## 前端

`src/ui/` 目前只包含不依賴框架的 HTML、CSS 與 JavaScript：

- `index.html`：測試站結構。
- `styles.css`：桌面與行動版樣式。
- `app.js`：環境資訊、健康檢查及互動按鈕。

## 分支預覽原則

Cloudflare Workers Builds 的 branch Preview 用於人工檢查該分支版本。它本身不代表 PR 與 main 合併後的結果。Merge Preview 仍需額外建立合併結果的建置流程；本階段不實作該流程，也不觸碰正式部署。

## 後續擴充

正式功能尚未開始。新增功能時依 AGENTS.md 的模組職責放置程式碼，並維持 UI、資料模型、運算及場景之間的依賴方向清楚。
