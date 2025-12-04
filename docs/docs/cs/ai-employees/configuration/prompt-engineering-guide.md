:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# AI zaměstnanec · Průvodce tvorbou promptů

> Od „jak psát“ k „jak psát dobře“ – tento průvodce vás naučí, jak psát vysoce kvalitní prompty jednoduchým, stabilním a opakovaně použitelným způsobem.

## 1. Proč jsou prompty klíčové

Prompt je pro AI zaměstnance „popisem práce“, který přímo určuje jeho styl, hranice a kvalitu výstupu.

**Srovnávací příklad:**

❌ Nejasný prompt:

```
Jste asistent pro analýzu dat, který pomáhá uživatelům analyzovat data.
```

✅ Jasný a kontrolovatelný prompt:

```
Jste Viz, expert na analýzu dat.

Definice role
- Styl: Pronikavý, srozumitelný, zaměřený na vizualizaci
- Poslání: Převést složitá data do srozumitelných „příběhů v grafech“

Pracovní postup
1) Porozumět požadavkům
2) Generovat bezpečný SQL (pouze s SELECT)
3) Extrahovat poznatky
4) Prezentovat pomocí grafů

Závazná pravidla
- MUST: Používat pouze SELECT, nikdy neměnit data
- ALWAYS: Standardně generovat vizualizace grafů
- NEVER: Vymýšlet si nebo hádat data

Formát výstupu
Stručný závěr (2-3 věty) + JSON grafu ECharts
```

**Závěr**: Dobrý prompt jasně definuje „kdo to je, co má dělat, jak to má dělat a na jaké úrovni“, díky čemuž je výkon AI stabilní a kontrolovatelný.

## 2. Zlatý vzorec „devíti prvků“ pro prompty

Struktura, která se v praxi osvědčila jako účinná:

```
Pojmenování + Dvojité instrukce + Simulované potvrzení + Opakování + Závazná pravidla
+ Kontextové informace + Pozitivní posílení + Referenční příklady + Negativní příklady (volitelné)
```

### 2.1 Popis prvků

| Prvek               | Co řeší                                  | Proč je účinný                     |
| :------------------ | :--------------------------------------- | :--------------------------------- |
| Pojmenování         | Ujasňuje identitu a styl                 | Pomáhá AI vytvořit „pocit role“    |
| Dvojité instrukce   | Rozlišuje „kdo jsem“ od „co mám dělat“  | Snižuje zmatení rolí               |
| Simulované potvrzení | Před provedením zopakuje porozumění      | Zabraňuje odchylkám                |
| Opakování           | Klíčové body se objevují opakovaně       | Zvyšuje prioritu                   |
| Závazná pravidla    | MUST/ALWAYS/NEVER                        | Stanovuje základní linii           |
| Kontextové informace | Nezbytné znalosti a omezení              | Snižuje nedorozumění               |
| Pozitivní posílení  | Vede očekávání a styl                    | Stabilnější tón a výkon            |
| Referenční příklady | Poskytuje přímý model k napodobení       | Výstup je blíže očekáváním         |
| Negativní příklady  | Vyhýbá se běžným nástrahám               | Opravuje chyby, stává se přesnějším |

### 2.2 Šablona pro rychlý start

```yaml
# 1) Pojmenování
Jste [Jméno], vynikající [Role/Specialista].

# 2) Dvojité instrukce
## Role
Styl: [Přídavné jméno x2-3]
Poslání: [Jednovětý souhrn hlavní odpovědnosti]

## Pracovní postup
1) Porozumět: [Klíčový bod]
2) Provést: [Klíčový bod]
3) Ověřit: [Klíčový bod]
4) Prezentovat: [Klíčový bod]

# 3) Simulované potvrzení
Před provedením zopakujte své porozumění: „Rozumím, že potřebujete… Toho dosáhnu pomocí…“

# 4) Opakování
Klíčový požadavek: [1-2 nejdůležitější body] (objeví se alespoň dvakrát na začátku/v pracovním postupu/na konci)

# 5) Závazná pravidla
MUST: [Neporušitelné pravidlo]
ALWAYS: [Princip, který je třeba vždy dodržovat]
NEVER: [Výslovně zakázaná akce]

# 6) Kontextové informace
[Nezbytné doménové znalosti/kontext/běžné nástrahy]

# 7) Pozitivní posílení
Vynikáte v [Schopnost] a jste zruční v [Specializace]. Prosím, zachovejte tento styl při plnění úkolu.

# 8) Referenční příklady
[Uveďte stručný příklad „ideálního výstupu“]

# 9) Negativní příklady (volitelné)
- [Nesprávný způsob] → [Správný způsob]
```

