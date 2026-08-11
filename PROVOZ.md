# Provoz projektu

Dokument pro super admina. Popisuje, jak je projekt postavený, co ho drží
pohromadě a co udělat, když se něco pokazí.

Pro běžnou úpravu obsahu stačí [NAVOD.md](NAVOD.md).

---

## 1. Architektura nasazení

Statický web (Astro) na GitHub Pages. Repozitář **musí zůstat veřejný**, protože
GitHub Pages je zdarma jen pro veřejné repozitáře. Z toho plyne všechno ostatní
v tomhle dokumentu.

| Větev | URL | Poznámka |
|---|---|---|
| `main` | https://www.janbartosek.cz/ | ostrá verze, každý push se nasadí |
| `nahled` | https://www.janbartosek.cz/nahled/ | testovací verze, `noindex`, oranžový pruh |

### Jak vznikají dvě URL z jednoho Pages webu

GitHub Pages umí na repozitář jen **jedno** nasazení. Workflow to řeší tak, že
při každém pushi (do `main` i do `nahled`) sestaví **obě větve najednou**:

```
produkce/dist/  →  web/          →  jeden artefakt  →  Pages
nahled/dist/    →  web/nahled/
```

Náhled se ale staví do podadresáře, kde by absolutní cesty (`/images/foo.webp`)
mířily do produkce. Proto po buildu běží `scripts/make-preview.mjs`, který:

1. přepíše absolutní cesty na `/nahled/…`,
2. vloží `<meta name="robots" content="noindex, nofollow">`,
3. přidá oranžový pruh **NÁHLED** (aby si ho nikdo nespletl s ostrým webem),
4. smaže `sitemap*.xml`, `robots.txt`, `CNAME` a `_headers`,
5. **ověří, že nezbyla cesta mířící na kořen domény** — jinak build selže.

Díky tomu se ve zdrojácích webu nemusí nic řešit; vývoj probíhá pořád proti `/`.

### Odolnost

| Co se stane | Důsledek |
|---|---|
| Build `nahled` spadne | Produkce se nasadí normálně, na `/nahled/` se objeví `scripts/nahled-chyba.html` |
| Build `main` spadne | Nenasadí se nic, na webu zůstane poslední funkční verze |
| Větev `nahled` neexistuje | Nasadí se jen produkce, workflow to jen poznamená |
| Guard něco najde | Zastaví se celý workflow ještě před buildem |

---

## 2. Pojistky proti úniku dat

Čtyři nezávislé vrstvy. Každá sama o sobě má díru, dohromady drží.

| # | Vrstva | Kde | Kdy zabere |
|---|---|---|---|
| 1 | `.gitignore` | kořen repozitáře | soubor se ani nenabídne ke commitu |
| 2 | Hook agenta | `.claude/hooks/guard-tool-use.mjs` | AI se pokusí zapsat zakázaný soubor nebo pushnout do `main` |
| 3 | `pre-commit` + `commit-msg` | `.githooks/` | **commit vůbec nevznikne** |
| 4 | CI guard | `.github/workflows/` | nasazení se zastaví |

**Vrstva 3 je ta rozhodující**, protože je poslední, která běží *před* vznikem
commitu. Vrstvy 1, 2 a 4 ji doplňují. Proto se hooky instalují automaticky při
startu každého sezení agenta (`.claude/hooks/session-start.sh`) a ručně přes:

```bash
bash scripts/install-hooks.sh
```

### Co guard kontroluje

```bash
node scripts/guard.mjs --explain    # vypíše aktuální pravidla
node scripts/guard.mjs              # celý repozitář
node scripts/guard.mjs --staged     # jen připravené změny
node scripts/guard.test.mjs         # test samotného guardu (20 případů)
```

Pravidla ve zkratce:

- **Povolená umístění** — `src/`, `public/`, `assets/`, `scripts/`, `.github/`,
  `.githooks/`, `.claude/` a jmenovitý seznam souborů v kořeni.
  Cokoliv jinde je zakázané (deny by default). Přesně tohle by zastavilo
  původní `docs/` s marketingovými podklady.
