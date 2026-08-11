---
description: Pustit odsouhlasenou testovací verzi na ostrý web
---

Uživatel chce zveřejnit to, co si prohlédl na testovací verzi.

**Nejdřív si ověř souhlas.** Publikovat smíš jen tehdy, když v téhle konverzaci
řekl něco jako „ano, pusť to“, „schvaluju“, „vypadá to dobře, nasaď to“.
Když si nejsi jistý, zeptej se jednou větou:

> Mám to pustit na ostrý web na janbartosek.cz?

Pak:

1. `git fetch origin`
2. Ukaž mu jednou větou, co se publikuje — shrnutí commitů, které jsou navíc
   oproti `origin/main`, obyčejnou češtinou.
3. `git push origin HEAD:main`
4. Napiš:

   > Publikováno. Ostrý web: **https://www.janbartosek.cz/**
   > Změna tam bude do minuty. Kdyby se ti zobrazovala stará verze, obnov
   > stránku přes Ctrl+Shift+R (na Macu Cmd+Shift+R).
   >
   > Kdyby něco nebylo v pořádku, napiš „vrať to zpátky“ a vrátím to.

Když push selže kvůli tomu, že se `main` mezitím pohnul, udělej
`git rebase origin/main`, znovu ověř `npm run build` a zkus to znovu.
Nikdy nepoužívej force push do `main`.
