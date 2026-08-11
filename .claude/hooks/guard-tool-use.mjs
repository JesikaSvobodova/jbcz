#!/usr/bin/env node
/**
 * Hook Claude Code, který se ptá PŘED každým zápisem do souboru a před každým
 * příkazem v terminálu.
 *
 * Instrukce v CLAUDE.md se dají přehlédnout. Tenhle hook se přehlédnout nedá —
 * blokuje operaci dřív, než se stane. Je to třetí vrstva pojistky:
 *
 *   1. .gitignore            — zakázané soubory se ani nenabídnou ke commitu
 *   2. .githooks/pre-commit  — commit se nevytvoří
 *   3. tenhle hook           — soubor se ani nevytvoří / příkaz se nespustí
 *   4. .github/workflows     — nasazení se zastaví
 *
 * Chová se opatrně: když sám spadne, operaci PUSTÍ dál (vrstvy 1, 2 a 4 drží).
 * Jediná výjimka je zápis do zakázané cesty, kde se blokuje i při pochybnostech.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HOOK_DIR, "..", "..");
const SUPERADMIN_FLAG = resolve(REPO, ".claude", ".rezim-superadmin");

/** Soubory, které mění chování projektu a pojistek — jen pro super admina. */
const INFRA = [
  ".github/",
  ".githooks/",
  ".claude/",
  "scripts/",
  "CLAUDE.md",
  ".gitignore",
  ".guard-allow",
  "astro.config.mjs",
  "tailwind.config.mjs",
  "tsconfig.json",
  "package.json",
  "package-lock.json",
];

function odpoved(rozhodnuti, duvod) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: rozhodnuti,
        permissionDecisionReason: duvod,
      },
    }),
  );
  process.exit(0);
}

function pustDal() {
  process.exit(0);
}

function jeSuperadmin() {
  return existsSync(SUPERADMIN_FLAG);
}

/* --------------------------- zápis do souborů --------------------------- */

async function zkontrolujZapis(vstup) {
  const cesta = vstup.tool_input?.file_path ?? vstup.tool_input?.notebook_path;
  if (!cesta) pustDal();

  const rel = relative(REPO, resolve(cesta)).split("\\").join("/");

  // Soubor mimo repozitář (např. poznámky v /tmp) hook neřeší.
  if (rel.startsWith("..")) pustDal();

  // Zakázané cesty — stejná pravidla jako guard v CI.
  try {
    const { checkLocation } = await import(resolve(REPO, "scripts", "guard.mjs"));
    const nalezy = [];
    checkLocation(rel, nalezy);
    if (nalezy.length > 0) {
      const nalez = nalezy[0];

      // "Neznámý adresář" a "nový soubor v kořeni" nejsou únik dat, jen
      // nezvyklé místo — super admin je smí po potvrzení založit.
      const jenNezvykleMisto =
        nalez.rule === "path:root-file" || nalez.rule === "path:unknown-dir";

      odpoved(
        jenNezvykleMisto && jeSuperadmin() ? "ask" : "deny",
        [
          `Soubor "${rel}" do tohohle repozitáře nepatří (pravidlo ${nalez.rule}: ${nalez.detail}).`,
          "",
          "Tenhle repozitář je veřejný — cokoliv se do něj commitne, jde přečíst navždy.",
          "",
          "Když jde o interní podklad (strategie, analýza, poznámky, smlouva), ulož ho",
          "do složky _local/ — ta je trvale ignorovaná gitem a zůstane jen na disku.",
          "Když jde o obsah webu, patří text do src/data/ nebo src/content/",
          "a obrázky do public/images/.",
          "",
          "Podrobnosti jsou v CLAUDE.md, kapitola 0.",
        ].join("\n"),
      );
    }
  } catch {
    // guard.mjs se nepodařilo načíst — kontrolu infrastruktury děláme dál.
  }

  // Infrastruktura — jen v režimu super admina.
  if (!jeSuperadmin() && INFRA.some((prefix) => rel === prefix || rel.startsWith(prefix))) {
    odpoved(
      "ask",
      [
        `"${rel}" patří k infrastruktuře projektu (pojistky, nasazení, konfigurace).`,
        "V běžném režimu správce obsahu se tyhle soubory needitují — obsah webu",
        "je v src/data/, src/content/ a public/images/.",
        "",
        "Pokud tuhle změnu opravdu chceš, potvrď ji. Super admin si režim odemyká",
        "větou „jsem expert“ (CLAUDE.md, kapitola 1).",
      ].join("\n"),
    );
  }

  pustDal();
}

