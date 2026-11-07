# dianAI Google 登入與公開註冊規劃

> 狀態：Better Auth Worker 整合、單一遠端 D1 與初始 schema 已完成。Production Worker 已部署；Cloudflare Preview Worker 亦已部署；兩者首頁 smoke test 為 HTTP 200，Auth 因 Worker Secrets 尚未設定而安全回傳 HTTP 503。Production 部署版本為 be72fa5e-5e7b-41e6-9ea8-1c153b1920b9。Preview 與 Production 共用正式 D1，尚未執行真實 OAuth Callback 或登入測試；待先決定 OAuth 測試隔離策略。TinyFish 桌面版唯讀檢查及主人初步人工檢視已完成。

## 1. 產品目標與範圍

dianAI 將提供一般訪客自行註冊及登入，不採用內部人員白名單或預先邀請制。第一階段以 Google 帳號作為註冊與登入方式，提供：

- 一般訪客可直接使用 Google 帳號註冊，不需管理員預先建立帳號。
- 已註冊使用者可再次使用 Google 帳號登入。
- 使用者可登出，網站能正確顯示登入狀態。
- 伺服器端能驗證登入身分，供後續個人化功能與受保護 API 使用。

本階段不擴張為付費會員、管理員後台、角色權限或電子郵件／密碼登入。若未來需要這些功能，另行確認需求。

## 2. 已確認的技術決策

**正式採用 Better Auth + Google OAuth 2.0 + Cloudflare D1，部署於 Cloudflare Workers。**

| 責任 | 技術 | 用途 |
| --- | --- | --- |
| 身分驗證與 Session | Better Auth | 管理登入流程、使用者身分、帳號關聯及 Session |
| 第三方身分提供者 | Google OAuth 2.0 | 一般訪客使用 Google 帳號註冊及登入 |
| 應用程式執行環境 | Cloudflare Workers | 處理 Auth 路由、OAuth Callback 與受保護 API |
| 關聯式資料庫 | Cloudflare D1 | 保存 Better Auth 所需的使用者、帳號、Session 與驗證資料 |
| 網站 | Cloudflare Workers Static Assets | 提供前端頁面與靜態資產 |

D1 透過 Wrangler 設定的 **D1 binding** 提供給 Worker 使用。Worker 端以 binding 存取 D1，不讓瀏覽器直接連線資料庫。

Better Auth 是本專案選定的 Auth 整合層；D1 是資料儲存層。不得將兩者混為一談，也不再以 Supabase Auth 作為本案方案。

## 3. 目前程式庫可見的現況

目前已完成第一階段程式接線：

- `site/index.html` 提供 Google 登入／註冊按鈕、登入狀態與登出介面，透過 Better Auth HTTP endpoints 呼叫 Worker。
- `src/index.js` 將 `/api/auth/*` 路由交給 Better Auth；其他請求仍交給 `env.ASSETS.fetch(request)`。
- `cloudflare/src/auth.js` 以 Better Auth 1.7.18 建立 Auth instance，直接使用 `env.DB` 作為原生 D1 database binding。
- Auth 設定要求 `BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID` 與 `GOOGLE_CLIENT_SECRET`；必要設定缺少時回傳 503，不啟用不安全的假登入。
- OAuth Token 啟用 `encryptOAuthTokens`；Secure Cookie 依 Auth Base URL 是否為 HTTPS 決定。
- `cloudflare/migrations/0001_better_auth.sql` 由 Better Auth CLI 產生，包含 User、Session、Account、Verification 四張核心資料表及索引。
- `cloudflare/wrangler.jsonc` 已加入 `nodejs_compat` 與 `DB` binding；Production／Preview 都使用已建立的 `dianai-db` 實際 ID。
- `cloudflare/package.json` 固定 Better Auth 1.7.18，並加入本機與遠端 D1 migration 指令。
- `cloudflare/.dev.vars.example` 是本機環境範本；真實 `.dev.vars` 已加入 Git 忽略清單。
- 測試已涵蓋 Auth 未設定時 fail closed，以及非 Auth 請求仍交由 Static Assets 處理。

