# Pravidla pro práci na webu janbartosek.cz

Tenhle soubor je závazný. Platí pro každou session, každého agenta a každou úpravu.
Když si nejsi jistý, jestli něco smíš, tak to nesmíš — zeptej se.

---

## 1. Repozitáře

**Pracuje se výhradně v `JesikaSvobodova/jbcz`.** Tohle je jediný zdroj pravdy pro
web janbartosek.cz. Produkce se nasazuje odsud (GitHub Pages, `public/CNAME` →
`www.janbartosek.cz`).

**`JesikaSvobodova/nepouzivat-janbartosek.cz` se NEPOUŽÍVÁ.** Je odložený a jeho
obsah je zastaralý. Nikdy do něj necommituj, nepushuj ani z něj nenasazuj a neber
ho jako referenci. Když se session omylem otevře nad ním, nedělej tam žádnou práci
a řekni to uživateli.

---

## 2. Jak se publikuje — závazný postup

Tohle je jediná povolená cesta změny na web. Žádné zkratky, ani u jednořádkové opravy.

### Krok 1 — feature branch
Každá úprava jde na vlastní větev `claude/<krátký-popis>`. Nikdy se nepracuje
přímo nad `main`.

### Krok 2 — NIKDY nepushovat do `main` bez výslovného pokynu
Push do `main` znamená okamžité nasazení na ostrý web. Udělej ho jen tehdy, když
o to uživatel po odsouhlasení náhledu výslovně požádá. Samotné „uprav to" ani
„nasaď to" pokyn k produkci není — znamená to nasazení na staging podle kroku 3.

### Krok 3 — staging
Push feature větve automaticky nasadí náhled na Cloudflare Workers
(`.github/workflows/staging.yml`). Náhled je:

- dostupný z internetu na `https://jb-stg-<vetev>-<hash>.<účet>.workers.dev`
- za HTTP basic auth (uživatel `nahled`, heslo ze secretu `STAGING_PASSWORD`)
- neindexovatelný — `X-Robots-Tag: noindex, nofollow` na každé odpovědi
  a `robots.txt` s `Disallow: /`
- časově omezený — 5 dní od posledního pushe, pak vrací `410 Gone`;
  denní úklid worker smaže úplně

Produkční workflow (`deploy.yml`) běží jen nad `main` — z feature větve se na
ostrý web nedostaneš ani omylem.

### Krok 4 — otestuj si to sám, než to pošleš uživateli
Než dáš cokoli k posouzení, projdi si to vlastníma očima:

```bash
npm run shoot -- <staging-url> --user nahled --pass <heslo>
```

Skript udělá screenshoty v desktopové i mobilní šířce a vypíše chyby konzole
a nenačtené requesty. Screenshoty si **přečti a kriticky zhodnoť** — ne „build
prošel, hotovo". Hledej rozbité rozvržení, chybějící a duplicitní obrázky,
přetékající texty, špatné zalomení na mobilu. Když něco nesedí, oprav to a
zopakuj; uživateli posíláš až to, za čím si stojíš.

### Krok 5 — předání
Uživateli pošli konkrétní odkaz k otevření v prohlížeči na počítači i mobilu,
včetně přihlašovacích údajů:

> Náhled: https://jb-stg-….workers.dev
> Přihlášení: uživatel `nahled`, heslo — to, které je uložené v GitHub secretu
> `STAGING_PASSWORD`.
> Odkaz přestane fungovat <datum> (5 dní od posledního pushe).

Napiš i co přesně se změnilo a na co se má uživatel podívat.

---

## 3. Když to nejde

Když chybí secret, spadne staging deploy nebo si nejsi jistý výsledkem:
**zastav se a řekni to.** Nasazení do produkce není náhradní řešení za
nefunkční staging a není to způsob, jak si změnu prohlédnout.

---

## 4. Co se nikdy nedělá

- push do `main` bez výslovného pokynu k nasazení na ostrý web
- `git push --force`, mazání větví, přepis cizí historie
- vypnutí nebo obejití kontroly `npm run check:analytics`
- commit hesel, tokenů a klíčů — patří do GitHub secrets
- odstranění `public/CNAME`, `public/robots.txt` nebo basic auth ze staging workeru
- práce v repozitáři `nepouzivat-janbartosek.cz`

---

## 5. Kontrola před každým pushem

```bash
npm run verify    # build + kontrola analytiky
```

Pushuje se jen to, co projde.
