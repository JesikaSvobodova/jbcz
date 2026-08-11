---
description: Nasadit aktuální stav na testovací adresu (nic se nezveřejní)
---

Nasaď aktuální rozdělanou práci na testovací verzi webu.

1. Zkontroluj, jestli je co nasazovat: `git status`.
   Když jsou necommitnuté změny, ověř build (`npm run build`) a commitni je
   s výstižnou českou zprávou.
2. Slaď se s produkcí: `git fetch origin`, pak `git rebase origin/main`.
3. `git push --force-with-lease origin HEAD:nahled`
4. Napiš uživateli:

   > Nasazeno na testovací verzi: **https://www.janbartosek.cz/nahled/**
   > Za chvilku (do minuty) tam bude aktuální stav. Testovací verze je označená
   > oranžovým pruhem dole a vyhledávače ji nezobrazují.
   > Až se na to podíváš, napiš mi, jestli to tak chceš.

Když větev `nahled` ještě neexistuje, push ji založí sám — nic dalšího neřeš.
