#!/usr/bin/env node
/**
 * GUARD — pojistka proti úniku citlivého obsahu do veřejného repozitáře.
 *
 * Tento repozitář je VEŘEJNÝ. Cokoliv se do něj commitne, je navždy dohledatelné
 * v historii — i když to další commit smaže. Guard proto kontroluje obsah dřív,
 * než se commit vytvoří (git hook), a znovu v CI, kde blokuje nasazení.
 *
 * Použití:
 *   node scripts/guard.mjs                  kontrola všech verzovaných souborů
 *   node scripts/guard.mjs --staged         kontrola připravených (staged) změn
 *   node scripts/guard.mjs --range A..B     kontrola souborů změněných v rozsahu
 *   node scripts/guard.mjs --files a.md b/  kontrola konkrétních souborů
 *   node scripts/guard.mjs --message FILE   kontrola textu commit zprávy
 *   node scripts/guard.mjs --explain        vypíše pravidla a skončí
 *
 * Návratový kód: 0 = čisté, 1 = nález (blokuj), 2 = chyba nástroje.
 *
 * Výjimky se zapisují do .guard-allow (viz PROVOZ.md) — jen pro super admina.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = repoRoot();
const ALLOW_FILE = ".guard-allow";

/* ------------------------------------------------------------------ *
 * 1) POVOLENÉ UMÍSTĚNÍ — vše ostatní je zakázané (deny by default)
 * ------------------------------------------------------------------ */

/** Adresáře, kam smí přibývat obsah. */
const ALLOWED_DIRS = [
  "src/", // zdrojový kód a obsah webu
  "public/", // statické soubory servírované na webu
  "assets/", // zdrojové obrázky (originály před zmenšením)
  "scripts/", // nástroje repozitáře
  ".github/", // CI/CD
  ".githooks/", // lokální git hooky
  ".claude/", // konfigurace AI agenta
];

/** Soubory povolené v kořeni repozitáře. */
const ALLOWED_ROOT_FILES = new Set([
  ".gitignore",
  ".guard-allow",
  ".nvmrc",
  "CLAUDE.md",
  "NAVOD.md",
  "PROVOZ.md",
  "README.md",
  "TAHAK.md",
  "astro.config.mjs",
  "package-lock.json",
  "package.json",
  "tailwind.config.mjs",
  "tsconfig.json",
]);

/* ------------------------------------------------------------------ *
 * 2) ZAKÁZANÉ NÁZVY A PŘÍPONY
 * ------------------------------------------------------------------ */

/** Adresáře, které do veřejného repozitáře nepatří nikdy. */
const FORBIDDEN_DIRS = [
  "docs",
  "doc",
  "podklady",
  "interni",
  "internal",
  "private",
  "soukrome",
  "strategie",
  "analyzy",
  "marketing",
  "_local",
  "local",
  "notes",
  "poznamky",
];

/** Slova v názvu souboru, která signalizují interní dokument. */
const FORBIDDEN_NAME_WORDS = [
  "strategie",
  "strategy",
  "analyza",
  "analysis",
  "marketing",
  "interni",
  "internal",
  "duverne",
  "confidential",
  "nda",
  "smlouva",
  "contract",
  "faktura",
  "invoice",
  "heslo",
  "hesla",
  "password",
  "passwords",
  "secret",
  "secrets",
  "credential",
  "credentials",
  "privatekey",
  "backup",
  "zaloha",
  "export",
];

/** Přípony, které do veřejného webového repozitáře nepatří. */
const FORBIDDEN_EXTS = [
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".xls",
  ".xlsx",
  ".ods",
  ".csv",
  ".tsv",
  ".ppt",
  ".pptx",
  ".odp",
  ".key",
  ".pages",
  ".numbers",
  ".msg",
  ".eml",
  ".mbox",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".tgz",
  ".sql",
  ".sqlite",
  ".sqlite3",
  ".db",
  ".dump",
  ".pem",
  ".p12",
  ".pfx",
  ".jks",
  ".keystore",
  ".ppk",
  ".env",
  ".pdf", // povolené pouze v public/dokumenty/ (viz PDF_ALLOWED_PREFIX)
];

