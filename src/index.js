export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json(
        {
          status: "ok",
          service: "dianai",
          timestamp: new Date().toISOString(),
          hostname: url.hostname
        },
        {
          headers: {
            "cache-control": "no-store"
          }
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