Cloudflare 帳號另有既存資料庫 `diangarden-saves`，本專案不會使用它。dianAI 專用的 `dianai-db` 已建立並套用初始 schema；Google OAuth Client 憑證目前只存在於本機安全設定；Cloudflare Worker Secrets 尚未設定。

## 4. 預定架構與資料流

1. 訪客在網站點選 Google 登入。
2. 前端向同源的 Better Auth `/api/auth/sign-in/social` endpoint 發出請求。
3. Cloudflare Worker 上的 Better Auth 處理登入端點及 OAuth Callback。
4. Better Auth 驗證 Google 回傳的身分資料，首次成功登入時建立本地使用者及 Google 帳號關聯；既有使用者則重新建立登入 Session。
5. Better Auth 透過 Worker 的 D1 binding 保存及讀取使用者、帳號、Session 與必要驗證資料。
6. 瀏覽器以安全 Cookie 維持 Session；前端透過 `/api/auth/get-session` 讀取登入狀態，登出使用 `/api/auth/sign-out`。
7. 後續需要登入的 API 必須在伺服器端驗證 Session，不相信前端自行傳入的 email、使用者 ID 或登入旗標。

## 5. D1 資料庫與環境規劃

- 使用唯一的 Cloudflare D1 遠端資料庫 `dianai-db`，ID：`43029c56-82fe-4593-a224-3a497ad377a8`。
- Worker D1 binding 名稱為 `DB`；Production 與 Wrangler `preview` 環境都指向同一個資料庫。
- Better Auth 1.7.18 產生的 migration 位於 `cloudflare/migrations/0001_better_auth.sql`，已套用至遠端資料庫，並在 `d1_migrations` 記錄 `0001_better_auth.sql`。
- 遠端資料庫目前包含 Better Auth 的 `user`、`session`、`account`、`verification` 四張核心資料表及其索引。
- Preview 與 Production 共用同一份使用者、Session 及應用資料，沒有資料隔離；不得在 Preview 執行會污染、修改或刪除正式資料的測試。
- 本機開發使用 Wrangler 本機 D1 狀態，與遠端資料庫分開；本機 Migration 指令為 `npm run db:migrate:local`。
- 單一遠端資料庫的 Migration 指令為 `npm run db:migrate:remote`，只需套用一次。
## 6. Google OAuth 與 Cloudflare 設定

實際啟用前需要：

1. 確認 Google Cloud OAuth Consent Screen、OAuth Client 類型及授權網域。
2. 建立 Google OAuth Client，設定本機、Preview 與正式 Callback URL：`<環境網域>/api/auth/callback/google`。
3. 將 Google Client ID 設為 Worker 環境變數；Client Secret 與 Better Auth Secret 必須使用 Worker Secrets，不得寫入 Git、前端資產或一般設定檔。
4. 設定 Better Auth 的 `BETTER_AUTH_URL`、可信任來源及 Google Provider。
5. 確認 Preview 與 Production 的網域、Callback URL 及 Secrets 完全對應；兩環境的 D1 binding 使用同一個 `dianai-db`。
6. 公開註冊不使用內部白名單；是否要求 Google 帳號 Email 已驗證，仍待產品政策確認。目前未強制設定 `requireEmailVerification`。

不得把 Google OAuth 憑證、Cookie Secret 或其他機密貼入對話、提交至 Git，或寫進公開設定檔。

## 7. 安全、隱私與濫用防護

- 使用 Better Auth 提供且經確認適用於 Cloudflare Workers 的 OAuth 與 Session 機制。
- Cookie 依正式 HTTPS 環境設定 Secure；Session Cookie 由 Better Auth 管理。
- 限制可信任來源、Callback URL 及登入後導向網址，避免 CSRF 與開放式重新導向。
- 受保護 API 必須在伺服器端驗證 Session；不得只依賴前端 UI 或解碼但未驗證的 Token。
- 評估公開註冊的登入頻率限制、機器人與濫用防護。
- 只保存產品功能必要的 Google Profile 欄位；使用 Auth Provider 的穩定使用者識別，不以 email 作為唯一永久識別鍵。
- 正式開放前提供隱私權告知、資料保存期限、帳號刪除與使用者資料處理方式。

