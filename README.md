# dianAI

dianAI 是以 Cloudflare Workers 為執行環境的 Web 專案。目前先建立輕量的開發測試站，供 Git branch Preview 與人工驗收使用；正式遊戲或產品功能尚未接入。

## 開發

需求：Node.js 與 npm。

```bash
npm install
npm run dev
```

本機開發伺服器預設由 Wrangler 啟動。

## Preview

Cloudflare Workers Builds 使用 Wrangler Preview command 建立分支預覽。每個 branch 的 Preview URL 由 Cloudflare 管理。

```bash
npm run preview
```

正式部署命令：

```bash
npm run deploy
```

除非明確確認，請勿從功能分支執行正式部署。

## 路徑

- `src/index.js`：Worker request handler 與健康檢查 API。
- `src/ui/`：由 Cloudflare Static Assets 提供的測試網站。
- `src/model/`、`src/compute/`、`src/world/`：未來功能模組。
- `assets/`：未來共用的非 UI 靜態資源。
- `docs/`：架構及技術文件。
- `tasks/`：工作項目紀錄。

## 測試端點

- `/`：測試網站。
- `/health`：回傳 Worker 健康狀態 JSON。