const PDF_ALLOWED_PREFIX = "public/dokumenty/";

/** Adresáře, které se nikdy neverzují (build/instalace). */
const NEVER_TRACK_DIRS = ["node_modules", "dist", ".astro", ".vercel", ".wrangler"];

/* ------------------------------------------------------------------ *
 * 3) VZORY V OBSAHU SOUBORŮ
 * ------------------------------------------------------------------ */

/**
 * Přístupové údaje a klíče. Kontroluje se v každém textovém souboru.
 * Sdílí je i scripts/check-dist.mjs, který kontroluje hotový build.
 */
export const SECRET_RULES = [
  ["secret:private-key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/, "privátní klíč"],
  ["secret:anthropic", /\bsk-ant-[A-Za-z0-9_-]{20,}/, "Anthropic API klíč"],
  ["secret:openai", /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/, "OpenAI API klíč"],
  ["secret:github-token", /\bgh[pousr]_[A-Za-z0-9]{30,}/, "GitHub token"],
  ["secret:github-pat", /\bgithub_pat_[A-Za-z0-9_]{40,}/, "GitHub PAT"],
  ["secret:aws", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, "AWS access key"],
  ["secret:google", /\bAIza[0-9A-Za-z_-]{30,}/, "Google API klíč"],
  ["secret:slack", /\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  ["secret:cloudflare", /\bCLOUDFLARE_API_(?:TOKEN|KEY)\s*[:=]\s*\S{8,}/i, "Cloudflare token"],
  [
    "secret:jwt",
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    "JWT token",
  ],
  [
    "secret:conn-string",
    /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|amqp|ftp|smtp):\/\/[^\s:@/]+:[^\s:@/]+@/,
    "connection string s heslem",
  ],
  [
    "secret:assignment",
    /\b(?:password|passwd|pwd|heslo|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
    "heslo nebo token v kódu",
  ],
];

/** Označení důvěrnosti — text, který se nesmí objevit ve veřejném obsahu. */
const MARKER_RULES = [
  ["marker:cs", /\bNEPUBLIKOVAT\b|\bNEZVEREJNOVAT\b|\bNEVEREJNE\b|\bDUVERNE\b|\bPRISNE TAJNE\b|\bJEN INTERNE\b|\bINTERNI POUZE\b/i, "označení důvěrnosti (CZ)"],
  ["marker:en", /\bCONFIDENTIAL\b|\bDO NOT PUBLISH\b|\bINTERNAL ONLY\b|\bNOT FOR PUBLICATION\b|\bTRADE SECRET\b/i, "označení důvěrnosti (EN)"],
];

/** Osobní údaje, které na veřejném webu nemají co dělat. */
const PII_RULES = [
  ["pii:rodne-cislo", /\b\d{6}\s?\/\s?\d{3,4}\b/, "rodné číslo"],
  ["pii:iban", /\bCZ\d{2}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}\b/, "číslo účtu / IBAN"],
];

/**
 * Soubory vyňaté z kontroly na označení důvěrnosti — samotná pravidla a
 * dokumentace tato slova musí obsahovat, jinak by guard hlásil sám sebe.
 * Kontrola na přístupové údaje a osobní údaje na ně platí dál.
 */
const MARKER_EXEMPT = new Set([
  "CLAUDE.md",
  "NAVOD.md",
  "PROVOZ.md",
  "README.md",
  "TAHAK.md",
  "scripts/guard.mjs",
  ".githooks/pre-commit",
  ".githooks/commit-msg",
  ".claude/hooks/guard-tool-use.mjs",
  ".claude/hooks/session-start.sh",
]);

/** Přípony, které se nečtou jako text. */
const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".ico", ".bmp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm", ".mp3", ".wav", ".ogg", ".mov",
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // tvrdý limit
const WARN_FILE_BYTES = 2 * 1024 * 1024; // jen upozornění

/* ------------------------------------------------------------------ *
 * Běh
 * ------------------------------------------------------------------ */

function repoRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return process.cwd();
  }
}

