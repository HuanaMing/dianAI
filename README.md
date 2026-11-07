# dianAI

dianAI 是部署於 Cloudflare 的網站專案。目前提供靜態網站與 Google 帳號登入入口；Better Auth Worker 整合及單一遠端 D1 schema 已完成設定。Google OAuth 憑證與 Worker Secrets 尚未設定，因此尚不能完成真實登入。

## 專案現況

- 網站內容：由 `site/` 提供。
- 靜態資產：由 `assets/` 提供。
- Cloudflare Worker：`src/index.js` 將 `/api/auth/*` 交給 Better Auth，其餘請求交給 Static Assets binding。
- Better Auth：`cloudflare/src/auth.js` 建立 Google OAuth 與 D1 Auth 設定。
- D1 schema：`cloudflare/migrations/0001_better_auth.sql`。
- 建置與測試：使用 Node.js，設定位於 `cloudflare/package.json`。
- 部署平台：Cloudflare Workers Static Assets，使用 Wrangler。
- 驗證：包含網站建置與 Worker Auth 路由 smoke tests；Cloudflare Preview 頁面載入與桌面 UI 檢查已完成；真實 Google OAuth 流程尚未測試。

## 目錄結構

| 路徑 | 用途 |
| --- | --- |
| `.github/workflows/` | GitHub Actions 自動執行網站測試 |
| `assets/` | 網站靜態資產來源 |
| `site/` | 網站 HTML 來源，目前包含 Google 登入介面 |
| `src/index.js` | Cloudflare Worker 入口與 Auth 路由 |
| `cloudflare/src/auth.js` | Better Auth、Google OAuth 與 D1 binding 設定 |
| `cloudflare/` | Wrangler 設定、建置腳本、部署輸出與套件設定 |
| `cloudflare/migrations/` | D1 schema migration |
| `cloudflare/public/` | 建置產生的 Static Assets，不直接編輯 |
| `tests/` | Node.js smoke tests |
| `AUTHENTICATION_PLAN.md` | Google 登入與公開註冊規劃及實作狀態 |
| `AGENTS.md` | 專案 Agent 規範入口，連結至工作區共用規範 |

## 本機需求

- Node.js 24（與 GitHub Actions 測試環境一致）
- npm
- Wrangler 依賴由 `cloudflare/package.json` 管理

## 建置與測試

在 PowerShell 執行：

```powershell
Set-Location C:\AI-Workspace\dianAI\cloudflare
npm install
npm test
```

`npm test` 會先執行 `build.mjs`，將 `site/index.html` 與 `assets/` 複製到 `cloudflare/public/`，再執行網站及 Worker Auth 路由 smoke tests。

## 本機 Auth 設定

1. 複製 `cloudflare/.dev.vars.example` 為 `cloudflare/.dev.vars`。
2. 使用隨機產生且至少 32 字元的 `BETTER_AUTH_SECRET`。
3. 填入 Google OAuth Client ID／Secret；本機 Callback URL 為 `http://localhost:8787/api/auth/callback/google`。
4. 在本機 D1 套用 migration：

```powershell
Set-Location C:\AI-Workspace\dianAI\cloudflare
npm run db:migrate:local
npm run dev
```

`.dev.vars` 已加入 Git 忽略清單，不得提交真實憑證。若未設定 D1 或必要環境變數，Auth 路由會回傳 503，不會退回無資料庫的登入模式。

## Cloudflare D1 與環境設定

本專案只使用一個 Cloudflare D1 遠端資料庫，維持單一資料庫的免費方案用量策略：

- D1 名稱：`dianai-db`。
- D1 ID：`43029c56-82fe-4593-a224-3a497ad377a8`。
- Binding：`DB`。
- Production 與 Wrangler `preview` 環境都指向同一個 D1；兩者**共用使用者、Session 與所有應用資料**，沒有資料隔離。Preview 測試不得建立、修改或刪除真實使用者資料。
- 本機開發使用 Wrangler 的本機 D1 狀態，與遠端 `dianai-db` 分開。
- `cloudflare/migrations/0001_better_auth.sql` 已套用至遠端 D1，建立 Better Auth 的 `user`、`session`、`account`、`verification` 四張資料表及索引；Wrangler migration tracking 記錄為 `0001_better_auth.sql`。
- 本機套用 Migration：`npm run db:migrate:local`。
- 遠端套用 Migration：`npm run db:migrate:remote`。單一遠端資料庫只需套用一次，不要分別對 Preview／Production 重複執行。

