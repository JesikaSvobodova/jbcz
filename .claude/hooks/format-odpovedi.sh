#!/usr/bin/env bash
# Připomene formát odpovědi před KAŽDÝM promptem.
#
# Proč hook a ne jen CLAUDE.md: pravidlo v souboru se v dlouhé konverzaci
# rozmělní. Tohle se vloží do kontextu pokaždé, takže se přehlédnout nedá.
#
# Na stdout smí jít jenom JSON.
set -uo pipefail

node -e '
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: [
      "FORMÁT ODPOVĚDI (povinné, viz CLAUDE.md):",
      "Odpověz stručně a ukonči odpověď přesně tímhle blokem:",
      "",
      "---",
      "**STAV:** <ikona> jedna věta — co se stalo a jestli je to dobře",
      "**DÁL:** Ty|Já|Nikdo → co konkrétně",
      "",
      "Ikony: ✅ dobré · ⚠️ pozor · ⛔ zablokované · ⏳ běží.",
      "Maximálně dva řádky, žádné odrážky uvnitř. Když je na tahu uživatel,",
      "napiš přesně jednu akci, ne seznam možností. Detail nad patičkou drž krátký."
    ].join("\n"),
  },
}));
' 2>/dev/null || printf "{}"
