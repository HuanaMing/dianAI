import { createAuth, getMissingAuthConfiguration } from "../cloudflare/src/auth.js";

const jsonResponse = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
      const missing = getMissingAuthConfiguration(env);
      if (missing.length > 0) {
        return jsonResponse({
          error: "Authentication service is not configured",
          missing
        }, 503);
      }

      try {
        const auth = createAuth(env);
        return await auth.handler(request);
      } catch {
        return jsonResponse({ error: "Authentication service is unavailable" }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