## 8. 實作階段與目前進度

1. **確認 Cloudflare 資源**：已建立唯一遠端 D1 `dianai-db`，區域為 APAC；未使用既有的 `diangarden-saves`。
2. **確認版本相容性**：使用 Better Auth 1.7.18 與 Wrangler 4.135.0；Worker 設定加入 `nodejs_compat`。真實 OAuth 流程仍待 Preview 驗證。
3. **建立 D1 與 binding**：`DB` binding 已在 Production／Preview 設定中指向同一個 D1 ID；兩環境共用資料。
4. **套用 D1 schema**：`0001_better_auth.sql` 已套用至遠端 D1，`d1_migrations` 已記錄該 migration；本機 Migration 亦已成功套用。
5. **設定 Google OAuth**：程式設定已完成；Google OAuth Client 與 Worker Secrets 尚待設定。
6. **整合 Better Auth**：Worker Auth handler、原生 D1 database binding、schema migration 已加入。
7. **完成登入介面**：Google 登入、登出、載入中、錯誤狀態及登入者資訊介面已加入。
8. **保護 API**：Auth endpoints 由 Better Auth 處理；產品尚無其他受保護 API，後續新增時必須在伺服器端驗證 Session。
9. **測試與發布**：本機 npm test 4/4 通過；Cloudflare Preview 與 Production 均已部署，兩者首頁 smoke test HTTP 200；Production Worker 版本為 be72fa5e-5e7b-41e6-9ea8-1c153b1920b9。Production Auth endpoint HTTP 503，因必要 Worker Secrets 尚未設定；Cloudflare Production 部署成功不代表 Google OAuth 已可用。TinyFish 桌面版唯讀檢查完成，主人已初步人工檢視。真實 OAuth Callback 尚未測試，因 Preview 與 Production 共用正式 D1，避免測試寫入正式使用者資料。
## 9. 驗收條件

- 未登入的一般訪客可以直接使用 Google 帳號註冊，不需邀請碼或人工白名單。
- 已註冊使用者可以再次登入，並能正常登出。
- 網頁重新載入後，登入狀態依 Session 規則正確恢復或失效。
- 使用者與 Session 資料由 Worker 經 D1 binding 存取。
- 未登入使用者不能呼叫受保護的伺服器端資源。
- 無效、過期或偽造的 Session／驗證資料會被拒絕。
- Google OAuth Client Secret 與 Better Auth Secret 不會出現在前端資產或 Git。
- Preview 與 Production 共用同一個 D1；OAuth Callback 及 Secrets 依各自環境正確設定，且 Preview 不污染正式資料。
- 本機測試通過；Cloudflare Preview 頁面載入、TinyFish 桌面版唯讀檢查及主人初步人工檢視完成。真實 OAuth Callback 與 D1 寫入驗證須先建立不會觸及正式資料的隔離測試策略。


## 10. 已確認與待確認事項

### 已確認

- 使用對象：一般訪客。
- 註冊政策：公開註冊，不採內部白名單。
- 第一階段登入方式：Google OAuth 2.0。
- Auth 整合層：Better Auth。
- 資料庫：Cloudflare D1。
- 執行環境：Cloudflare Workers。
- Better Auth 套件版本：1.7.18。
- 功能狀態：第一階段程式與單一遠端 D1 schema 已接入，尚未完成 Google OAuth 憑證設定與真實登入測試。

### 待確認

