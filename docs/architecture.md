# 原型技術架構

## 執行方式

- Cloudflare Worker 將請求交給 ASSETS binding。
- 原始碼依職責放在 src/model、src/UI、src/compute、src/world。
- Cloudflare 靜態資產目錄為 cloudflare/public/，由 cloudflare/build.mjs 從原始碼組裝；不直接公開 src/ 原始碼目錄。
- Workers Builds 在 Preview 與 Production 部署前執行 npm run build。
- 遊戲以原生瀏覽器 ES Modules 執行，不新增框架或執行期套件。
- Canvas 負責戰場繪製，DOM 負責 HUD、選卡與觸控控制。

## 模組

| 檔案 | 職責 |
| --- | --- |
| src/model/model.js | 色票、卡片定義、遊戲狀態建立 |
| src/compute/compute.js | 幾何計算、最近目標、行為統計與卡片權重抽選 |
| src/world/world.js | 戰場物件、敵人生成、碰撞、子彈、經驗與繪製 |
| src/UI/main.js | 輸入、遊戲迴圈、HUD、升級與結算流程 |
| src/UI/index.html | 靜態入口、響應式介面與 CSS |
| cloudflare/build.mjs | 將分層原始碼組裝至 Cloudflare 靜態資產目錄 |

## 依賴方向

- UI 可使用 model、compute 與 world。
- world 可使用 model 與 compute。
- compute 可使用 model。
- model 不依賴其他遊戲模組。
- 不允許模組反向引用 UI，也避免循環依賴。

## 原型限制

- 行為權重是第一版啟發式模型，尚未經玩家測試校準。
- Boss 於原型計時 02:00 出現，以縮短測試等待；正式設計仍需依 GDD 調整。
- 本機存檔尚未實作。
- 此次重整尚待 Wrangler build、瀏覽器互動與手機實機驗證。
