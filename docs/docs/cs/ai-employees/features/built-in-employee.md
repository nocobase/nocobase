:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/features/built-in-employee).
:::

# Vestavění AI zaměstnanci

NocoBase obsahuje několik přednastavených AI zaměstnanců pro specifické scénáře.

Stačí nakonfigurovat službu LLM a povolit odpovídajícího zaměstnance; modely lze v rámci konverzace měnit podle potřeby.


## Představení

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Jméno zaměstnance | Role | Klíčové schopnosti |
| :--- | :--- | :--- |
| **Cole** | NocoBase asistent | Otázky a odpovědi k produktu, vyhledávání v dokumentaci |
| **Ellis** | Expert na e-maily | Psaní e-mailů, generování shrnutí, návrhy odpovědí |
| **Dex** | Expert na organizaci dat | Překlad polí, formátování, extrakce informací |
| **Viz** | Analytik vhledů | Datové vhledy, analýza trendů, interpretace klíčových metrik |
| **Lexi** | Asistent překladu | Vícejazyčný překlad, podpora komunikace |
| **Vera** | Výzkumný analytik | Vyhledávání na webu, agregace informací, hloubkový průzkum |
| **Dara** | Expert na vizualizaci dat | Konfigurace grafů, generování vizuálních reportů |
| **Orin** | Expert na datové modelování | Pomoc s návrhem struktury kolekcí, návrhy polí |
| **Nathan** | Frontend vývojář | Pomoc s psaním úryvků frontendového kódu, úpravy stylů |


Spolupráci můžete zahájit kliknutím na **AI plovoucí tlačítko** v pravém dolním rohu rozhraní aplikace a výběrem požadovaného zaměstnance.


## AI zaměstnanci pro specifické scénáře

Někteří vestavění AI zaměstnanci (stavební typy) se v seznamu vpravo dole nezobrazují; mají svá vyhrazená pracovní prostředí, například:

* **Orin** se zobrazuje pouze na stránce konfigurace zdroje dat;
* **Dara** se zobrazuje pouze na stránce konfigurace grafů;
* **Nathan** se zobrazuje pouze v JS editoru.



---

Níže uvádíme několik typických scénářů použití AI zaměstnanců pro vaši inspiraci. Další potenciál můžete prozkoumat při vlastním používání v reálném provozu.


## Viz: Analytik vhledů

### Představení

> Generujte grafy a vhledy jedním kliknutím, nechte data mluvit za sebe.

**Viz** je vestavěný **AI analytik vhledů**.
Dokáže číst data na vaší aktuální stránce (např. Leads, Opportunities, Accounts) a automaticky generovat grafy trendů, srovnávací grafy, KPI karty a stručné závěry, čímž činí obchodní analýzu snadnou a intuitivní.

> Chcete vědět, „proč v poslední době klesly prodeje“?
> Stačí to říct Vizovi a on vám sdělí, v jaké části došlo k poklesu, jaké jsou možné příčiny a jaké by mohly být další kroky.

### Scénáře použití

Ať už jde o měsíční přehledy hospodaření, ROI kanálů nebo prodejní trychtýře, můžete nechat Vize analyzovat data, generovat grafy a interpretovat výsledky.

| Scénář | Co chcete vědět | Výstup od Vize |
| -------- | ------------ | ------------------- |
| **Měsíční přehled** | V čem je tento měsíc lepší než minulý? | KPI karta + graf trendu + tři návrhy na zlepšení |
| **Rozbor růstu** | Je růst tržeb dán objemem nebo cenou? | Graf rozkladu faktorů + srovnávací tabulka |
| **Analýza kanálů** | Do kterého kanálu se vyplatí dále investovat? | ROI graf + křivka retence + doporučení |
| **Analýza trychtýře** | Kde se návštěvnost zastavuje? | Graf trychtýře + vysvětlení úzkých hrdel |
| **Retence zákazníků** | Kteří zákazníci jsou nejhodnotnější? | RFM segmentační graf + křivka retence |
| **Vyhodnocení akcí** | Jak efektivní byla velká slevová akce? | Srovnávací graf + analýza cenové elasticity |

### Způsob použití

**Vstupní body na stránce**

