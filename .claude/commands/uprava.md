---
description: Upravit web — provede tě celou změnou od zadání až po nasazení na test
---

Uživatel chce upravit web. Zadání: $ARGUMENTS

Postupuj přesně podle CLAUDE.md, kapitola 2. Ve zkratce:

1. **Když je zadání prázdné nebo nejasné**, zeptej se jednou krátkou otázkou česky,
   co přesně chce změnit. Nabídni mu příklady toho, co jde měnit:
   - texty na hlavní straně
   - kontakty a odkazy na sociální sítě
   - fotky
   - článek (přidat / upravit / skrýt)

2. **Sladit se s produkcí:** `git fetch origin` a `git rebase origin/main`.

3. **Udělej změnu.** Text patří do `src/data/site.ts`, `src/data/about.ts`
   nebo `src/content/blog/`. Obrázky do `public/images/`.

4. **Ověř build:** `npm run build`. Když spadne, oprav a zkus znovu.

5. **Commit** s českou zprávou, která popisuje změnu očima uživatele.

6. **Nasaď na test:** `git push --force-with-lease origin HEAD:nahled`

7. **Napiš mu tohle** (doplň, co jsi změnil) a skonči:

   > Hotovo. Změnil jsem *(co)*.
   > Podívej se na testovací verzi: **https://www.janbartosek.cz/nahled/**
   > (do minuty se to tam objeví). Napiš mi, jestli to tak chceš — pak to teprve
   > pustím na ostrý web.

**Nepublikuj.** Na produkci to jde až po jeho výslovném souhlasu.

---

Odpověď ukonči povinnou patičkou **STAV / DÁL** (CLAUDE.md). Drž se dvou řádků.
