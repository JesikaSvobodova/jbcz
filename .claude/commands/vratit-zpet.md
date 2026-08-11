---
description: Vrátit poslední změnu na ostrém webu
---

Uživatel chce vrátit zpátky změnu na ostrém webu. $ARGUMENTS

1. `git fetch origin`
2. Vypiš mu posledních 5 změn na produkci obyčejnou češtinou (datum + co se
   změnilo) a zeptej se, kam až to má vrátit — pokud to už neřekl.
3. Proveď vrácení **jen přes revert**, nikdy přes reset ani force push:

   ```bash
   git checkout -B vraceni origin/main
   git revert --no-edit <commit>      # u více commitů: git revert --no-edit <nejstarsi>^..<nejnovejsi>
   npm run build
   git push origin HEAD:main
   ```

4. Napiš:

   > Vráceno. Web na **https://www.janbartosek.cz/** je zpátky ve stavu před
   > tou změnou — do minuty se to projeví.
   > Původní verze se neztratila, kdykoliv se k ní dá vrátit.

5. Nabídni, že stejný stav nasadíš i na testovací verzi, ať v ní není zmatek:
   `git push --force-with-lease origin HEAD:nahled`
