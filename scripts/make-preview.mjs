#!/usr/bin/env node
/**
 * MAKE-PREVIEW — připraví build větve `nahled` tak, aby se dal servírovat
 * z podadresáře /nahled/ na stejné doméně jako ostrý web.
 *
 * Co dělá:
 *   1. Přepíše absolutní cesty ("/images/x.jpg" → "/nahled/images/x.jpg"),
 *      takže náhled funguje v podadresáři bez zásahu do zdrojáků webu.
 *   2. Vloží <meta name="robots" content="noindex, nofollow"> — náhled se
 *      nesmí objevit ve vyhledávačích.
 *   3. Přidá dolní pruh "NÁHLED", aby nikdo nezaměnil test s produkcí.
 *   4. Smaže sitemap, robots.txt a CNAME — ty patří jen ostré verzi.
 *   5. Zkontroluje, že v HTML nezůstala cesta mířící na kořen domény
 *      (tj. do produkce). Když ano, skončí chybou.
 *
 * Použití:
 *   node scripts/make-preview.mjs --dir dist-nahled [--prefix /nahled]
 *        [--branch nahled] [--commit abc1234] [--prod-url https://...]
 */

import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const DIR = resolve(args.dir ?? "dist-nahled");
const PREFIX = (args.prefix ?? "/nahled").replace(/\/+$/, "");
const BRANCH = args.branch ?? "nahled";
const COMMIT = (args.commit ?? "").slice(0, 7);
const PROD_URL = args["prod-url"] ?? "https://www.janbartosek.cz";
const BUILT_AT = new Date().toLocaleString("cs-CZ", { timeZone: "Europe/Prague" });

/** Soubory, které v náhledu nemají co dělat. */
const DROP = [/^sitemap.*\.xml$/i, /^robots\.txt$/i, /^CNAME$/, /^_headers$/];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith("--") ? next : "true";
  }
  return out;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

/* ------------------------- přepis cest ------------------------- */

/** href="/x" src="/x" action="/x" poster="/x" → s prefixem */
function rewriteAttributes(text) {
  return text.replace(
    /(\s(?:href|src|action|poster)=)(["'])\/(?!\/)/g,
    (_match, attr, quote) => `${attr}${quote}${PREFIX}/`,
  );
}

/** srcset="/a.jpg 1x, /b.jpg 2x" */
function rewriteSrcset(text) {
  return text.replace(/(\ssrcset=)(["'])([^"']*)\2/g, (_match, attr, quote, value) => {
    const rewritten = value
      .split(",")
      .map((part) => part.trim().replace(/^\/(?!\/)/, `${PREFIX}/`))
      .join(", ");
    return `${attr}${quote}${rewritten}${quote}`;
  });
}

/** url(/x) v CSS i v inline style */
function rewriteCssUrls(text) {
  return text.replace(/url\((["']?)\/(?!\/)/g, (_match, quote) => `url(${quote}${PREFIX}/`);
}

/* --------------------------- vložky ---------------------------- */

function injectNoindex(html) {
  if (html.includes('name="robots"')) {
    return html.replace(
      /<meta\s+name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, nofollow">',
    );
  }
  return html.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}\n    <meta name="robots" content="noindex, nofollow">`,
  );
}

const BANNER_STYLE = [
  "position:fixed",
  "left:0",
  "right:0",
  "bottom:0",
  "z-index:2147483647",
  "background:#B45309",
  "color:#fff",
  "font:600 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
  "padding:10px 14px",
  "text-align:center",
  "box-shadow:0 -2px 12px rgba(0,0,0,.25)",
].join(";");

function banner() {
  const stamp = [BRANCH, COMMIT, BUILT_AT].filter(Boolean).join(" · ");
  return `
<div id="nahled-pruh" style="${BANNER_STYLE}">
  🟠 NÁHLED — testovací verze webu. Zatím ji nikdo jiný nevidí ve vyhledávačích.
  Ostrá verze je na <a href="${PROD_URL}" style="color:#fff;text-decoration:underline">${PROD_URL.replace(/^https?:\/\//, "")}</a>.
  <span style="opacity:.75;font-weight:400">(${stamp})</span>
</div>
<style>body{padding-bottom:64px !important}</style>
`;
}

function injectBanner(html) {
  if (html.includes('id="nahled-pruh"')) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${banner()}</body>`);
  return html + banner();
}

/* ---------------------------- kontrola ------------------------- */

/** Najde cesty, které by v náhledu ukazovaly do produkce. */
function leftoverRootPaths(html) {
  const pattern = new RegExp(
    `\\s(?:href|src|srcset|poster|action)=["']\\/(?!\\/|${PREFIX.slice(1)}\\/)[^"']*`,
    "g",
  );
  return html.match(pattern) ?? [];
}

/* ------------------------------ main --------------------------- */

function main() {
  let files;
  try {
    files = walk(DIR);
  } catch (error) {
    process.stderr.write(`make-preview: složka ${DIR} nejde přečíst — ${error.message}\n`);
    return 2;
  }

  let htmlCount = 0;
  let cssCount = 0;
  const problems = [];

  for (const path of files) {
    const name = path.split("/").pop();

    if (DROP.some((pattern) => pattern.test(name))) {
      rmSync(path);
      continue;
    }

    if (name.endsWith(".html")) {
      let html = readFileSync(path, "utf8");
      html = rewriteAttributes(html);
      html = rewriteSrcset(html);
      html = rewriteCssUrls(html);
      html = injectNoindex(html);
      html = injectBanner(html);
      writeFileSync(path, html);
      htmlCount += 1;

      const leftovers = leftoverRootPaths(html);
      if (leftovers.length > 0) {
        problems.push(`${path}: ${[...new Set(leftovers)].slice(0, 5).join(", ")}`);
      }
    } else if (name.endsWith(".css")) {
      writeFileSync(path, rewriteCssUrls(readFileSync(path, "utf8")));
      cssCount += 1;
    }
  }

  if (problems.length > 0) {
    process.stderr.write(
      [
        "",
        "  ⛔ make-preview: v náhledu zůstaly cesty mířící na kořen domény.",
        "     Náhled by načítal soubory z produkce — to je matoucí a nesmí se stát.",
        "",
        ...problems.map((problem) => `     ${problem}`),
        "",
      ].join("\n"),
    );
    return 1;
  }

  process.stdout.write(
    `  ✅ náhled připraven: ${htmlCount} HTML, ${cssCount} CSS, prefix ${PREFIX}/\n`,
  );
  return 0;
}

process.exit(main());
