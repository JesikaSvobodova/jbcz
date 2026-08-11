#!/usr/bin/env node
/**
 * Test guardu — ověřuje, že pojistka opravdu chytá to, co má, a zároveň
 * nebrání běžné práci s obsahem webu.
 *
 * Pouští se v CI (.github/workflows/guard.yml) a přes /kontrola.
 * Spuštění ručně:  node scripts/guard.test.mjs
 */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPO = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

const DOCASNE = [];

/**
 * Testovací "tajemství" se skládají za běhu.
 *
 * Kdyby byla v souboru napsaná celá, guard by je našel ve svém vlastním testu
 * a hlásil by poplach nad každým commitem. Skládáním se tomu vyhneme, aniž by
 * bylo potřeba tenhle soubor z kontroly vyjmout — testuje se pořád na stejných
 * řetězcích, jaké by přišly z reálného úniku.
 */
const VZORKY = {
  anthropic: ["sk", "ant", "api03", "AAAABBBBCCCCDDDDEEEEFFFFGGGG"].join("-"),
  aws: "AKIA" + "IOSFODNN7EXAMPLE",
  heslo: `export const x = { password: ${JSON.stringify("tajneheslo123")} };`,
  // Slovo označující utajení, psané přes escapy, ať se v souboru nevyskytne celé.
  oznaceni: "\u0044\u016e\u0056\u011aRN\u00c9 — neposílat dál.",
  rodneCislo: "760512" + "/1234",
};

function guard(...soubory) {
  const vysledek = spawnSync("node", ["scripts/guard.mjs", "--files", ...soubory], {
    cwd: REPO,
    encoding: "utf8",
  });
  const vystup = `${vysledek.stdout ?? ""}${vysledek.stderr ?? ""}`;
  return {
    kod: vysledek.status,
    pravidla: [...vystup.matchAll(/pravidlo: (\S+)/g)].map((shoda) => shoda[1]),
  };
}

/** Založí dočasný soubor v repozitáři a zaeviduje ho k úklidu. */
function docasny(cesta, obsah) {
  const plna = resolve(REPO, cesta);
  mkdirSync(dirname(plna), { recursive: true });
  writeFileSync(plna, obsah);
  DOCASNE.push(plna);
  return cesta;
}

let proslo = 0;
let selhalo = 0;

function zkontroluj(popis, podminka, detail = "") {
  if (podminka) {
    proslo += 1;
    process.stdout.write(`  ✓ ${popis}\n`);
  } else {
    selhalo += 1;
    process.stdout.write(`  ✗ ${popis}${detail ? ` — ${detail}` : ""}\n`);
  }
}

function musiZachytit(popis, cesta, pravidlo) {
  const { kod, pravidla } = guard(cesta);
  zkontroluj(
    popis,
    kod === 1 && pravidla.includes(pravidlo),
    `čekal jsem ${pravidlo}, dostal jsem [${pravidla.join(", ") || "nic"}] (kód ${kod})`,
  );
}

function musiPustit(popis, cesta) {
  const { kod, pravidla } = guard(cesta);
  zkontroluj(popis, kod === 0, `guard zablokoval: [${pravidla.join(", ")}]`);
}

try {
  process.stdout.write("\nKontrola cest a názvů:\n");
  musiZachytit("interní složka docs/", "docs/marketingova-analyza.md", "path:forbidden-dir");
  musiZachytit("strategie v názvu", "src/data/komunikacni-strategie.ts", "path:forbidden-name");
  musiZachytit("tabulka s daty", "public/rozpocet-kampane.xlsx", "path:forbidden-ext");
  musiZachytit("PDF mimo public/dokumenty/", "public/images/podklad.pdf", "path:forbidden-ext");
  musiZachytit("soubor s hesly", "src/data/hesla.ts", "path:forbidden-name");
  musiZachytit("nový soubor v kořeni", "poznamky-z-porady.txt", "path:root-file");
  musiZachytit("neznámý adresář", "tmp/neco.txt", "path:unknown-dir");
  musiZachytit("build v repozitáři", "node_modules/foo/index.js", "path:never-track");

  process.stdout.write("\nBěžná práce s obsahem musí projít:\n");
  musiPustit("úprava textů webu", "src/data/site.ts");
  musiPustit("nový článek", "src/content/blog/novy-clanek.md");
  musiPustit("nová fotka", "public/images/nova-fotka.webp");
  musiPustit("PDF v public/dokumenty/", "public/dokumenty/volebni-program.pdf");
  musiPustit("soubor se slovem agenda v názvu", "src/content/blog/agenda-snemovny.md");
  musiPustit("standardní název", "src/components/StandardniKarta.astro");

  process.stdout.write("\nKontrola obsahu souborů:\n");
  musiZachytit(
    "API klíč v textu",
    docasny("src/content/blog/__test-klic.md", `Klíč je ${VZORKY.anthropic}\n`),
    "secret:anthropic",
  );
  musiZachytit(
    "AWS klíč v textu",
    docasny("src/content/blog/__test-aws.md", `${VZORKY.aws}\n`),
    "secret:aws",
  );
  musiZachytit(
    "heslo v konfiguraci",
    docasny("src/data/__test-config.ts", `${VZORKY.heslo}\n`),
    "secret:assignment",
  );
  musiZachytit(
    "označení důvěrnosti",
    docasny("src/content/blog/__test-oznaceni.md", `# Podklad\n\n${VZORKY.oznaceni}\n`),
    "marker:cs",
  );
  musiZachytit(
    "rodné číslo",
    docasny("src/content/blog/__test-rc.md", `Rodné číslo: ${VZORKY.rodneCislo}\n`),
    "pii:rodne-cislo",
  );
  musiPustit(
    "obyčejný článek projde",
    docasny(
      "src/content/blog/__test-cisty.md",
      "---\ntitle: \"Test\"\n---\n\nNormální text článku bez čehokoliv citlivého.\n",
    ),
  );
} finally {
  for (const cesta of DOCASNE) rmSync(cesta, { force: true });
}

process.stdout.write(`\n${proslo} v pořádku, ${selhalo} selhalo\n\n`);
process.exit(selhalo === 0 ? 0 : 1);
