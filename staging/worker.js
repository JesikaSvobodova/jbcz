/**
 * Staging worker pro janbartosek.cz.
 *
 * Servíruje statický build feature větve a přitom hlídá tři věci:
 *   1. za HTTP basic auth se bez hesla nikdo nedostane
 *   2. odpovědi nesmí být nikdy zaindexované
 *   3. náhled po EXPIRES_AT umře — vrací 410 a nic už neservíruje
 *
 * Všechny tři kontroly selhávají zavřeně: když chybí konfigurace, worker
 * neservíruje obsah. Radši nedostupný náhled než veřejně vystavený.
 */

const NOINDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const REALM = "Náhled janbartosek.cz";
const ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

/** Hlavičky, které visí na každé odpovědi včetně chybových. */
function guardHeaders(extra = {}) {
  return {
    "X-Robots-Tag": NOINDEX,
    "Cache-Control": "no-store, max-age=0",
    ...extra,
  };
}

function htmlResponse(status, title, body, extraHeaders = {}) {
  const page = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${NOINDEX}">
<title>${title}</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
         background:#f4f6f8; color:#1f2937; padding:24px; }
  main { max-width:32rem; text-align:center; }
  h1 { font-size:1.5rem; margin:0 0 .75rem; color:#1e3a8a; }
  p { margin:0; line-height:1.6; color:#4b5563; }
</style>
</head>
<body><main><h1>${title}</h1><p>${body}</p></main></body>
</html>`;
  return new Response(page, {
    status,
    headers: guardHeaders({ "Content-Type": "text/html; charset=utf-8", ...extraHeaders }),
  });
}

/**
 * Porovnání v konstantním čase. Obě strany se nejdřív zahashují, takže
 * porovnání neprozradí ani délku hesla.
 */
async function secretsMatch(a, b) {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i += 1) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

/** Rozebere hlavičku `Authorization: Basic …`. Heslo smí obsahovat dvojtečku. */
function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  let decoded;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return null;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) return null;
  return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}

async function isAuthorized(request, env) {
  const credentials = parseBasicAuth(request.headers.get("Authorization"));
  if (!credentials) return false;
  const [userOk, passwordOk] = await Promise.all([
    secretsMatch(credentials.user, env.STAGING_USER || "nahled"),
    secretsMatch(credentials.password, env.STAGING_PASSWORD),
  ]);
  return userOk && passwordOk;
}

export default {
  async fetch(request, env) {
    // 1. Expirace. Chybějící nebo nečitelné datum bereme jako prošlé.
    const expiresAt = Date.parse(env.EXPIRES_AT ?? "");
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return htmlResponse(
        410,
        "Náhled vypršel",
        "Tenhle náhled byl dočasný a už neplatí. O nový požádej pushnutím větve znovu.",
      );
    }

    // 2. Bez nastaveného hesla worker zásadně neservíruje nic.
    if (!env.STAGING_PASSWORD) {
      return htmlResponse(
        503,
        "Náhled není nastavený",
        "Chybí secret STAGING_PASSWORD. Dokud není nastavený, náhled se neservíruje.",
      );
    }

    // 3. Basic auth.
    if (!(await isAuthorized(request, env))) {
      return htmlResponse(401, "Přihlášení", "Tenhle náhled je chráněný heslem.", {
        "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      });
    }

    const url = new URL(request.url);

    // Vlastní robots.txt — produkční verze indexování povoluje, tady nesmí.
    if (url.pathname === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        headers: guardHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);

    // Hlavičky se musí přidat i k odpovědi z ASSETS, jinak by šly stránky indexovat.
    const headers = new Headers(assetResponse.headers);
    headers.set("X-Robots-Tag", NOINDEX);
    headers.set("Cache-Control", "no-store, max-age=0");
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
