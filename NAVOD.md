# Jak upravit web

Návod pro každého. **Nemusíš umět nic technického** — nepotřebuješ znát git,
programování ani co je to commit. Stačí umět napsat větu.

> 💡 Chceš to na jednu stránku k vytisknutí? Vezmi si **[TAHAK.md](TAHAK.md)**.
> Tenhle návod je ta podrobnější verze.

---

## Jak to celé funguje

Web má dvě verze:

| | Adresa | Kdo to vidí |
|---|---|---|
| 🟢 **Ostrý web** | https://www.janbartosek.cz/ | všichni návštěvníci |
| 🟠 **Testovací verze** | https://www.janbartosek.cz/nahled/ | jen ten, kdo zná adresu — v Googlu se neobjeví |

Každá změna jde **nejdřív na testovací verzi**. Podíváš se, jestli to tak chceš,
a teprve pak se pustí na ostrý web.

```
   Napíšeš, co chceš  →  Claude to udělá  →  Podíváš se na test  →  Řekneš "ano"  →  Je to na webu
```

Testovací verze je poznat na první pohled — dole má oranžový pruh **NÁHLED**.
Když ho tam vidíš, koukáš na test. Když ne, koukáš na ostrý web.

---

## Krok za krokem

### 1. Otevři si projekt v Claudovi

### 2. Napiš normální větou, co chceš

Nemusíš nic formátovat, nemusíš znát názvy souborů. Prostě to napiš:

> Změň v úvodu větu „Pracuji pro bezpečnost Česka" na „Pracuji pro bezpečné
> Česko a silné regiony."

> Přidej článek o návštěvě hasičské soutěže v Dačicích. Byla v sobotu, přišlo
> osm sborů, tady je pár vět, co jsem si zapsal: …

> Vyměň fotku v hlavičce za tuhle. *(a přiložíš fotku)*

> Změň kontaktní e-mail na kancelar@janbartosek.cz

> Skryj ten článek o Green Dealu, zatím ho nechci zveřejnit.

Když si nejsi jistý, jestli to jde, prostě se zeptej. A když nevíš, co říct,
napiš `/pomoc`.

### 3. Claude ti odpoví odkazem na testovací verzi

Bude to vypadat nějak takhle:

> Hotovo. Změnil jsem úvodní větu.
> Podívej se na testovací verzi: **https://www.janbartosek.cz/nahled/**
> (do minuty se to tam objeví). Napiš mi, jestli to tak chceš.

**Počkej zhruba minutu**, než se změna na testovací adrese objeví — web se mezitím
sestavuje. Když vidíš ještě starou verzi, zmáčkni `Ctrl` + `Shift` + `R`
(na Macu `Cmd` + `Shift` + `R`) — tím se stránka načte úplně znovu.

### 4. Podívej se a řekni, co dál

**Líbí se ti to?**

> Ano, pusť to na ostrý web.

**Chceš ještě něco upravit?**

> Ta věta je moc dlouhá, zkrať ji.
> A ten nadpis dej tučně.

Claude to opraví a zase pošle odkaz na test. Tohle můžeš opakovat, kolikrát chceš —
na ostrý web se do té doby nedostane nic.

### 5. Hotovo

Po tvém souhlasu Claude změnu pustí na ostrý web a napíše ti to. Do minuty
je to na https://www.janbartosek.cz/.

---

## Když se něco nepovede

| Co se děje | Co s tím |
|---|---|
| Na testu vidím starou verzi | Počkej minutu a zmáčkni `Ctrl`+`Shift`+`R` (Mac: `Cmd`+`Shift`+`R`) |
| Na testu je stránka „Náhled se nepodařilo sestavit" | Napiš Claudovi: *náhled se nepostavil, oprav to*. Ostrého webu se to netýká. |
| Zveřejnil jsem něco a chci to zpátky | Napiš: **vrať to zpátky**. Web se vrátí do stavu před změnou. |
| Nevím, co je zrovna zveřejněné | Napiš: **jak to teď vypadá?** nebo `/stav` |
| Claude říká, že něco uložit nemůže | Má pravdu — viz sekce níž. Nech si vysvětlit proč. |

**Nic nejde rozbít natrvalo.** Každá verze webu se dá vrátit zpátky. Klidně
zkoušej.

---

## Co sem nikdy nepatří

Tenhle projekt je **veřejný** — kdokoliv na internetu si ho může prohlédnout,
i to, co jsi tam dal a pak smazal.

Nikdy sem neposílej k uložení:

- ❌ marketingové strategie, analýzy, průzkumy, koncepty kampaní
- ❌ interní poznámky, zápisy z porad
- ❌ smlouvy, nabídky, faktury, rozpočty
- ❌ hesla, přístupy, klíče
- ❌ rodná čísla, čísla účtů, soukromé adresy a telefony
- ❌ wordovské dokumenty, tabulky, prezentace, ZIPy

Claude tě upozorní a neuloží to. Bere to jako pravidlo, ne jako doporučení.

**Potřebuješ, aby Claude podle takového podkladu psal?** To je v pořádku — dej mu
soubor do složky `_local/` v projektu. Ta zůstane jen na tvém disku a nikam se
neodešle. Claude si ji přečte, ale obsah do webu nezkopíruje.

⚠️ **Pozor:** testovací verze je veřejná taky. Neplatí tam volnější pravidla.

---

## Rychlé příkazy

Nemusíš je používat — obyčejná věta funguje úplně stejně. Ale když chceš:

| Napiš | Co se stane |
|---|---|
| `/pomoc` | Vysvětlí, co všechno jde dělat |
| `/uprava` | Provede úpravu od začátku do konce |
| `/nahled` | Nasadí aktuální stav na testovací adresu |
| `/publikovat` | Pustí odsouhlasenou verzi na ostrý web |
| `/vratit-zpet` | Vrátí poslední změnu |
| `/stav` | Ukáže, co je na webu a co na testu |
| `/kontrola` | Zkontroluje, že je všechno v pořádku |

---

## Jedna prosba na závěr

Claude s tebou mluví lidsky, protože to tak má nastavené. Kdyby ti to přišlo moc
rozvláčné a chceš technické detaily, napiš **„jsem expert"** — přepne se do
technického režimu.