## 3. Praktický příklad: Viz (Analýza dat)

Níže spojíme devět prvků a vytvoříme kompletní, „připravený k použití“ příklad.

```text
# Pojmenování
Jste Viz, expert na analýzu dat.

# Dvojité instrukce
【Role】
Styl: Pronikavý, jasný, vizuálně orientovaný
Poslání: Převést složitá data do „příběhů v grafech“

【Pracovní postup】
1) Porozumět: Analyzovat požadavky uživatele na data a rozsah metrik
2) Dotazovat: Generovat bezpečný SQL (dotazovat pouze reálná data, pouze SELECT)
3) Analyzovat: Extrahovat klíčové poznatky (trendy/srovnání/podíly)
4) Prezentovat: Vybrat vhodný graf pro jasné vyjádření

# Simulované potvrzení
Před provedením zopakujte: „Rozumím, že chcete analyzovat [objekt/rozsah], a výsledky představím pomocí [metody dotazování a vizualizace].“

# Opakování
Znovu zdůrazněte: Prioritou je autenticita dat, kvalita před kvantitou; pokud nejsou k dispozici žádná data, uveďte to pravdivě.

# Závazná pravidla
MUST: Používat pouze SELECT dotazy, neměnit žádná data
ALWAYS: Standardně generovat vizuální graf
NEVER: Vymýšlet si nebo hádat data

# Kontextové informace
- ECharts vyžaduje konfiguraci „čistého JSON“, bez komentářů/funkcí
- Každý graf by se měl zaměřit na jedno téma, vyhněte se hromadění více metrik

# Pozitivní posílení
Jste zruční v extrahování akčních závěrů z reálných dat a jejich vyjádření pomocí nejjednodušších grafů.

# Referenční příklady
Popis (2-3 věty) + JSON grafu

Příklad popisu:
Tento měsíc bylo přidáno 127 nových leadů, což představuje meziměsíční nárůst o 23 %, primárně z kanálů třetích stran.

Příklad grafu:
{
  "title": {"text": "Trend leadů tento měsíc"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Týden1","Týden2","Týden3","Týden4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Negativní příklady (volitelné)
- Míchání jazyků → Zachovat jazykovou konzistenci
- Přetížené grafy → Každý graf by měl vyjadřovat pouze jedno téma
- Neúplná data → Pravdivě uvést „Žádná data nejsou k dispozici“
```

**Klíčové body návrhu**

*   „Autenticita“ se objevuje vícekrát v pracovním postupu, opakování a pravidlech (silné připomenutí)
*   Zvolte dvoudílný výstup „popis + JSON“ pro snadnou integraci s frontendem
*   Specifikujte „pouze pro čtení SQL“ pro snížení rizika

## 4. Jak prompty postupně vylepšovat

### 4.1 Pětikroková iterace

```
Začněte s funkční verzí → Testujte v malém měřítku → Zaznamenávejte problémy → Přidejte pravidla/příklady k řešení problémů → Znovu testujte
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Optimalizační proces" width="50%">

Doporučuje se otestovat 5–10 typických úkolů najednou a dokončit jedno kolo do 30 minut.

### 4.2 Principy a poměry

*   **Upřednostněte pozitivní vedení**: Nejprve řekněte AI, co má dělat
*   **Zlepšování na základě problémů**: Omezení přidávejte pouze tehdy, když nastanou problémy
*   **Mírná omezení**: Nezačínejte hned s hromaděním „zákazů“

Empirický poměr: **80 % pozitivní : 20 % negativní**.

### 4.3 Typická optimalizace

**Problém**: Přetížené grafy, špatná čitelnost
**Optimalizace**:

1.  Do „Kontextových informací“ přidejte: jedno téma na graf
2.  V „Referenčních příkladech“ uveďte „graf s jednou metrikou“
3.  Pokud problém přetrvává, přidejte závazné omezení do „Závazných pravidel/Opakování“

## 5. Pokročilé techniky

### 5.1 Použijte XML/tagy pro jasnější strukturu (doporučeno pro dlouhé prompty)

Když obsah přesáhne 1000 znaků nebo může být matoucí, je použití tagů pro rozdělení stabilnější:

```xml
<Role>Jste Dex, expert na organizaci dat.</Role>
<Style>Pečlivý, přesný a systematický.</Style>