function git(args) {
  return execFileSync("git", args, {
    cwd: REPO,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Odstraní diakritiku, aby "důvěrné" a "duverne" byly totéž. */
function fold(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Krátká slova (nda) se hledají jen jako samostatný token, jinak by "agenda"
 * nebo "standard" spustily poplach. Delší slova stačí jako podřetězec.
 */
function nameMatches(foldedName, word) {
  if (word.length > 3) return foldedName.includes(word);
  return foldedName.split(/[^a-z0-9]+/).includes(word);
}

function loadAllowList() {
  const path = resolve(REPO, ALLOW_FILE);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [file, rule = "*"] = line.split("|").map((part) => part.trim());
      return { file, rule };
    });
}

function isAllowed(allowList, file, rule) {
  return allowList.some(
    (entry) =>
      (entry.file === file || entry.file === "*") &&
      (entry.rule === "*" || entry.rule === rule),
  );
}

/* --------------------------- sběr souborů -------------------------- */

function listTracked() {
  return git(["ls-files", "-z"]).split("\0").filter(Boolean);
}

function listStaged() {
  return git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
    .split("\0")
    .filter(Boolean);
}

function listRange(range) {
  return git(["diff", "--name-only", "--diff-filter=ACMR", "-z", range])
    .split("\0")
    .filter(Boolean);
}

/** Obsah souboru — ze stage (pre-commit) nebo z disku. */
function readContent(file, { staged }) {
  if (staged) {
    try {
      return execFileSync("git", ["show", `:${file}`], {
        cwd: REPO,
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      return null;
    }
  }
  const path = resolve(REPO, file);
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
}

function fileSize(file, { staged }, buffer) {
  if (buffer) return buffer.length;
  const path = resolve(REPO, file);
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

/* ---------------------------- kontroly ----------------------------- */

/**
 * Posoudí, jestli soubor smí v repozitáři existovat, a případné nálezy přidá
 * do pole `findings`. Používá to i hook agenta (.claude/hooks/guard-tool-use.mjs),
 * aby se zakázaný soubor nedal ani vytvořit.
 */
export function checkLocation(file, findings) {
  const parts = file.split("/");
  const top = parts[0];
  const name = parts[parts.length - 1];
  const foldedName = fold(name).toLowerCase();
  const foldedPath = fold(file).toLowerCase();

  if (NEVER_TRACK_DIRS.includes(top)) {
    findings.push({
      file,
      rule: "path:never-track",
      detail: `adresář "${top}/" se needituje ani neverzuje — patří do .gitignore`,
    });
    return;
  }

  for (const dir of FORBIDDEN_DIRS) {
    if (foldedPath.split("/").slice(0, -1).includes(dir)) {
      findings.push({
        file,
        rule: "path:forbidden-dir",
        detail: `adresář "${dir}/" je pro interní podklady — do veřejného repozitáře nepatří`,
      });
      return;
    }
  }

  if (parts.length === 1) {
    if (!ALLOWED_ROOT_FILES.has(name)) {
      findings.push({
        file,
        rule: "path:root-file",
        detail: "nový soubor v kořeni repozitáře — obsah webu patří do src/ nebo public/",
      });
      return;
    }
  } else if (!ALLOWED_DIRS.some((dir) => file.startsWith(dir))) {
    findings.push({
      file,
      rule: "path:unknown-dir",
      detail: `adresář "${top}/" není mezi povolenými (${ALLOWED_DIRS.join(", ")})`,
    });
    return;
  }

  for (const word of FORBIDDEN_NAME_WORDS) {
    if (nameMatches(foldedName, word)) {
      findings.push({
        file,
        rule: "path:forbidden-name",
        detail: `název obsahuje "${word}" — vypadá to na interní dokument`,
      });
      return;
    }
  }

  const dot = foldedName.lastIndexOf(".");
  const ext = dot > 0 ? foldedName.slice(dot) : "";
  if (FORBIDDEN_EXTS.includes(ext)) {
    if (ext === ".pdf" && file.startsWith(PDF_ALLOWED_PREFIX)) return;
    findings.push({
      file,
      rule: "path:forbidden-ext",
      detail:
        ext === ".pdf"
          ? `PDF je povolené jen v ${PDF_ALLOWED_PREFIX}`
          : `přípona "${ext}" do veřejného webového repozitáře nepatří`,
    });
  }
}

function checkContent(file, buffer, findings) {
  const dot = file.lastIndexOf(".");
  const ext = dot > 0 ? file.slice(dot).toLowerCase() : "";
  if (BINARY_EXTS.has(ext)) return;
  if (buffer.includes(0)) return; // binární obsah

  const text = buffer.toString("utf8");
  const folded = fold(text);

  for (const [rule, pattern, label] of SECRET_RULES) {
    const match = pattern.exec(text);
    if (match) {
      findings.push({
        file,
        rule,
        detail: `${label} na řádku ${lineOf(text, match.index)}`,
      });
    }
  }

  for (const [rule, pattern, label] of PII_RULES) {
    const match = pattern.exec(text);
    if (match) {
      findings.push({
        file,
        rule,
        detail: `${label} na řádku ${lineOf(text, match.index)}`,
      });
    }
  }

  if (MARKER_EXEMPT.has(file)) return;
  for (const [rule, pattern, label] of MARKER_RULES) {
    const match = pattern.exec(folded);
    if (match) {
      findings.push({
        file,
        rule,
        detail: `${label} na řádku ${lineOf(folded, match.index)}: "${match[0]}"`,
      });
    }
  }
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

/* ------------------------------ výstup ----------------------------- */

function report(findings, warnings, scanned) {
  for (const warning of warnings) {
    process.stdout.write(`  upozornění  ${warning}\n`);
  }

  if (findings.length === 0) {
    process.stdout.write(
      `\n  ✅ GUARD: v pořádku (zkontrolováno ${scanned} souborů)\n\n`,
    );
    return 0;
  }

  const lines = [
    "",
    "  ╔══════════════════════════════════════════════════════════════════╗",
    "  ║  ⛔  GUARD ZASTAVIL ZMĚNU                                        ║",
    "  ╚══════════════════════════════════════════════════════════════════╝",
    "",
    "  Tento repozitář je VEŘEJNÝ — čte ho kdokoliv na internetu.",
    "  Následující soubory do něj podle pravidel nepatří:",
    "",
  ];

  for (const finding of findings) {
    lines.push(`  ✗ ${finding.file}`);
    lines.push(`      ${finding.detail}`);
    lines.push(`      pravidlo: ${finding.rule}`);
    lines.push("");
  }

  lines.push("  CO S TÍM:");
  lines.push("");
  lines.push("  • Je to interní dokument (strategie, analýza, smlouva, poznámky)?");
  lines.push("    → Nepatří sem vůbec. Ulož ho mimo repozitář, např. do složky");
  lines.push("      _local/ (ta je trvale ignorovaná) nebo úplně jinam na disk.");
  lines.push("");
  lines.push("  • Je to obsah, který MÁ být na webu?");
  lines.push("    → Text patří do src/data/ nebo src/content/,");
  lines.push("      obrázky do public/images/. Přejmenuj a přesuň.");
  lines.push("");
  lines.push("  • Je to přístupový údaj / klíč / heslo?");
  lines.push("    → Nikdy do repozitáře. Pokud už byl někdy pushnutý,");
  lines.push("      považuj ho za vyzrazený a okamžitě ho zneplatni.");
  lines.push("");
  lines.push("  • Jsem si jistý, že je to falešný poplach?");
  lines.push("    → Rozhoduje super admin. Postup je v PROVOZ.md, sekce");
  lines.push("      „Výjimky z guardu“. Nikdy neobcházej guard přes --no-verify.");
  lines.push("");

  process.stderr.write(lines.join("\n"));
  return 1;
}

/* ------------------------------- main ------------------------------ */

function explain() {
  process.stdout.write(
    [
      "GUARD — co repozitář nepustí dál",
      "",
      "1) Umístění: povolené jsou jen " + ALLOWED_DIRS.join(", "),
      "   a v kořeni jen " + [...ALLOWED_ROOT_FILES].join(", "),
      "2) Zakázané adresáře: " + FORBIDDEN_DIRS.map((d) => d + "/").join(", "),
      "3) Zakázaná slova v názvu: " + FORBIDDEN_NAME_WORDS.join(", "),
      "4) Zakázané přípony: " + FORBIDDEN_EXTS.join(" "),
      "   (.pdf pouze v " + PDF_ALLOWED_PREFIX + ")",
      "5) Obsah: přístupové údaje a klíče (" + SECRET_RULES.length + " vzorů),",
      "   označení důvěrnosti, rodné číslo, číslo účtu",
      "6) Velikost: tvrdý limit " + MAX_FILE_BYTES / 1024 / 1024 + " MB na soubor",
      "",
    ].join("\n"),
  );
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--explain")) {
    explain();
    return 0;
  }

  const allowList = loadAllowList();
  const findings = [];
  const warnings = [];

  // Kontrola textu commit zprávy
  const messageIndex = argv.indexOf("--message");
  if (messageIndex !== -1) {
    const path = argv[messageIndex + 1];
    if (!path || !existsSync(path)) return 0;
    const text = readFileSync(path, "utf8");
    for (const [rule, pattern, label] of SECRET_RULES) {
      if (pattern.test(text)) {
        findings.push({
          file: "(commit zpráva)",
          rule,
          detail: `${label} v textu commit zprávy`,
        });
      }
    }
    return report(findings, warnings, 1);
  }

  const staged = argv.includes("--staged");
  let files;
  const rangeIndex = argv.indexOf("--range");
  const filesIndex = argv.indexOf("--files");

  try {
    if (staged) {
      files = listStaged();
    } else if (rangeIndex !== -1) {
      files = listRange(argv[rangeIndex + 1]);
    } else if (filesIndex !== -1) {
      files = argv
        .slice(filesIndex + 1)
        .filter((arg) => !arg.startsWith("--"))
        .map((arg) => relative(REPO, resolve(process.cwd(), arg)).split(sep).join("/"));
    } else {
      files = listTracked();
    }
  } catch (error) {
    process.stderr.write(`GUARD: nepodařilo se získat seznam souborů: ${error.message}\n`);
    return 2;
  }

  for (const file of files) {
    const before = findings.length;
    checkLocation(file, findings);

    const buffer = readContent(file, { staged });
    if (buffer) {
      const size = fileSize(file, { staged }, buffer);
      if (size > MAX_FILE_BYTES) {
        findings.push({
          file,
          rule: "size:too-big",
          detail: `${(size / 1024 / 1024).toFixed(1)} MB překračuje limit ${
            MAX_FILE_BYTES / 1024 / 1024
          } MB`,
        });
      } else if (size > WARN_FILE_BYTES) {
        warnings.push(
          `${file} má ${(size / 1024 / 1024).toFixed(1)} MB — zvaž zmenšení kvůli rychlosti webu`,
        );
      }
      checkContent(file, buffer, findings);
    }

    // uplatnit výjimky z .guard-allow
    if (findings.length > before) {
      const kept = findings
        .slice(before)
        .filter((finding) => !isAllowed(allowList, finding.file, finding.rule));
      findings.length = before;
      findings.push(...kept);
    }
  }

  return report(findings, warnings, files.length);
}

/** Spustit jen při přímém volání — jinak jde o import kvůli SECRET_RULES. */
const spustenoPrimo =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (spustenoPrimo) {
  process.exit(main());
}
