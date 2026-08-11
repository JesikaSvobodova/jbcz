---
description: Co je právě teď na ostrém webu, co na testu a v čem se liší
---

Zjisti stav a vysvětli ho česky, bez technických pojmů.

```bash
git fetch origin
git log --oneline -5 origin/main
git log --oneline -5 origin/nahled 2>/dev/null || echo "větev nahled neexistuje"
git log --oneline origin/main..origin/nahled 2>/dev/null
git status --short
```

Výstup přelož člověku do tabulky:

| | Adresa | Poslední změna |
|---|---|---|
| Ostrý web | https://www.janbartosek.cz/ | *(kdy a co)* |
| Testovací verze | https://www.janbartosek.cz/nahled/ | *(kdy a co)* |

Pak jednou větou napiš jednu z těchto situací:

- **Testovací verze má něco navíc** → vyjmenuj to česky a zeptej se, jestli to
  má jít na ostrý web.
- **Obě verze jsou stejné** → „Ostrý web i testovací verze jsou totožné,
  nic nečeká na zveřejnění.“
- **Mám rozdělanou necommitnutou práci** → řekni, co je rozdělané, a nabídni
  nasazení na test.

Nezmiňuj slova jako commit, branch, rebase ani SHA — pokud uživatel neřekl,
že je expert.

---

Odpověď ukonči povinnou patičkou **STAV / DÁL** (CLAUDE.md). Drž se dvou řádků.