* **Tlačítko vpravo nahoře (doporučeno)**
  
  Na stránkách jako Leads, Opportunities nebo Accounts klikněte na **ikonu Viz** v pravém horním rohu a vyberte si z přednastavených úkolů, jako jsou:

  * Konverze fází a trendy
  * Srovnání zdrojových kanálů
  * Měsíční analytický přehled

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Globální panel vpravo dole**
  
  Na jakékoli stránce můžete vyvolat globální AI panel a mluvit přímo s Vizem:

  ```
  Analyzuj změny prodejů za posledních 90 dní
  ```

  Viz automaticky převezme datový kontext stránky, na které se nacházíte.

**Způsob interakce**

Viz podporuje dotazy v přirozeném jazyce a rozumí i doplňujícím otázkám.
Příklad:

```
Ahoj Vizi, vygeneruj trendy leadů pro tento měsíc.
```

```
Ukaž jen výkon z kanálů třetích stran.
```

```
Který region roste nejrychleji?
```

Každá doplňující otázka bude pokračovat hlouběji na základě předchozích výsledků analýzy, aniž byste museli znovu zadávat datové podmínky.

### Tipy pro chatování s Vizem

| Přístup | Efekt |
| ---------- | ------------------- |
| Uveďte časový rozsah | „Posledních 30 dní“ nebo „minulý měsíc vs. tento měsíc“ je přesnější |
| Specifikujte dimenze | „Zobrazit podle regionu/kanálu/produktu“ pomáhá sjednotit pohled |
| Zaměřte se na trendy, ne na detaily | Viz vyniká v identifikaci směru změn a klíčových příčin |
| Používejte přirozený jazyk | Nejsou potřeba příkazové syntaxe, stačí se ptát jako při běžném rozhovoru |


---



## Dex: Expert na organizaci dat

### Představení

> Rychle extrahujte a vyplňujte formuláře, přeměňte neuspořádané informace na strukturovaná data.

`Dex` je expert na organizaci dat, který extrahuje požadované informace z nestrukturovaných dat nebo souborů, uspořádá je do strukturované podoby a může pomocí nástrojů tyto informace vyplnit do formulářů.

### Způsob použití

Na stránce s formulářem vyvolejte `Dexe` a otevřete okno konverzace.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

V zadávacím poli klikněte na `Add work context` a vyberte `Pick block`. Stránka přejde do režimu výběru bloku.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Vyberte blok formuláře na stránce.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Do dialogového okna zadejte data, která má `Dex` zpracovat.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Po odeslání `Dex` data strukturuje a pomocí svých schopností je aktualizuje ve vybraném formuláři.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Datový modelář

### Představení

> Inteligentně navrhujte kolekce a optimalizujte struktury databází.

`Orin` je expert na datové modelování. Na stránce konfigurace hlavního zdroje dat vám `Orin` může pomoci vytvořit nebo upravit kolekce.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Způsob použití

Vstupte do pluginu Správce zdrojů dat a vyberte konfiguraci hlavního zdroje dat.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Kliknutím na ikonu `Orin` v pravém horním rohu otevřete dialogové okno AI zaměstnance.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Popište `Orinovi` své požadavky na modelování, odešlete je a počkejte na odpověď. 

Jakmile `Orin` potvrdí vaše požadavky, použije své schopnosti a odpoví vám náhledem datového modelu.

Po kontrole náhledu klikněte na tlačítko `Finish review and apply`, čímž vytvoříte kolekce podle `Orinova` návrhu.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Frontend vývojář

### Představení

> Pomůže vám psát a optimalizovat frontendový kód pro realizaci složité interakční logiky.

`Nathan` je expert na frontendový vývoj v NocoBase. V situacích, kde je vyžadován JavaScript, jako jsou `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` nebo `Linkage`, se v pravém horním rohu editoru kódu zobrazí ikona `Nathan`. Můžete ho požádat o pomoc s psaním nebo úpravou kódu v editoru.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Způsob použití

V editoru kódu klikněte na `Nathan` pro otevření dialogového okna AI zaměstnance. Kód z editoru se automaticky přiloží k zadávacímu poli jako kontext aplikace pro `Nathana`.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Zadejte své požadavky na kódování, odešlete je `Nathanovi` a počkejte na jeho odpověď.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Kliknutím na tlačítko `Apply to editor` u bloku kódu, který `Nathan` poslal, přepíšete kód v editoru jeho návrhem.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Kliknutím na tlačítko `Run` v editoru kódu můžete okamžitě vidět výsledek.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Historie kódu

Kliknutím na ikonu „příkazového řádku“ v pravém horním rohu dialogového okna `Nathan` můžete zobrazit úryvky kódu, které jste odeslali, a úryvky kódu, kterými `Nathan` v aktuální relaci odpověděl.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)