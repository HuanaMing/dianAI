# 原型技術架構

## 執行方式

- Cloudflare Worker 將請求交給 ASSETS binding。
- Wrangler 靜態資產目錄是 src/ui/，入口頁為 src/ui/index.html。
- 遊戲以原生瀏覽器 ES Modules 執行，不新增框架或執行期套件。
- Canvas 負責戰場繪製，DOM 負責 HUD、選卡與觸控控制。

## 模組

| 檔案 | 職責 |
| --- | --- |
| src/ui/game/model.js | 色票、卡片定義、遊戲狀態建立 |
| src/ui/game/compute.js | 幾何計算、最近目標、行為統計與卡片權重抽選 |
| src/ui/game/world.js | 戰場物件、敵人生成、碰撞、子彈、經驗與繪製 |
| src/ui/game/main.js | 輸入、遊戲迴圈、HUD、升級與結算流程 |
| src/ui/index.html | 靜態入口、響應式介面與 CSS |

模組暫放在 src/ui/game/，因為 Cloudflare Workers Static Assets 直接以 src/ui/ 為發布根目錄；避免將其他原始碼目錄直接公開成靜態資產。待確立建置流程後，再評估移回 AGENTS.md 定義的獨立模組目錄。

## 原型限制

- 行為權重是第一版啟發式模型，尚未經玩家測試校準。
- Boss 於原型計時 02:00 出現，以縮短測試等待；正式設計仍需依 GDD 調整。
- 本機存檔尚未實作。
- 尚未經本機 Wrangler build、瀏覽器互動或手機實機驗證。