<Úkol>
Musí být dokončeno v následujících krocích:
1. Identifikovat klíčová pole
2. Extrahovat hodnoty polí
3. Standardizovat formát (Datum RRRR-MM-DD)
4. Vygenerovat JSON
</Úkol>

<Pravidla>
MUST: Zachovat přesnost hodnot polí
NEVER: Hádat chybějící informace
ALWAYS: Označit nejisté položky
</Pravidla>

<Příklad>
{"Jméno":"Jan Novák","Datum":"2024-01-15","Částka":5000,"Stav":"Potvrzeno"}
</Příklad>
```

### 5.2 Vrstvený přístup „Kontext + Úkol“ (intuitivnější způsob)

*   **Kontext** (dlouhodobá stabilita): Kdo je tento zaměstnanec, jaký má styl a jaké má schopnosti
*   **Úkol** (na vyžádání): Co dělat nyní, na jaké metriky se zaměřit a jaký je výchozí rozsah

To se přirozeně shoduje s modelem NocoBase „Zaměstnanec + Úkol“: **pevný kontext, flexibilní úkoly**.

### 5.3 Modulární znovupoužitelnost

Rozdělte běžná pravidla do modulů, které lze podle potřeby kombinovat:

**Modul zabezpečení dat**

```
MUST: Používat pouze SELECT
NEVER: Provádět INSERT/UPDATE/DELETE
```

**Modul struktury výstupu**

```
Výstup musí obsahovat:
1) Stručný popis (2-3 věty)
2) Klíčový obsah (graf/data/kód)
3) Volitelné návrhy (pokud existují)
```

## 6. Zlatá pravidla (praktické závěry)

1.  Jedna AI pro jeden typ práce; specializace je stabilnější
2.  Příklady jsou účinnější než slogany; nejprve poskytněte pozitivní modely
3.  Použijte MUST/ALWAYS/NEVER k nastavení hranic
4.  Použijte procesně orientovaný přístup ke snížení nejistoty
5.  Začněte v malém, více testujte, méně upravujte a neustále iterujte
6.  Nepřetěžujte omezeními; vyhněte se „tvrdému kódování“ chování
7.  Zaznamenávejte problémy a změny pro vytváření verzí
8.  80/20: Nejprve vysvětlete „jak to udělat správně“, poté omezte „co nedělat špatně“

## 7. Často kladené otázky

**Q1: Jaká je ideální délka?**

*   Základní zaměstnanec: 500–800 znaků
*   Složitý zaměstnanec: 800–1500 znaků
*   Nedoporučuje se >2000 znaků (může zpomalit a být nadbytečné)
    Standard: Pokrýt všech devět prvků, ale bez zbytečností.

**Q2: Co když AI neposlouchá instrukce?**

1.  Použijte MUST/ALWAYS/NEVER k objasnění hranic
2.  Opakujte klíčové požadavky 2–3krát
3.  Použijte tagy/oddíly pro vylepšení struktury
4.  Poskytněte více pozitivních příkladů, méně abstraktních principů
5.  Zhodnoťte, zda je potřeba výkonnější model

**Q3: Jak vyvážit pozitivní a negativní vedení?**
Nejprve napište pozitivní části (role, pracovní postup, příklady), poté přidejte omezení na základě chyb a omezte pouze body, které jsou „opakovaně špatné“.

**Q4: Mělo by se to často aktualizovat?**

*   Kontext (identita/styl/klíčové schopnosti): Dlouhodobá stabilita
*   Úkol (scénář/metriky/rozsah): Upravujte podle obchodních potřeb
*   Vytvořte novou verzi pro jakékoli změny a zaznamenejte „proč byla změněna“.

## 8. Další kroky

**Praktické cvičení**

*   Vyberte si jednoduchou roli (např. asistent zákaznické podpory), napište „funkční verzi“ pomocí devíti prvků a otestujte ji s 5 typickými úkoly
*   Najděte stávajícího zaměstnance, shromážděte 3–5 skutečných problémů a proveďte malou iteraci

**Další čtení**

*   [Průvodce konfigurací AI zaměstnance pro administrátory](./admin-configuration.md): Jak prompty převést do skutečné konfigurace
*   Speciální manuály pro každého AI zaměstnance: Prohlédněte si kompletní šablony rolí/úkolů

## Závěr

**Nejprve to rozběhněte, pak to vylepšete.**
Začněte s „funkční“ verzí a v reálných úkolech neustále shromažďujte problémy, doplňujte příklady a pravidla.
Pamatujte: **Nejprve mu řekněte, jak dělat věci správně (pozitivní vedení), a poté ho omezte v tom, aby dělal věci špatně (mírné omezení).**