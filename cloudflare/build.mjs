import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(dirname(fileURLToPath(import.meta.url)), "public");

const files = [
  ["src/UI/index.html", "index.html"],
  ["src/UI/main.js", "UI/main.js"],
  ["src/model/model.js", "model/model.js"],
  ["src/compute/compute.js", "compute/compute.js"],
  ["src/world/world.js", "world/world.js"]
];

await rm(outputRoot, { recursive: true, force: true });

for (const [source, destination] of files) {
  const target = resolve(outputRoot, destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(projectRoot, source), target);
}

console.log(`Built ${files.length} browser assets into cloudflare/public/.`);
