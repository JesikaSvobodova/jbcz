#!/usr/bin/env bash
# Připraví sezení: zapne pojistky a připomene agentovi pravidla.
#
# Všechny výpisy jdou na stderr — na stdout smí jít jenom výsledný JSON,
# jinak ho Claude Code nepřečte.
set -uo pipefail

REPO="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$REPO" || exit 0

# 1) Git hooky — bez nich by šel citlivý soubor commitnout.
if [ -f scripts/install-hooks.sh ]; then
  bash scripts/install-hooks.sh >&2 || true
fi

# 2) Závislosti (jen ve vzdáleném prostředí, lokálně si je řeší uživatel sám).
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ ! -d node_modules ]; then
  echo "Instaluji závislosti webu…" >&2
  npm install >&2 || echo "npm install neproběhl — build nemusí fungovat." >&2
fi

# 3) Nové sezení = režim správce obsahu. Odemčení super admina nepřechází dál.
rm -f .claude/.rezim-superadmin 2>/dev/null || true

# 4) Stav větví pro agenta.
VETEV="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if git ls-remote --exit-code --heads origin nahled >/dev/null 2>&1; then
  NAHLED="větev nahled existuje, náhled běží na https://www.janbartosek.cz/nahled/"
else
  NAHLED="větev nahled zatím neexistuje — vytvoří se při prvním nasazení na test"
fi

export VETEV NAHLED

node -e '
const kontext = `Projekt janbartosek.cz — VEŘEJNÝ repozitář. Než uděláš cokoliv, platí CLAUDE.md.

Tři věci, na které nezapomeň:
1. Do repozitáře nesmí nic interního — strategie, analýzy, smlouvy, hesla,
   osobní údaje. Interní podklady patří do _local/ (ignorováno gitem).
2. Každá změna jde nejdřív na test: push do větve "nahled"
   → https://www.janbartosek.cz/nahled/ . Pak se ptáš člověka, jestli to tak chce.
3. Na produkci (push do "main" → https://www.janbartosek.cz/) pouštíš změnu
   výhradně po výslovném souhlasu v téhle konverzaci.

S uživatelem mluv česky a bez odborných slov, dokud neřekne "jsem expert".

Aktuální stav: jsi na větvi "${process.env.VETEV}"; ${process.env.NAHLED}.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: kontext,
  },
}));
' 2>/dev/null || printf "{}"
