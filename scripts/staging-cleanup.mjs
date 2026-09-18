/**
 * Smaže staging workery starší než MAX_AGE_DAYS.
 *
 * Worker sám po vypršení vrací 410, takže tohle není bezpečnostní pojistka —
 * je to úklid, aby se v účtu nehromadily mrtvé náhledy. Bezpečnost řeší
 * expirace a basic auth přímo ve workeru.
 *
 * Čte CLOUDFLARE_API_TOKEN a CLOUDFLARE_ACCOUNT_ID z prostředí.
 */

import { STAGING_PREFIX } from "./staging-name.mjs";

const MAX_AGE_DAYS = Number(process.env.STAGING_MAX_AGE_DAYS ?? 5);
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const dryRun = process.argv.includes("--dry-run");

if (!token || !account) {
  console.error("Chybí CLOUDFLARE_API_TOKEN nebo CLOUDFLARE_ACCOUNT_ID.");
  process.exit(1);
}

const api = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`;
const headers = { Authorization: `Bearer ${token}` };

async function callApi(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = (payload.errors ?? []).map((error) => error.message).join("; ");
    throw new Error(`${init.method ?? "GET"} ${url} → HTTP ${response.status} ${detail}`);
  }
  return payload.result;
}

const scripts = await callApi(api);
const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const stale = scripts
  .filter((script) => script.id.startsWith(STAGING_PREFIX))
  .filter((script) => {
    const touched = Date.parse(script.modified_on ?? script.created_on ?? "");
    return Number.isFinite(touched) && touched < cutoff;
  });

console.log(
  `Staging workerů celkem: ${scripts.filter((s) => s.id.startsWith(STAGING_PREFIX)).length}, ` +
    `k smazání (starší než ${MAX_AGE_DAYS} dní): ${stale.length}`,
);

for (const script of stale) {
  if (dryRun) {
    console.log(`  [dry-run] smazal bych ${script.id} (${script.modified_on ?? script.created_on})`);
    continue;
  }
  await callApi(`${api}/${script.id}?force=true`, { method: "DELETE" });
  console.log(`  smazán ${script.id} (${script.modified_on ?? script.created_on})`);
}
