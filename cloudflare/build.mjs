import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(dirname(fileURLToPath(import.meta.url)), "public");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await copyFile(resolve(projectRoot, "site/index.html"), resolve(outputRoot, "index.html"));
await cp(resolve(projectRoot, "assets"), resolve(outputRoot, "assets"), { recursive: true });

console.log("Built website placeholder and static assets into cloudflare/public/.");
