// Explicit push-event probe for Cloudflare Worker Preview builds.
const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>dianAI · Worker Preview 測試</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: radial-gradient(circle at top, #243c52, #101820 65%); color: #edf5f7; }
    main { width: min(680px, calc(100% - 40px)); padding: 32px; box-sizing: border-box;
      border: 1px solid #456174; border-radius: 20px; background: #172630dd;
      box-shadow: 0 24px 80px #0006; }
    .tag { display: inline-block; padding: 6px 10px; border-radius: 999px;
      background: #164e63; color: #a5f3fc; font-size: 13px; }
    h1 { margin: 18px 0 8px; font-size: clamp(28px, 6vw, 42px); }
    p { color: #c0d0d8; line-height: 1.7; }
    code { color: #a5f3fc; overflow-wrap: anywhere; }
    .ok { color: #86efac; }
  </style>
</head>
<body>
  <main>
    <span class="tag">CLOUDFLARE WORKER PREVIEW</span>
    <h1>dianAI 預覽環境已啟動</h1>
    <p class="ok">✓ Worker 成功執行並回傳網頁</p>
    <p>這是一個暫時性的冒煙測試頁面，用來確認 GitHub branch 能否透過 Cloudflare Workers Builds 建立獨立預覽網址。</p>
    <p>目前請求網址：<code id="url"></code></p>
    <p>測試時間：<code id="time"></code></p>
    <p>正式遊戲與 Merge Preview 尚未接入。</p>
  </main>
  <script>
    document.querySelector("#url").textContent = location.href;
    document.querySelector("#time").textContent = new Date().toLocaleString("zh-TW");
  </script>
</body>
</html>`;

export default {
  async fetch() {
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow"
      }
    });
  }
};

// Preview URL enablement verification: post-enable branch push.
