#!/usr/bin/env bash
# Zapne lokální git hooky z .githooks/.
#
# Bez nich by se citlivý soubor dal commitnout a pushnout, a teprve pak
# by ho zachytilo CI — jenže to už je pozdě, ve veřejné historii zůstane.
#
# Spustit jednou po naklonování repozitáře:
#     bash scripts/install-hooks.sh
#
# AI agent si to pouští sám při startu sezení (.claude/hooks/session-start.sh).
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"

chmod +x .githooks/* 2>/dev/null || true
git config core.hooksPath .githooks

echo "✅ Git hooky zapnuté (core.hooksPath = .githooks)"
echo "   Před každým commitem se teď spustí kontrola citlivého obsahu."