- **Zakázané názvy** — `strategie`, `analyza`, `marketing`, `interni`, `smlouva`,
  `faktura`, `heslo`, `secret`, `backup`, `export`, …
- **Zakázané přípony** — kancelářské dokumenty, exporty dat, archivy, databáze,
  klíče. `.pdf` je povolené jen v `public/dokumenty/`.
- **Obsah** — 12 vzorů přístupových údajů (privátní klíče, tokeny GitHubu,
  AWS, Google, Slack, JWT, connection stringy, `password: "…"`),
  označení důvěrnosti (i bez diakritiky) a osobní údaje (rodné číslo, IBAN).
- **Velikost** — tvrdý limit 10 MB, upozornění nad 2 MB.

Poslední kontrola běží těsně před nasazením nad hotovým buildem:
`scripts/check-dist.mjs` — chytí i to, co by do výstupu propašoval nějaký nástroj.

### Výjimky z guardu

Jen když je nález prokazatelně falešný poplach. Soubor `.guard-allow` v kořeni:

```
# cesta | pravidlo        (pravidlo lze vynechat = všechna pravidla pro daný soubor)
src/data/kontakty.ts | pii:iban
public/images/agenda.pdf | path:forbidden-ext
```

Každý řádek je vědomé rozhodnutí zveřejnit něco, co pojistka označila.
Nepoužívej `git commit --no-verify` — to vypne kontrolu celou, ne jen jeden nález.

Rozšíření povolených umístění se dělá v `scripts/guard.mjs`
(`ALLOWED_DIRS`, `ALLOWED_ROOT_FILES`), ne přes `.guard-allow`.

---

## 3. Role uživatelů

| Režim | Kdo | Jak se pozná |
|---|---|---|
| A — správce obsahu | výchozí, každé nové sezení | agent mluví česky bez odborných slov, edituje jen obsah |
| B — super admin | po větě **„jsem expert"** | agent mluví technicky, smí do infrastruktury |

Režim B agent poznamená prázdným souborem `.claude/.rezim-superadmin`
(v `.gitignore`), podle kterého hook povolí zásahy do `.github/`, `scripts/`,
`.githooks/`, `.claude/` a konfigurace. Session-start hook ho na začátku každého
sezení maže, takže **odemčení nepřechází do dalšího sezení**.

Bezpečnostní pravidla platí v obou režimech stejně. Režim B odemyká techniku,
ne únik dat.

---

## 4. Co nastavit na GitHubu (jednorázově)

Tohle nejde udělat z repozitáře, musí se naklikat v **Settings**.

- [ ] **Pages → Build and deployment → Source: `GitHub Actions`**
- [ ] **Pages → Custom domain:** `www.janbartosek.cz`, zaškrtnout **Enforce HTTPS**
- [ ] **Code security → Secret scanning: zapnout**
- [ ] **Code security → Push protection: zapnout**
      → jediná pojistka, která zastaví push s tajemstvím **na straně GitHubu**,
      ještě než se objekt uloží. Pro veřejné repozitáře zdarma.
- [ ] **Rules / Branches → pravidlo pro `main`:**
      zakázat force push, zakázat mazání větve,
      vyžadovat úspěšný check **„Kontrola citlivého obsahu"**
- [ ] **Actions → General → Workflow permissions: `Read repository contents`**
      (workflow si vyšší oprávnění vyžádá sám v `permissions:`)
- [ ] **General → Pull Requests → `Allow auto-merge`: zapnout**
      → Bez tohohle je v Claude Code UI volba **„Auto-merge when ready"**
      zašedlá a nejde zaškrtnout. UI neřekne proč — vypadá to jako rozbité
      tlačítko, ale je to tahle nezapnutá volba v repozitáři.
      GitHub ji má u nových repozitářů vypnutou.
- [ ] **Vytvořit větev `nahled`** — z aktuálního `main`, až budou tyhle změny
      v `main`. Jinak na ní nebude nový workflow.

