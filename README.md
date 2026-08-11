# janbartosek.cz

Osobní web poslance Ing. Jana Bartoška, MPA (KDU-ČSL, Jihočeský kraj).

| | Adresa |
|---|---|
| **Ostrý web** | https://www.janbartosek.cz/ |
| **Testovací verze** | https://www.janbartosek.cz/nahled/ |

---

## ⚠️ Tenhle repozitář je veřejný

Kdokoliv na internetu si může přečíst všechno, co v něm je — včetně celé historie.
Smazání souboru nepomůže, stará verze v historii zůstává.

**Nikdy sem nedávej** strategie, analýzy, interní poznámky, smlouvy, nabídky,
hesla, klíče ani osobní údaje. Potřebuješ mít takové podklady po ruce? Ulož je
do složky `_local/` — ta zůstane jen na tvém disku.

Projekt to hlídá sám: guard kontroluje každý commit i každé nasazení a citlivý
soubor nepustí dál. Podrobnosti v [PROVOZ.md](PROVOZ.md).

---

## Kam jít dál

| Chci… | Kam |
|---|---|
| **upravit web** a mít to na jedné stránce | 👉 **[TAHAK.md](TAHAK.md)** — tři kroky, dá se vytisknout |
| **upravit web** a vědět víc | [NAVOD.md](NAVOD.md) — podrobný návod, nic technického není potřeba |
| **spravovat projekt** (nasazení, pojistky, nastavení GitHubu) | [PROVOZ.md](PROVOZ.md) |
| **vědět, jak se má chovat AI agent** | [CLAUDE.md](CLAUDE.md) |

---

## Nejkratší možný návod

Otevři si projekt v Claudovi a napiš normální větou, co chceš změnit:

> Změň text v úvodu na „Pracuji pro bezpečné Česko."

Claude to udělá, nasadí na testovací verzi a pošle ti odkaz. Podíváš se, a když
to tak chceš, řekneš „pusť to na ostrý web". Nic se nezveřejní bez tvého svolení.

Nevíš, co dál? Napiš `/pomoc`.

---

## Pro vývojáře

**Stack:** Astro 5 + Tailwind CSS 3 + Markdown → statické HTML, žádná databáze.

```bash
npm install                    # závislosti
bash scripts/install-hooks.sh  # zapnout bezpečnostní kontrolu před commitem
npm run dev                    # http://localhost:4321
npm run build                  # produkční build do dist/
npm run preview                # náhled produkčního buildu
```

Struktura:

```
├── src/
│   ├── data/          ← texty a kontakty (site.ts, about.ts)
│   ├── content/blog/  ← články v Markdownu
│   ├── components/    ← Astro komponenty
│   ├── layouts/       ← layouty stránek
│   ├── pages/         ← routy
│   └── styles/        ← globální CSS
├── public/            ← statické soubory (obrázky, robots.txt, CNAME)
├── assets/            ← originály fotek před zmenšením
├── scripts/           ← guard, příprava náhledu, kontrola buildu
├── .githooks/         ← kontrola před commitem
├── .claude/           ← pravidla, hooks a příkazy pro AI agenta
└── .github/workflows/ ← nasazení a kontroly
```

Kontrola před commitem — stejná, jakou pouští CI:

```bash
npm run guard        # jen kontrola citlivého obsahu
npm run kontrola     # guard + jeho testy + build + kontrola výstupu
node scripts/guard.mjs --explain   # vypíše platná pravidla
```

Git hook ji stejně spustí sám při každém commitu. Obcházet ji přes `--no-verify`
je zakázané — proč, je v [PROVOZ.md](PROVOZ.md).
