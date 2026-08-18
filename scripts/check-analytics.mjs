#!/usr/bin/env node
/**
 * Kontrola analytiky v hotovém buildu.
 *
 * Běží nad `dist/` po `npm run build` a hlídá tři věci:
 *
 *   1. Měřicí skript je na **každé** vygenerované stránce.
 *   2. Je nakonfigurovaný přesně podle `src/data/site.ts` (website-id,
 *      domains) a nese `defer`, ať neblokuje parsování dokumentu.
 *   3. Web nesahá na jiné cizí domény, než na které sahat má. Kdyby někdo
 *      přidal další CDN, tracker nebo widget, tenhle test spadne.
 *
 * Co se tu netestuje: že měřicí instance opravdu odpovídá. Gate na deploy
 * nesmí viset na dostupnosti cizího serveru — výpadek analytiky nesmí
 * zablokovat nasazení webu, který na ní nestojí. Reálný sběr se ověřuje
 * na produkci po deployi.
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/** Cizí origins, na které web smí sahat (kromě měřicí instance). */
const POVOLENE_ORIGINY = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

/** Hodnoty `rel`, u kterých `<link>` opravdu stahuje zdroj. */
const STAHUJICI_REL = [
  "stylesheet",
  "preconnect",
  "dns-prefetch",
  "preload",
  "prefetch",
  "modulepreload",
  "icon",
  "shortcut",
  "apple-touch-icon",
  "manifest",
];

const chyby = [];

/** Vytáhne konfiguraci `analytics` přímo ze zdroje, aby se testovalo proti ní. */
async function nactiKonfiguraci() {
  const zdroj = await readFile("src/data/site.ts", "utf8");
  const blok = zdroj.match(/analytics:\s*\{([\s\S]*?)\n\s*\},/);
  if (!blok) throw new Error("V src/data/site.ts chybí blok `analytics`.");

  const hodnota = (klic) => {
    const nalez = blok[1].match(new RegExp(`${klic}:\\s*"([^"]*)"`));
    if (!nalez) throw new Error(`V bloku \`analytics\` chybí \`${klic}\`.`);
    return nalez[1];
  };

  return {
    scriptUrl: hodnota("scriptUrl"),
    websiteId: hodnota("websiteId"),
    domains: hodnota("domains"),
  };
}

/** Rekurzivně posbírá všechny .html soubory v adresáři. */
async function najdiStranky(adresar) {
  const polozky = await readdir(adresar, { withFileTypes: true });
  const soubory = [];
  for (const polozka of polozky) {
    const cesta = join(adresar, polozka.name);
    if (polozka.isDirectory()) soubory.push(...(await najdiStranky(cesta)));
    else if (polozka.name.endsWith(".html")) soubory.push(cesta);
  }
  return soubory;
}

/** Atributy jednoho tagu jako mapa. Atribut bez hodnoty (`defer`) má "". */
function atributy(tag) {
  const mapa = new Map();
  for (const [, klic, dvojite, jednoduche] of tag.matchAll(
    /([a-zA-Z][a-zA-Z0-9-]*)(?:=(?:"([^"]*)"|'([^']*)'))?/g,
  )) {
    mapa.set(klic.toLowerCase(), dvojite ?? jednoduche ?? "");
  }
  return mapa;
}

const konfigurace = await nactiKonfiguraci();
const stranky = await najdiStranky("dist");

if (stranky.length === 0) {
  console.error("dist/ neobsahuje žádnou stránku — pusť nejdřív `npm run build`.");
  process.exit(1);
}

for (const stranka of stranky) {
  const html = await readFile(stranka, "utf8");

  const trackery = [...html.matchAll(/<script\b[^>]*>/g)]
    .map((nalez) => atributy(nalez[0]))
    .filter((attr) => attr.get("src") === konfigurace.scriptUrl);

  if (trackery.length !== 1) {
    chyby.push(`${stranka}: měřicí skript nalezen ${trackery.length}×, čekal se právě 1×`);
    continue;
  }

  const [tracker] = trackery;
  if (tracker.get("data-website-id") !== konfigurace.websiteId) {
    chyby.push(`${stranka}: data-website-id = "${tracker.get("data-website-id")}"`);
  }
  if (tracker.get("data-domains") !== konfigurace.domains) {
    chyby.push(`${stranka}: data-domains = "${tracker.get("data-domains")}"`);
  }
  if (!tracker.has("defer") && !tracker.has("async")) {
    chyby.push(`${stranka}: měřicí skript nemá defer — blokoval by parsování dokumentu`);
  }

  // Cizí origins, na které stránka sahá kvůli zdrojům (ne odkazy v textu).
  const zdroje = [...html.matchAll(/<(?:script|img|iframe|source)\b[^>]*\bsrc="([^"]+)"/g)].map(
    (nalez) => nalez[1],
  );

  // Z <link> jen ty, které opravdu něco stahují — `canonical` a `alternate`
  // jsou odkazy, ne požadavky.
  for (const nalez of html.matchAll(/<link\b[^>]*>/g)) {
    const attr = atributy(nalez[0]);
    const rel = (attr.get("rel") ?? "").toLowerCase().split(/\s+/);
    const stahuje = rel.some((hodnota) => STAHUJICI_REL.includes(hodnota));
    if (stahuje && attr.has("href")) zdroje.push(attr.get("href"));
  }

  for (const url of zdroje) {
    if (!/^https?:\/\//.test(url)) continue;
    const { origin } = new URL(url);
    if (origin === new URL(konfigurace.scriptUrl).origin) continue;
    if (POVOLENE_ORIGINY.includes(origin)) continue;
    chyby.push(`${stranka}: neočekávaný cizí origin ${origin} (${url})`);
  }
}

// Dvojité lomítko v cestě = 308 redirect navíc při každém načtení stránky.
if (/[^:]\/\//.test(konfigurace.scriptUrl)) {
  chyby.push(`scriptUrl má dvojité lomítko: ${konfigurace.scriptUrl}`);
}

if (chyby.length > 0) {
  console.error("Kontrola analytiky NEPROŠLA:");
  for (const chyba of chyby) console.error(`  • ${chyba}`);
  process.exit(1);
}

console.log(
  `Kontrola analytiky OK — ${stranky.length} stránek, website-id ${konfigurace.websiteId}, domains "${konfigurace.domains}".`,
);
