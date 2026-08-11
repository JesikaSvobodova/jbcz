---
description: Zkontrolovat, že v projektu není nic citlivého a že se web postaví
---

Spusť kompletní kontrolu a výsledek vysvětli česky.

```bash
bash scripts/install-hooks.sh
node scripts/guard.mjs
node scripts/guard.test.mjs
npm run build
node scripts/check-dist.mjs dist
```

Pak shrň:

- **Všechno prošlo** → „Repozitář je čistý, nic citlivého v něm není a web se
  správně postaví.“ Uveď, kolik souborů se zkontrolovalo.
- **Guard něco našel** → vysvětli česky, o jaký soubor jde a proč tam nepatří,
  a navrhni řešení (přesunout do `_local/`, přejmenovat, smazat). Nikdy nenavrhuj
  obcházení kontroly.
- **Build spadl** → přelož chybu do lidské řeči a oprav ji.

Nakonec zmiň případná upozornění na velké obrázky — u fotek nad 2 MB nabídni,
že je zmenšíš, protože zpomalují načítání webu.
