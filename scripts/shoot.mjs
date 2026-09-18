/**
 * Screenshoty staging náhledu pro vlastní kontrolu před předáním uživateli.
 *
 * Použití:
 *   node scripts/shoot.mjs <url> [--user nahled] [--pass heslo] [--out adresar]
 *
 * Kromě obrázků vypíše chyby konzole a requesty, které se nenačetly — tedy
 * přesně to, co ze samotného „build prošel" není vidět.
 */

import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobil", width: 390, height: 844, isMobile: true },
];

function parseArgs(argv) {
  const args = { out: "screenshots" };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--user") args.user = argv[++i];
    else if (arg === "--pass") args.pass = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else positional.push(arg);
  }
  args.url = positional[0];
  return args;
}

/**
 * playwright-core si prohlížeč nestahuje, takže se musí najít ten, který je
 * v prostředí k dispozici.
 */
async function resolveChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    const entries = await readdir(root);
    const candidates = entries
      .filter((entry) => entry.startsWith("chromium-"))
      .sort()
      .reverse();
    for (const candidate of candidates) {
      const binary = path.join(root, candidate, "chrome-linux", "chrome");
      if (existsSync(binary)) return binary;
    }
  }
  for (const fallback of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (existsSync(fallback)) return fallback;
  }
  throw new Error("Nenašel jsem Chromium. Nastav CHROMIUM_PATH.");
}

const args = parseArgs(process.argv.slice(2));
if (!args.url) {
  console.error("Použití: node scripts/shoot.mjs <url> [--user u] [--pass p] [--out adresar]");
  process.exit(1);
}

await mkdir(args.out, { recursive: true });
const browser = await chromium.launch({ executablePath: await resolveChromium() });

let problems = 0;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.isMobile),
    httpCredentials:
      args.user && args.pass ? { username: args.user, password: args.pass } : undefined,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? "?"}`);
  });

  const response = await page.goto(args.url, { waitUntil: "networkidle", timeout: 60_000 });

  // Projet stránku až dolů, aby se dotáhly lazy-loaded obrázky. Bez toho je
  // všechno pod ohybem hlášené jako nenačtené — falešný poplach.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);

  const file = path.join(args.out, `${viewport.name}.png`);
  await page.screenshot({ path: file, fullPage: true });

  const status = response?.status() ?? 0;
  console.log(`\n── ${viewport.name} (${viewport.width}×${viewport.height}) ──`);
  console.log(`HTTP ${status} → ${file}`);
  if (status >= 400) problems += 1;

  // Kontroly, které se na screenshotu snadno přehlédnou.
  const images = await page.evaluate(() =>
    Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src,
      broken: !img.complete || img.naturalWidth === 0,
    })),
  );
  const broken = images.filter((img) => img.broken);
  const counts = images.reduce((acc, img) => acc.set(img.src, (acc.get(img.src) ?? 0) + 1), new Map());
  const duplicates = [...counts].filter(([, count]) => count > 1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  console.log(`obrázků: ${images.length}, nenačtených: ${broken.length}`);
  if (broken.length) {
    problems += 1;
    broken.forEach((img) => console.log(`  ✗ ${img.src}`));
  }
  if (duplicates.length) {
    console.log("opakované obrázky (ověř, jestli je to záměr):");
    duplicates.forEach(([src, count]) => console.log(`  ${count}× ${src}`));
  }
  if (overflow) {
    problems += 1;
    console.log("✗ stránka přetéká do strany — vodorovný scroll");
  }
  if (consoleErrors.length) {
    problems += 1;
    console.log("chyby konzole:");
    consoleErrors.forEach((error) => console.log(`  ✗ ${error}`));
  }
  if (failedRequests.length) {
    problems += 1;
    console.log("nenačtené requesty:");
    failedRequests.forEach((request) => console.log(`  ✗ ${request}`));
  }

  await context.close();
}

await browser.close();
console.log(`\n${problems ? `NALEZENO ${problems} problémů — prohlédni screenshoty` : "Automatické kontroly bez nálezu — screenshoty stejně prohlédni."}`);
process.exit(problems ? 1 : 0);
