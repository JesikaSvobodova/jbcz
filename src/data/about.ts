/**
 * Obsah stránky "O mně" — kompletní životopis a příběh.
 *
 * Odděleno od šablon, aby AI agent mohl snadno aktualizovat
 * texty bez zásahu do HTML struktury.
 */

export const about = {
  title: "O mně",
  description:
    "Životní příběh a politická kariéra poslance Jana Bartoška — z terapeuta závislostí do Poslanecké sněmovny.",

  /** Intro odstavec */
  intro:
    "Moje cesta vedla z terapeutické komunity přes komunální politiku až do Poslanecké sněmovny.",

  /** Časová osa kariéry */
  timeline: [
    {
      year: "1971",
      title: "Narození v Jihlavě",
      text: "Narodil jsem se 10. listopadu 1971 v Jihlavě. Vyrůstal jsem v době, kdy komunismus omezoval svobodu našeho života — to zformovalo moje vidění světa.",
    },
    {
      year: "90. léta",
      title: "Studium",
      text: "Vystudoval jsem Zemědělskou fakultu Jihočeské univerzity v Českých Budějovicích. Pedagogické minimum na ČZU v Praze a bezpečnostní studium na Univerzitě CEVRO — Master of Public Administration, obor Bezpečnostní a krizový management.",
    },
    {
      year: "1995–1999",
      title: "Civilní vojenská služba a STAGRA s.r.o.",
      text: "Absolvoval jsem civilní vojenskou službu a pracoval jako zootechnik ve společnosti STAGRA s.r.o. ve Studené.",
    },
    {
      year: "2000–2010",
      title: "Terapeut v Podcestném Mlýně",
      text: "Pomáhal jsem lidem závislým na nealkoholových drogách v Terapeutické komunitě Podcestný Mlýn u Dačic. Pomáhal jsem lidem najít cestu zpět do života — tato zkušenost mě formovala víc než cokoliv jiného.",
    },
    {
      year: "2006",
      title: "Vstup do KDU-ČSL",
      text: "Rozhodl jsem se vstoupit do politiky, protože jsem chtěl aktivně utvářet svět, ve kterém žiji. KDU-ČSL jsem si vybral pro její hodnoty — úcta k člověku, rodině a naší vlasti.",
    },
    {
      year: "2010",
      title: "Místostarosta Dačic",
      text: "Začínal jsem v komunální politice jako zastupitel a místostarosta města Dačice.",
    },
    {
      year: "2013",
      title: "Zvolen poslancem",
      text: "Ve volbách do Poslanecké sněmovny jsem získal mandát za Jihočeský kraj. Začala nová kapitola — celostátní politika.",
    },
    {
      year: "2014–2017",
      title: "Místopředseda Sněmovny",
      text: "Byl jsem zvolen místopředsedou Poslanecké sněmovny. Funkce, která mi umožnila aktivně formovat legislativní proces.",
    },
    {
      year: "2017–2021",
      title: "Předseda poslaneckého klubu KDU-ČSL",
      text: "Od 24. října 2017 do 21. října 2021 jsem vedl poslanecký klub KDU-ČSL. Zároveň jsem byl členem Výboru pro obranu a komisí pro kontrolu zpravodajských služeb — BIS, ÚZSI a Vojenského zpravodajství.",
    },
    {
      year: "2021–2025",
      title: "Koalice SPOLU a opět místopředseda",
      text: "V rámci koalice SPOLU jsem opět zvolen poslancem a místopředsedou Sněmovny. Zaměřil jsem se na bezpečnostní politiku a kybernetickou bezpečnost.",
    },
    {
      year: "2025–",
      title: "Aktuální období",
      text: "Pokračuji jako poslanec za Jihočeský kraj. Působím ve Výboru pro bezpečnost, Stálé komisi pro kontrolu BIS a Vojenského zpravodajství. Bezpečnost Česka je mou prioritou.",
    },
  ],

  /** Aktuální funkce */
  currentRoles: [
    "Poslanec PSP ČR za Jihočeský kraj",
    "Člen Výboru pro bezpečnost",
    "Člen Stálé komise pro kontrolu činnosti BIS",
    "Člen Stálé komise pro kontrolu činnosti Vojenského zpravodajství",
    "Člen Podvýboru pro akvizice MO a obranný průmysl",
    "Člen Stálé delegace Parlamentu do Meziparlamentní unie",
  ],

  /** Citát */
  quote: {
    text: "Bezpečnost je základním předpokladem svobody i prosperity.",
    context: "O prioritách v bezpečnostní politice",
  },
} as const;
