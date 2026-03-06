:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/ai-employees/features/built-in-employee) voor nauwkeurige informatie.
:::

# Ingebouwde AI-medewerkers

NocoBase is voorzien van verschillende ingebouwde AI-medewerkers die zijn afgestemd op specifieke scenario's.

U hoeft alleen de LLM-service te configureren en de bijbehorende medewerker in te schakelen om aan de slag te gaan; modellen kunnen naar wens worden gewisseld binnen het gesprek.

## Introductie

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Naam medewerker | Rolpositionering | Kernvaardigheden |
| :--- | :--- | :--- |
| **Cole** | NocoBase-assistent | Product-V&A, documentherstel |
| **Ellis** | E-mailexpert | E-mails opstellen, samenvattingen genereren, suggesties voor antwoorden |
| **Dex** | Gegevensorganisator | Veldvertaling, opmaak, informatie-extractie |
| **Viz** | Inzichtsanalist | Gegevensinzichten, trendanalyse, interpretatie van kerncijfers |
| **Lexi** | Vertaalassistent | Meertalige vertaling, communicatie-ondersteuning |
| **Vera** | Onderzoeksanalist | Zoeken op het web, informatie-aggregatie, diepgaand onderzoek |
| **Dara** | Expert in gegevensvisualisatie | Grafiekconfiguratie, genereren van visuele rapporten |
| **Orin** | Expert in gegevensmodellering | Ondersteuning bij het ontwerpen van collectiestructuren, veldsuggesties |
| **Nathan** | Frontend-engineer | Ondersteuning bij het schrijven van frontend-codefragmenten, stijlaanpassingen |

U kunt op de **AI-zwevende knop** rechtsonder in de applicatie-interface klikken en de medewerker selecteren die u nodig heeft om de samenwerking te starten.

## AI-medewerkers voor specifieke scenario's

Sommige ingebouwde AI-medewerkers (van het type bouwer) verschijnen niet in de lijst met AI-medewerkers rechtsonder; zij hebben specifieke werkplekken, bijvoorbeeld:

* **Orin** verschijnt alleen op de configuratiepagina van de gegevensbron;
* **Dara** verschijnt alleen op de grafiekconfiguratiepagina;
* **Nathan** verschijnt alleen in de JS-editor.

---

Hieronder volgen enkele typische toepassingsscenario's voor AI-medewerkers om u te inspireren. Meer potentieel wacht op uw verdere verkenning in de praktijk.

## Viz: Inzichtsanalist

### Introductie

> Genereer met één klik grafieken en inzichten, laat de gegevens voor zich spreken.

**Viz** is de ingebouwde **AI-inzichtsanalist**.
Hij weet hoe hij de gegevens op uw huidige pagina (zoals Leads, Opportunities, Accounts) moet lezen en genereert automatisch trendgrafieken, vergelijkingsgrafieken, KPI-kaarten en beknopte conclusies, waardoor bedrijfsanalyse eenvoudig en intuïtief wordt.

> Wilt u weten "Waarom de verkoop onlangs is gedaald"?
> Zeg het gewoon tegen Viz, en hij kan u vertellen waar de daling plaatsvond, wat de mogelijke redenen zijn en wat de volgende stappen zouden kunnen zijn.

### Gebruiksscenario's

Of het nu gaat om maandelijkse bedrijfsevaluaties, kanaal-ROI of verkooptrechters, u kunt Viz de resultaten laten analyseren, grafieken laten genereren en interpreteren.

| Scenario | Wat u wilt weten | Output van Viz |
| -------- | ------------ | ------------------- |
| **Maandelijkse evaluatie** | Hoe is deze maand beter dan de vorige? | KPI-kaart + Trendgrafiek + Drie verbetersuggesties |
| **Groeianalyse** | Wordt de omzetgroei gedreven door volume of prijs? | Factordecompositie-grafiek + Vergelijkingstabel |
| **Kanaalanalyse** | Welk kanaal is de verdere investering het meest waard? | ROI-grafiek + Retentiecurve + Suggesties |
| **Trechteranalyse** | Waar loopt het verkeer vast? | Trechtergrafiek + Uitleg over knelpunten |
| **Klantbehoud** | Welke klanten zijn het meest waardevol? | RFM-segmentatiegrafiek + Retentiecurve |
| **Promotie-evaluatie** | Hoe effectief was de grote promotie? | Vergelijkingsgrafiek + Prijselasticiteitsanalyse |

### Gebruik

**Toegangspunten op de pagina**

