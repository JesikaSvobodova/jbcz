#!/usr/bin/env node
/**
 * CHECK-DIST — poslední kontrola těsně před nasazením.
 *
 * Guard hlídá repozitář, tenhle skript hlídá to, co se opravdu vystaví na
 * internet. Chytí i věci, které do buildu propašuje nějaký nástroj nebo
 * omylem zkopírovaná složka.
 *
 * Použití:  node scripts/check-dist.mjs web
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { SECRET_RULES } from "./guard.mjs";

const ROOT = resolve(process.argv[2] ?? "dist");

/** Nic z tohohle se nesmí vystavit na web. */
const FORBIDDEN_NAMES = [
  "node_modules",
  ".git",
  ".env",
  ".env.local",
  ".env.production",
  ".npmrc",
  ".guard-allow",
  "id_rsa",
  "id_ed25519",
];

const FORBIDDEN_EXTS = [
  ".env",
  ".pem",
  ".p12",
  ".pfx",
  ".key",
  ".ppk",
  ".sql",
  ".sqlite",
  ".db",
  ".docx",
  ".xlsx",
  ".pptx",
  ".zip",
  ".log",
  ".bak",
  ".swp",
];

const TEXT_EXTS = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json", ".xml", ".txt", ".svg", ".map",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function main() {
  if (!existsSync(ROOT)) {
    process.stderr.write(`check-dist: složka ${ROOT} neexistuje\n`);
    return 2;
  }

  const problems = [];
  const files = walk(ROOT);

  if (!existsSync(join(ROOT, "index.html"))) {
    problems.push("chybí index.html — web by byl prázdný");
  }

  for (const path of files) {
    const rel = relative(ROOT, path);
    const name = path.split("/").pop().toLowerCase();

    if (rel.split("/").some((part) => FORBIDDEN_NAMES.includes(part))) {
      problems.push(`${rel}: soubor/složka, která nepatří na web`);
      continue;
    }

    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot) : "";
    if (FORBIDDEN_EXTS.includes(ext)) {
      problems.push(`${rel}: přípona "${ext}" nepatří na web`);
      continue;
    }

    if (!TEXT_EXTS.has(ext)) continue;

    const text = readFileSync(path, "utf8");
    for (const [rule, pattern, label] of SECRET_RULES) {
      if (pattern.test(text)) {
        problems.push(`${rel}: ${label} (${rule}) — nasazení zastaveno`);
      }
    }
  }

  if (problems.length > 0) {
    process.stderr.write(
      ["", "  ⛔ CHECK-DIST zastavil nasazení:", "", ...problems.map((p) => `     ✗ ${p}`), ""].join(
        "\n",
      ) + "\n",
    );
    return 1;
  }

  process.stdout.write(`  ✅ check-dist: ${files.length} souborů v pořádku\n`);
  return 0;
}

process.exit(main());