- Preview 與 Production 共用單一 D1；若未來需要環境資料隔離，必須重新評估是否增加資料庫。
- Google Cloud OAuth Consent Screen 與 OAuth Client 的建立及 Callback 設定。
- Preview 與 Production 的正式網域、Worker Secrets；兩環境目前共用 D1，OAuth Callback／Secrets 仍須依各環境正確設定。
- 是否要求 Google 帳號 Email 必須完成驗證後才可使用完整功能。
- 第一階段是否只需登入／登出與基本使用者識別，或同時需要保存使用者專屬資料。
- Cloudflare Preview 上的實際 OAuth Callback、Session Cookie 與 D1 寫入驗證。

Cloudflare Worker Secrets 尚未設定前，不啟用真實登入；Preview 與 Production 共用正式 D1，未建立隔離策略前不得在 Preview 執行 OAuth Callback 或任何會寫入使用者資料的測試。Production Worker 已部署，但設定 Production Secrets 會實際啟用正式登入，仍須先完成測試與風險檢查，並另行取得主人明確核准。


## 11. OAuth 測試隔離策略（已決定）

### 已確認決策

- **已決定維持單一遠端 D1**：Production 與 Wrangler Preview 繼續使用唯一遠端資料庫 dianai-db，不增加第二個 Cloudflare D1。
- **不建立第二個遠端 D1**：本階段不建立獨立 Preview D1，也不修改 Preview／Production 的 D1 binding。
- **採用本機端到端 OAuth**：使用 Wrangler 本機 Worker、本機 D1 與本機專用 Google OAuth Client 測試登入流程；本機 D1 與遠端正式資料庫分開。
- **Production Secrets 維持未設定**：在本機測試、正式環境檢查及主人另行核准前，不設定 Production Worker Secrets，不開放正式登入／公開註冊。
- Preview 與 Production 共用正式 D1；不得在 Preview 執行 OAuth Callback、註冊、登入或其他可能寫入使用者資料的測試。

### 本機測試設定與已驗證項目

- 本機 Worker URL：http://localhost:8787。
- 本機 OAuth Callback：http://localhost:8787/api/auth/callback/google。
- 本機 .dev.vars 已存在 BETTER_AUTH_URL、BETTER_AUTH_TRUSTED_ORIGINS、BETTER_AUTH_SECRET、GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET；不得輸出或提交任何憑證值。
- Wrangler 本機 D1 已有 Better Auth 的 user、session、account、verification 資料表，migration list 顯示沒有待套用項目。
- 本機首頁 HTTP 200；/api/auth/get-session HTTP 200，未登入時回傳 null。
- /api/auth/sign-in/social 回應 HTTP 200，成功產生 Google 授權網址；授權網址 host 為 accounts.google.com，redirect_uri 指向上述 localhost Callback，並包含 OAuth state。
- 上述結果只驗證本機 Worker、Auth 初始化與 OAuth 授權起始端點；尚未完成 Google 帳號實際授權、Callback、Session 建立及完整登入／登出驗收。

### 後續執行順序

1. 確認 Google OAuth Client 已將 http://localhost:8787/api/auth/callback/google 加入 Authorized redirect URIs；若未加入，需由主人在 Google Cloud Console 調整。
2. 由主人在本機瀏覽器完成 Google 帳號授權；確認瀏覽器回到 localhost Callback。
3. 驗證登入後 Session、登出、重新載入後 Session 狀態，以及本機 D1 的 user／account／session 資料；不得查詢或修改遠端正式 D1 的使用者資料。
4. 完成本機端到端測試後，更新驗收紀錄。若未來確實需要 Cloudflare Preview 的真實 OAuth 驗證，必須重新提出資料隔離方案；本決策不授權新增遠端 D1。
5. Production Secrets 設定會啟用正式登入／公開註冊；必須在正式網域、Google OAuth Consent Screen／測試使用者政策、安全檢查與驗收完成後，另行取得主人明確核准。

### 尚未完成

- Google Cloud Console 中 localhost Callback 的實際授權設定尚未由本次工具驗證。
- Google 帳號實際授權、OAuth Callback、Session 建立、登出與 D1 寫入尚待完成。
- Production Worker Secrets 維持未設定，正式登入維持關閉。
---
