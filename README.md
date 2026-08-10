# janbartosek.cz

Osobní web poslance Ing. Jana Bartoška, MPA (KDU-ČSL, Jihočeský kraj).

**Stack:** Astro + Tailwind CSS + Markdown. Výstupem je čistý statický HTML bez databáze.

---

## Rychlý start

```bash
npm install      # instalace závislostí
npm run dev      # lokální vývojový server (http://localhost:4321)
npm run build    # produkční build → složka dist/
npm run preview  # náhled produkčního buildu
```

---

## Jak přidat článek

1. Vytvořit soubor `src/content/blog/nazev-clanku.md`
2. Přidat frontmatter:
   ```markdown
   ---
   title: "Název článku"
   description: "Krátký popis"
   date: 2026-03-01
   category: "bezpecnost"
   tags: ["tag1", "tag2"]
   draft: false
   ---
   ```
3. Napsat obsah v Markdown
4. `git push` → web se automaticky aktualizuje

**Kategorie:** `bezpecnost`, `snemovna`, `jihocesky-kraj`, `osobni`

---

## Jak upravit obsah webu

Veškerý editovatelný obsah je v datových souborech — **ne v šablonách**:

| Co chci změnit | Kde to najdu |
|----------------|-------------|
| Jméno, kontakty, sociální sítě, texty na homepage | `src/data/site.ts` |
| Stránka "O mně" — životopis, časová osa, funkce | `src/data/about.ts` |
| Články na blogu | `src/content/blog/*.md` |
| Dokumentace projektu | `docs/` |

---

## Build a deploy

### Build

```bash
npm run build
```

Výstupem je složka `dist/` — obsahuje **čistý statický HTML, CSS a JS**. Tuto složku stačí nahrát na jakýkoliv hosting.

### Varianta 1: Cloudflare Pages (doporučeno, zdarma)

1. Vytvořit účet na [Cloudflare](https://dash.cloudflare.com/)
2. Pages → Create a project → Connect to Git
3. Vybrat tento repozitář
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Nasměrovat doménu janbartosek.cz na Cloudflare

### Varianta 2: GitHub Pages (zdarma)

1. V repozitáři: Settings → Pages → Source: GitHub Actions
2. V `.github/workflows/deploy.yml` odkomentovat blok `deploy-github-pages`
3. Push na `main` → automatický deploy

### Varianta 3: Vercel (zdarma)

1. [vercel.com](https://vercel.com) → Import Git Repository
2. Framework preset: Astro
3. Deploy — hotovo

### Varianta 4: Jakýkoliv hosting (Wedos, Forpsi, ...)

1. `npm run build`
2. Obsah složky `dist/` nahrát přes FTP/SFTP na hosting
3. Nasměrovat doménu na hosting

### Varianta 5: Ruční deploy přes GitHub Actions artifact

1. Push na `main`
2. GitHub Actions → poslední run → Download artifact `site`
3. Rozbalit ZIP a nahrát na hosting

---

## CI/CD pipeline

Při každém push na `main` se automaticky:

1. Nainstalují závislosti
2. Spustí se build
3. Výsledný artefakt se uloží

Pro automatický deploy stačí odkomentovat příslušný blok v `.github/workflows/deploy.yml`.

---

## Struktura projektu

```
├── docs/                   # Projektová dokumentace (strategie, brand, zadání)
├── public/                 # Statické soubory (obrázky, favicon, robots.txt)
├── src/
│   ├── components/         # Astro komponenty (Header, Footer, Hero, ...)
│   ├── content/blog/       # Markdown články
│   ├── data/               # Editovatelná data (site.ts, about.ts)
│   ├── layouts/            # Layouty stránek
│   ├── pages/              # Routy (homepage, blog, kontakt, o-mne)
│   └── styles/             # Globální CSS
├── .github/workflows/      # CI/CD pipeline
├── astro.config.mjs        # Konfigurace Astro
├── tailwind.config.mjs     # Konfigurace Tailwind
└── package.json
```

---

## Dokumentace

| Dokument | Popis |
|----------|-------|
| [Analýza osobnosti](docs/analyza-osobnosti.md) | Kdo je Jan Bartošek, hodnoty, kariéra |
| [Marketingová strategie](docs/marketingova-strategie.md) | Cílové skupiny, obsah, kanály |
| [Brand a komunikace](docs/brand-a-komunikace.md) | Vizuální identita, komunikační principy |
| [Technické zadání](docs/technicke-zadani.md) | Architektura, stack, fáze implementace |