```bash
git fetch origin
git push origin origin/main:refs/heads/nahled
```

Nebo se `nahled` založí sama při prvním `git push origin HEAD:nahled`.

---

## 5. Když už něco uniklo

Postupuj v tomhle pořadí. **Smazání souboru dalším commitem není náprava** —
obsah zůstává v historii, ve forcích a v cache GitHubu.

1. **Byly to přístupové údaje?** Okamžitě je zneplatni a vyměň. Tohle je první
   krok, ne poslední — od chvíle pushnutí je považuj za vyzrazené.
2. **Zjisti rozsah:** kdy to bylo pushnuté, kolik commitů, jestli repozitář někdo
   forknul, jestli je to v Google cache.
   ```bash
   git log --all --oneline -- <cesta>
   ```
3. **Krátkodobě:** přepni repozitář na private (Settings → Danger Zone).
   Pages přestanou fungovat, ale zastaví se šíření. Web mezitím může běžet
   z posledního nasazení.
4. **Přepis historie** — `git filter-repo`, pak force push. Rozbije to všechny
   klony; každý, kdo repozitář má, ho musí naklonovat znovu. Dělá se to jen
   tady, ne v agentském sezení.
5. **Cache GitHubu:** kontaktovat GitHub Support kvůli vyčištění cache
   a smazání forků.
6. **Doplň pojistku**, aby se to neopakovalo — nové pravidlo do
   `scripts/guard.mjs` a nový případ do `scripts/guard.test.mjs`.

---

## 6. Kde jsou hranice těchhle pojistek

Poctivě, ať se na ně nespoléhá víc, než unesou:

- **Chrání proti nehodě, ne proti záměru.** Kdo má právo pushovat, může si na
  své větvi workflow upravit. Trust boundary je seznam lidí s přístupem
  k repozitáři, ne tyhle skripty.
- **CI guard běží až po pushi.** V tu chvíli je obsah už na GitHubu. Zastaví
  nasazení, ale ne únik — proto jsou důležité vrstvy 1–3 a push protection.
- **Guard hledá vzory, ne význam.** Odstavec interní strategie napsaný přímo do
  `src/data/site.ts` neodhalí nic. Poslední kontrola je vždycky člověk.
- **Náhled je veřejně dostupný.** `noindex` drží mimo vyhledávače, ne mimo
  internet. Pro citlivý obsah není náhled bezpečnější než produkce.
- **Hooky agenta platí jen v Claude Code.** Jiný nástroj nebo ruční `git` je
  neuvidí — proto jsou lokální git hooky (vrstva 3) povinné.

---

## 7. Provozní příkazy

```bash
# kompletní kontrola před zásahem
node scripts/guard.mjs && node scripts/guard.test.mjs && npm run build && node scripts/check-dist.mjs dist

# vyzkoušet náhledový build lokálně
npm run build && cp -r dist dist-nahled \
  && node scripts/make-preview.mjs --dir dist-nahled --branch nahled --commit "$(git rev-parse HEAD)" \
  && npx serve dist-nahled       # otevře se na /, pruh NÁHLED musí být vidět

# srovnat náhled s produkcí (zahodí rozdělanou práci na nahled)
git fetch origin && git push --force-with-lease origin origin/main:refs/heads/nahled

# vrátit produkci o commit zpět
git fetch origin && git checkout -B vraceni origin/main \
  && git revert --no-edit HEAD && git push origin HEAD:main
```

---

## 8. Změna domény

Na třech místech, všechna musí souhlasit:

| Soubor | Co |
|---|---|
| `public/CNAME` | doména pro GitHub Pages |
| `astro.config.mjs` → `site` | kanonické URL, sitemap, Open Graph |
| `src/data/site.ts` → `url` | odkazy v obsahu |

Plus `public/robots.txt` (odkaz na sitemapu) a texty v `CLAUDE.md`, `NAVOD.md`,
`README.md` a `.claude/commands/`, kde jsou adresy natvrdo.
