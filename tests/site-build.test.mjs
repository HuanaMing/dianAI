import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const publicRoot = resolve(import.meta.dirname, "../cloudflare/public");

test("build output contains the Google sign-in interface", async () => {
  const html = await readFile(resolve(publicRoot, "index.html"), "utf8");
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="zh-Hant">/);
  assert.match(html, /<title>dianAI｜網站服務<\/title>/);
  assert.match(html, /google-sign-in/);
  assert.match(html, /google-sign-out/);
  assert.match(html, /\/api\/auth\/get-session/);
});

test("build output includes the static assets directory", async () => {
  await access(resolve(publicRoot, "assets"));
});