* **Knop rechtsboven (aanbevolen)**
  
  Klik op pagina's zoals Leads, Opportunities en Accounts op het **Viz-icoon** in de rechterbovenhoek om vooraf ingestelde taken te selecteren, zoals:

  * Faseconversie en trends
  * Vergelijking van bronkanalen
  * Maandelijkse evaluatie-analyse

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Globaal paneel rechtsonder**
  
  Op elke pagina kunt u het globale AI-paneel oproepen en rechtstreeks tegen Viz spreken:

  ```
  Analyseer de verkoopveranderingen van de afgelopen 90 dagen
  ```

  Viz neemt automatisch de gegevenscontext van uw huidige pagina mee.

**Interactie**

Viz ondersteunt vragen in natuurlijke taal en begrijpt vervolgvragen over meerdere ronden.
Voorbeeld:

```
Hi Viz, genereer leadtrends voor deze maand.
```

```
Toon alleen de prestaties van kanalen van derden.
```

```
Welke regio groeit het snelst?
```

Elke vervolgvraag gaat dieper in op de resultaten van de vorige analyse, zonder dat u de gegevensvoorwaarden opnieuw hoeft in te voeren.

### Tips voor het chatten met Viz

| Methode | Effect |
| ---------- | ------------------- |
| Specificeer tijdsbereik | "Afgelopen 30 dagen" of "Vorige maand vs. deze maand" is nauwkeuriger |
| Specificeer dimensies | "Bekijk per regio/kanaal/product" helpt perspectieven op één lijn te brengen |
| Focus op trends in plaats van details | Viz is goed in het identificeren van de veranderingsrichting en de belangrijkste redenen |
| Gebruik natuurlijke taal | Geen noodzaak voor dwingende syntaxis, stel gewoon vragen alsof u aan het chatten bent |

---

## Dex: Gegevensorganisator

### Introductie

> Extraheer en vul formulieren snel in, waardoor rommelige informatie wordt omgezet in gestructureerde gegevens.

`Dex` is een gegevensorganisator die benodigde informatie extraheert uit ongestructureerde gegevens of bestanden en deze organiseert in gestructureerde informatie. Hij kan ook tools aanroepen om de informatie in formulieren in te vullen.

### Gebruik

Roep `Dex` op de formulierpagina op om het gespreksvenster te openen.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Klik op **Add work context** in het invoerveld en selecteer **Pick block**; de pagina gaat over naar de blokselectiemodus.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Selecteer het formulierblok op de pagina.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Voer de gegevens die u door `Dex` wilt laten organiseren in het dialoogvenster in.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Na het verzenden zal `Dex` de gegevens structureren en zijn vaardigheden gebruiken om de gegevens in het geselecteerde formulier bij te werken.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)

---

## Orin: Gegevensmodelleur

### Introductie

> Ontwerp collecties op intelligente wijze en optimaliseer databasestructuren.

`Orin` is een expert in gegevensmodellering. Op de configuratiepagina van de hoofdgegevensbron kunt u `Orin` helpen bij het maken of wijzigen van collecties.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Gebruik

Ga naar de plugin Gegevensbronbeheer (Data Source Manager) en kies ervoor om de hoofdgegevensbron te configureren.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Klik op de avatar van `Orin` in de rechterbovenhoek om het dialoogvenster van de AI-medewerker te openen.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Beschrijf uw modelleringsvereisten aan `Orin`, verzend het bericht en wacht op een antwoord. 

Zodra `Orin` uw vereisten bevestigt, zal hij zijn vaardigheden gebruiken en antwoorden met een voorbeeld van de gegevensmodellering.

Na het bekijken van het voorbeeld klikt u op de knop **Finish review and apply** om collecties te maken volgens de modellering van `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)

---

## Nathan: Frontend-engineer

### Introductie

> Helpt u bij het schrijven en optimaliseren van frontend-code om complexe interactielogica te implementeren.

`Nathan` is de expert op het gebied van frontend-ontwikkeling in NocoBase. In scenario's waar JavaScript vereist is, zoals `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` en `Linkage`, verschijnt de avatar van Nathan in de rechterbovenhoek van de code-editor. U kunt hem vragen om te helpen bij het schrijven of wijzigen van de code in de editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Gebruik

Klik in de code-editor op `Nathan` om het dialoogvenster van de AI-medewerker te openen; de code in de editor wordt automatisch als bijlage aan het invoerveld toegevoegd en als applicatiecontext naar `Nathan` verzonden.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Voer uw codeervereisten in, stuur ze naar `Nathan` en wacht op zijn antwoord.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Klik op de knop **Apply to editor** bij het codeblok dat door `Nathan` is teruggestuurd om de code in de editor te overschrijven met zijn code.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Klik op de knop **Run** in de code-editor om de effecten in realtime te bekijken.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Codegeschiedenis

Klik op het **Opdrachtregel**-icoon in de rechterbovenhoek van het dialoogvenster van `Nathan` om de codefragmenten te bekijken die u hebt verzonden en de codefragmenten die `Nathan` in de huidige sessie heeft beantwoord.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)