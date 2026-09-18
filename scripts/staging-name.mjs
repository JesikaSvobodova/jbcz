/**
 * Odvodí jméno staging workeru z názvu větve.
 *
 * Jméno workeru je zároveň subdoménou (`<jmeno>.<ucet>.workers.dev`), takže
 * smí obsahovat jen malá písmena, číslice a pomlčky a musí se vejít do 63
 * znaků. Názvy větví jako `claude/oprava-galerie` tomu neodpovídají.
 *
 * Zkrácený slug se doplňuje hashem celého názvu větve — dvě dlouhé větve se
 * stejným začátkem tak nespadnou do jednoho workeru a nepřepíšou si náhled.
 */

import { createHash } from "node:crypto";

const PREFIX = "jb-stg-";
const SLUG_MAX = 38;

export function stagingWorkerName(branch) {
  const slug = String(branch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  const hash = createHash("sha1").update(String(branch)).digest("hex").slice(0, 6);
  return `${PREFIX}${slug || "branch"}-${hash}`;
}

export const STAGING_PREFIX = PREFIX;

if (import.meta.url === `file://${process.argv[1]}`) {
  const branch = process.argv[2];
  if (!branch) {
    console.error("Použití: node scripts/staging-name.mjs <nazev-vetve>");
    process.exit(1);
  }
  console.log(stagingWorkerName(branch));
}
