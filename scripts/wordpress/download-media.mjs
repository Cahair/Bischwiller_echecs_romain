import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { GENERATED_DIR, ROOT_DIR } from "./lib.mjs";

const sourceFile = path.join(GENERATED_DIR, "media-sources.json");
const sources = JSON.parse(await readFile(sourceFile, "utf8"));
const concurrency = 2;
const results = new Array(sources.length);
let cursor = 0;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function download(source, index) {
  const destination = path.join(ROOT_DIR, "public", source.localPath.replace(/^\/+/, ""));
  await mkdir(path.dirname(destination), { recursive: true });

  try {
    const existing = await stat(destination);
    if (existing.size > 0) {
      results[index] = { ...source, status: "existing", bytes: existing.size };
      return;
    }
  } catch {}

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(source.sourceUrl, {
        redirect: "follow",
        headers: { "user-agent": "Bischwiller-Echecs-Migration/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 15_000);
      }
      if (response.status === 404) {
        lastError = new Error("HTTP 404");
        break;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(destination, bytes);
      results[index] = {
        ...source,
        status: "downloaded",
        bytes: bytes.length,
        contentType: response.headers.get("content-type"),
        finalUrl: response.url,
      };
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 1000);
    }
  }

  results[index] = { ...source, status: "failed", error: String(lastError) };
}

async function worker() {
  while (cursor < sources.length) {
    const index = cursor;
    cursor += 1;
    await download(sources[index], index);
    await sleep(600);
    if ((index + 1) % 25 === 0 || index + 1 === sources.length) {
      console.log(`${index + 1}/${sources.length} médias traités`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
await writeFile(
  path.join(GENERATED_DIR, "media-manifest.json"),
  `${JSON.stringify(results, null, 2)}\n`,
);

const downloaded = results.filter((item) => item.status === "downloaded").length;
const existing = results.filter((item) => item.status === "existing").length;
const failed = results.filter((item) => item.status === "failed").length;
console.log(`Médias : ${downloaded} téléchargés, ${existing} existants, ${failed} échecs.`);
if (failed) process.exitCode = 2;
