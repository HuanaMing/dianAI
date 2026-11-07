import test from "node:test";
import assert from "node:assert/strict";

const { default: worker } = await import("../src/index.js");

test("Auth endpoints fail closed until all required credentials and D1 are configured", async () => {
  const response = await worker.fetch(
    new Request("https://dianai.example/api/auth/get-session"),
    {
      ASSETS: {
        fetch: async () => {
          throw new Error("Auth requests must not fall through to static assets");
        }
      }
    }
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, "Authentication service is not configured");
  assert.deepEqual(body.missing, [
    "DB",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET"
  ]);
});

test("non-auth requests continue to use the Static Assets binding", async () => {
  const assetResponse = new Response("dianAI static page");
  let requestedURL;

  const response = await worker.fetch(
    new Request("https://dianai.example/"),
    {
      ASSETS: {
        fetch: async (request) => {
          requestedURL = request.url;
          return assetResponse;
        }
      }
    }
  );

  assert.equal(requestedURL, "https://dianai.example/");
  assert.equal(await response.text(), "dianAI static page");
});