/* ------------------------------ terminál -------------------------------- */

/**
 * Míří push do produkční větve?
 *
 * Příkaz se dělí na části podle && ; || | , aby `git fetch origin main &&
 * git push origin HEAD:nahled` neplatilo za push do produkce.
 */
function miriDoMain(prikaz) {
  return prikaz
    .split(/&&|\|\||;|\|/)
    .some(
      (cast) =>
        /\bgit\s+push\b/.test(cast) &&
        /(^|\s|:)(refs\/heads\/)?main(\s|$|:)/.test(cast),
    );
}

function maForce(prikaz) {
  return /(^|\s)(--force\b|--force-with-lease\b|-f\b)/.test(prikaz);
}

function zkontrolujPrikaz(vstup) {
  const prikaz = (vstup.tool_input?.command ?? "").replace(/\s+/g, " ").trim();
  if (!prikaz) pustDal();

  // Obcházení guardu při commitu.
  if (/\bgit\s+commit\b/.test(prikaz) && /(--no-verify\b|\s-n(\s|$))/.test(prikaz)) {
    odpoved(
      "deny",
      [
        "`git commit --no-verify` obchází bezpečnostní kontrolu, která hlídá,",
        "aby se do veřejného repozitáře nedostal citlivý obsah.",
        "",
        "Když guard něco našel, je potřeba to vyřešit — ne to obejít.",
        "Spusť `node scripts/guard.mjs --staged` a oprav, na co si stěžuje.",
      ].join("\n"),
    );
  }

  // Přepis historie.
  if (/\bgit\s+(filter-branch|filter-repo)\b/.test(prikaz) || /\bgit\s+reflog\s+delete\b/.test(prikaz)) {
    odpoved(
      "deny",
      [
        "Přepis historie rozbije všechny existující klony a forky repozitáře.",
        "Je to krajní řešení (typicky po úniku dat) a rozhoduje o něm super admin.",
        "Postup je v PROVOZ.md, sekce „Když už něco uniklo“.",
      ].join("\n"),
    );
  }

  // Vypnutí git hooků.
  if (/\bgit\s+config\b.*core\.hooksPath/.test(prikaz) && !/\.githooks/.test(prikaz)) {
    odpoved(
      "deny",
      "Tímhle by se vypnula kontrola před commitem. Hooky musí zůstat na .githooks.",
    );
  }

  // Mazání pojistek.
  if (/\brm\b/.test(prikaz) && /(scripts\/guard\.mjs|\.githooks|\.github\/workflows)/.test(prikaz)) {
    odpoved("deny", "Tenhle příkaz maže pojistky projektu. To se nedělá.");
  }

  // Push do produkce.
  if (miriDoMain(prikaz)) {
    if (maForce(prikaz)) {
      odpoved(
        "deny",
        [
          "Force push do větve `main` nenávratně přepíše historii ostrého webu.",
          "Vrácení změny se dělá přes `git revert` — viz CLAUDE.md, krok 9.",
        ].join("\n"),
      );
    }
    odpoved(
      "ask",
      [
        "⚠️  Tenhle příkaz změní OSTRÝ web na https://www.janbartosek.cz/.",
        "",
        "Potvrď ho jen tehdy, když sis testovací verzi na",
        "https://www.janbartosek.cz/nahled/ prohlédl a chceš ji zveřejnit.",
      ].join("\n"),
    );
  }

  pustDal();
}

/* -------------------------------- main ---------------------------------- */

async function main() {
  let vstup;
  try {
    vstup = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    pustDal();
  }

  const nastroj = vstup.tool_name ?? "";

  if (nastroj === "Bash") {
    zkontrolujPrikaz(vstup);
  } else if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(nastroj)) {
    await zkontrolujZapis(vstup);
  }

  pustDal();
}

main().catch(() => pustDal());
