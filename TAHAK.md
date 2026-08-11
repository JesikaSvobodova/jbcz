# Tahák: jak změnit web

Vytiskni si to, nebo si to nech otevřené. Víc než tohle vědět nepotřebuješ.

---

## Celé to jsou tři kroky

```
  1. ŘEKNI          2. KOUKNI          3. POTVRĎ
     co chceš   →      na test    →      a je to na webu
```

### 1. ŘEKNI

Otevři si projekt v Claudovi a napiš normální větou, co chceš změnit.
Žádné příkazy, žádné názvy souborů. Prostě to řekni:

> Změň v úvodu větu „Pracuji pro bezpečnost Česka" na „Pracuji pro bezpečné Česko."

### 2. KOUKNI

Claude ti pošle odkaz na **testovací verzi**. Počkej minutu a podívej se.

Nelíbí se ti to? Řekni, co upravit — třeba *„ta věta je moc dlouhá, zkrať ji"*.
Claude to opraví a pošle odkaz znovu. Takhle dokola, kolikrát chceš.

### 3. POTVRĎ

Když je to, jak chceš, napiš:

> Ano, pusť to na ostrý web.

Do minuty je to venku. **Bez téhle věty se nic nezveřejní.**

---

## Dvě adresy

| | Adresa | Poznámka |
|---|---|---|
| 🟢 **Ostrý web** | www.janbartosek.cz | vidí ho všichni |
| 🟠 **Test** | www.janbartosek.cz/**nahled**/ | má dole oranžový pruh, v Googlu není |

**Jak poznám, kde jsem?** Oranžový pruh dole = test. Žádný pruh = ostrý web.

---

## Jedno pravidlo

🚫 **Nic interního.** Projekt je veřejný — čte ho kdokoliv.

Žádné strategie, analýzy, poznámky z porad, smlouvy, nabídky, faktury, hesla,
rodná čísla ani čísla účtů. Ani na testovací verzi.

Claude tě zastaví, kdyby ses o to pokusil. Bere to jako pravidlo, ne jako radu.

*Potřebuješ, aby podle takového podkladu psal?* Dej mu soubor do složky
`_local/` — ta zůstane jen na tvém počítači.

---

## Když se něco nepovede

| Vidím… | Napíšu… |
|---|---|
| starou verzi | *(zmáčknu `Ctrl`+`Shift`+`R`, na Macu `Cmd`+`Shift`+`R`)* |
| „Náhled se nepodařilo sestavit" | **náhled se nepostavil, oprav to** |
| že jsem zveřejnil blbost | **vrať to zpátky** |
| a nevím, co je teď na webu | **jak to teď vypadá?** |
| a vůbec nevím, co dál | **/pomoc** |

**Nic nejde rozbít natrvalo.** Každá verze se dá vrátit. Klidně zkoušej.

---

## Věty, které fungují

> Přidej článek o návštěvě hasičské soutěže v Dačicích. *(a připojíš poznámky)*
>
> Vyměň fotku v hlavičce. *(a přiložíš fotku)*
>
> Změň kontaktní e-mail na kancelar@janbartosek.cz
>
> Skryj ten článek o Green Dealu, zatím ho nechci zveřejnit.
>
> Oprav překlep ve třetím odstavci na hlavní straně.

Nevíš, jestli to jde? **Zeptej se.** Claude ti řekne, co s tím.

---

## Zlaté pravidlo

> **Nikdy nic nepublikuj, cos neviděl na testu.**

Když se ti Claude nabídne, že to rovnou pustí ven — nenech ho. Nejdřív test.

---

*Podrobnější návod: [NAVOD.md](NAVOD.md) · Technické věci: [PROVOZ.md](PROVOZ.md)*