Worker 必須設定 `BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`；可信任來源可用 `BETTER_AUTH_TRUSTED_ORIGINS` 額外指定。Google OAuth Callback：`<環境網域>/api/auth/callback/google`。

`diangarden-saves` 是其他用途的資料庫，不會拿來當 dianAI Auth 資料庫。Cloudflare Preview Worker 已部署：https://dianai-preview.ry15968.workers.dev；Production Worker 已部署：https://dianai.ry15968.workers.dev。Production 部署版本為 be72fa5e-5e7b-41e6-9ea8-1c153b1920b9，Production 首頁 smoke test 回應 HTTP 200。Production 與 Preview 的 Auth 都尚未設定 Worker Secrets，Auth endpoint 目前預期回傳 HTTP 503；真實 Google OAuth 尚未啟用或驗證。Preview 與 Production 共用正式 D1，因此不得在 Preview 執行 OAuth Callback、註冊、登入或其他會寫入使用者資料的測試。TinyFish 桌面版唯讀檢查及主人初步人工檢視已完成；手機版與無障礙檢查尚未完成。
## 本機預覽與部署

```powershell
Set-Location C:\AI-Workspace\dianAI\cloudflare

# 本機開發
npm run dev

# Wrangler Preview（Preview 與 Production 共用 D1，測試不得寫入正式資料）
npm run preview

# 正式部署（必須先取得主人明確核准）
npm run deploy
```

正式部署前必須先通過 `npm test`，並完成下方發布流程。Preview 與 Production 的環境變數、Secrets、OAuth Callback 網址必須分開確認；不得將機密寫入前端或 Git。

目前 Production Worker 已部署，但 Worker Secrets 尚未設定，Auth endpoint 回傳 HTTP 503，代表真實登入尚未開放。設定 Production Secrets 會啟用正式 Google 登入／公開註冊，必須在 OAuth 測試與正式啟用檢查完成後另行取得主人明確核准。

## Git 與發布流程

- 以功能分支承載變更；透過 Pull Request 對照 `main`。
- 不覆蓋既有未提交變更；提交前檢查完整 diff 與機密資訊。
- 發布關卡：**Branch → Cloudflare Preview → TinyFish → 人工審查 → Merge → Production**。
- 每次修改先執行適當測試；部署前必須完成 Preview 與 TinyFish 驗收。
- Merge 與 Production 部署都必須取得主人明確核准；未核准不得執行。

## Graphify 專案地圖

dianAI 已註冊 Graphify 專案索引：

- Project ID：`dianAI`
- 原始程式：`C:\AI-Workspace\dianAI`
- 索引輸出：`C:\AI-Workspace\indexes\graphify\dianAI\graphify-out\graph.json`
- 互動地圖：同目錄的 `graph.html`
- 索引只放在工作區 `indexes/`，不放進本專案 Git 儲存庫。

程式碼結構有實質變更（新增／刪除模組、改變匯入或呼叫關係、調整 Worker 路由或主要資料流）後，應更新 Graphify 程式碼索引。單純修改文案、註解或樣式且不影響程式結構時，不必重建地圖。

在 PowerShell 執行：

```powershell
$Graphify = Join-Path $env:USERPROFILE '.local\bin\graphify.exe'
$env:GRAPHIFY_OUT = 'C:\AI-Workspace\indexes\graphify\dianAI\graphify-out'

& $Graphify update 'C:\AI-Workspace\dianAI'
& $Graphify export html --graph (Join-Path $env:GRAPHIFY_OUT 'graph.json')
```

更新後確認 Graphify 輸出成功、`graph.json` 可讀取、已刪除來源不再出現在節點中，並檢查 `graph.html` 已更新。Graphify 只輔助理解程式；仍須閱讀原始程式並執行測試。若索引更新失敗，必須回報失敗，不可把舊地圖說成最新。

## Agent 工作規範

請先閱讀工作區共用規範 [AGENTS.md](../AGENTS.md)，再依本 README 的專案設定執行。專案入口文件為 [AGENTS.md](AGENTS.md)。

---
