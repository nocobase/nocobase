:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# AI Agent · Prompt Engineering Gids

> Van 'hoe te schrijven' naar 'goed schrijven': deze gids leert u hoe u op een eenvoudige, stabiele en herbruikbare manier prompts van hoge kwaliteit kunt opstellen.

## 1. Waarom prompts cruciaal zijn

Een prompt is de 'functiebeschrijving' voor een AI-agent en bepaalt direct de stijl, grenzen en uitvoerkwaliteit.

**Vergelijkend voorbeeld:**

❌ Onduidelijke prompt:

```
U bent een data-analyseassistent die gebruikers helpt gegevens te analyseren.
```

✅ Duidelijke en controleerbare prompt:

```
U bent Viz, een data-analyse-expert.

Roldefinitie
- Stijl: Inzichtelijk, duidelijk in expressie, gericht op visualisatie
- Missie: Complexe gegevens omzetten in begrijpelijke "grafiekverhalen"

Workflow
1) Behoeften begrijpen
2) Veilige SQL genereren (alleen SELECT gebruiken)
3) Inzichten extraheren
4) Presenteren met grafieken

Strikte regels
- MUST: Alleen SELECT gebruiken, nooit gegevens wijzigen
- ALWAYS: Standaard grafische visualisaties produceren
- NEVER: Gegevens verzinnen of raden

Uitvoerformaat
Korte conclusie (2-3 zinnen) + ECharts grafiek JSON
```

**Conclusie**: Een goede prompt maakt duidelijk 'wie het is, wat te doen, hoe te doen en aan welke standaard te voldoen', waardoor de prestaties van de AI stabiel en controleerbaar worden.

## 2. De "Negen Elementen" Gouden Formule voor Prompts

Een in de praktijk bewezen effectieve structuur:

```
Naamgeving + Dubbele instructies + Gesimuleerde bevestiging + Herhaling + Strikte regels
+ Achtergrondinformatie + Positieve bekrachtiging + Referentievoorbeelden + Negatieve voorbeelden (optioneel)
```

### 2.1 Beschrijving van de elementen

| Element | Wat het oplost | Waarom het effectief is |
| ---- | ----------------- | ------------ |
| Naamgeving | Verduidelijkt identiteit en stijl | Helpt de AI een 'rolgevoel' te ontwikkelen |
| Dubbele instructies | Onderscheidt 'wie ik ben' van 'wat ik moet doen' | Vermindert rolverwarring |
| Gesimuleerde bevestiging | Herhaalt begrip vóór uitvoering | Voorkomt afwijking |
| Herhaling | Belangrijke punten verschijnen herhaaldelijk | Verhoogt de prioriteit |
| Strikte regels | MUST/ALWAYS/NEVER | Creëert een basislijn |
| Achtergrondinformatie | Noodzakelijke kennis en beperkingen | Vermindert misverstanden |
| Positieve bekrachtiging | Leidt verwachtingen en stijl | Zorgt voor een stabielere toon en prestatie |
| Referentievoorbeelden | Biedt een direct model om na te bootsen | Uitvoer komt dichter bij de verwachting |
| Negatieve voorbeelden | Voorkomt veelvoorkomende valkuilen | Corrigeert fouten, wordt nauwkeuriger bij gebruik |

### 2.2 Snelstartsjabloon

```yaml
# 1) Naamgeving
U bent [Naam], een uitstekende [Rol/Specialist].

# 2) Dubbele instructies
## Rol
Stijl: [Adjectief x2-3]
Missie: [Samenvatting van de hoofdverantwoordelijkheid in één zin]

## Taakworkflow
1) Begrijpen: [Kernpunt]
2) Uitvoeren: [Kernpunt]
3) Verifiëren: [Kernpunt]
4) Presenteren: [Kernpunt]

# 3) Gesimuleerde bevestiging
Herhaal vóór uitvoering uw begrip: "Ik begrijp dat u ... nodig heeft. Ik zal dit voltooien door ..."

# 4) Herhaling
Kernvereiste: [1-2 meest kritieke punten] (verschijnt minstens twee keer in het begin/de workflow/het einde)

# 5) Strikte regels
MUST: [Onverbreekbare regel]
ALWAYS: [Principe dat altijd gevolgd moet worden]
NEVER: [Expliciet verboden actie]

# 6) Achtergrondinformatie
[Noodzakelijke domeinkennis/context/veelvoorkomende valkuilen]

# 7) Positieve bekrachtiging
U blinkt uit in [Vaardigheid] en bent bedreven in [Specialiteit]. Handhaaf deze stijl om de taak te voltooien.

# 8) Referentievoorbeelden
[Geef een beknopt voorbeeld van de 'ideale uitvoer']

# 9) Negatieve voorbeelden (optioneel)
- [Onjuiste methode] → [Juiste methode]
```

## 3. Praktisch voorbeeld: Viz (Data-analyse)

Laten we de negen elementen combineren om een compleet, 'direct bruikbaar' voorbeeld te creëren.

```text
# Naamgeving
U bent Viz, een data-analyse-expert.

# Dubbele instructies
【Rol】
Stijl: Inzichtelijk, duidelijk, visueel georiënteerd
Missie: Complexe gegevens omzetten in "grafiekverhalen"

【Taakworkflow】
1) Begrijpen: Analyseer de gegevensbehoeften en het bereik van de metrics van de gebruiker
2) Query: Genereer veilige SQL (alleen echte gegevens opvragen, SELECT-only)
3) Analyseren: Extraheer belangrijke inzichten (trends/vergelijkingen/verhoudingen)
4) Presenteren: Kies een geschikte grafiek voor een duidelijke weergave

# Gesimuleerde bevestiging
Herhaal vóór uitvoering: "Ik begrijp dat u [object/bereik] wilt analyseren, en ik zal de resultaten presenteren via [query- en visualisatiemethode]."

# Herhaling
Nogmaals benadrukken: Gegevensauthenticiteit heeft prioriteit, kwaliteit boven kwantiteit; als er geen gegevens beschikbaar zijn, vermeld dit dan eerlijk.

# Strikte regels
MUST: Alleen SELECT-query's gebruiken, geen gegevens wijzigen
ALWAYS: Standaard visuele grafieken produceren
NEVER: Gegevens verzinnen of raden

# Achtergrondinformatie
- ECharts vereist een "pure JSON"-configuratie, zonder opmerkingen/functies
- Elke grafiek moet zich richten op één thema, vermijd het opstapelen van meerdere metrics

# Positieve bekrachtiging
U bent bedreven in het extraheren van bruikbare conclusies uit echte gegevens en deze uit te drukken met de eenvoudigste grafieken.

# Referentievoorbeelden
Beschrijving (2-3 zinnen) + Grafiek JSON

Voorbeeld beschrijving:
Deze maand zijn er 127 nieuwe leads toegevoegd, een stijging van 23% ten opzichte van de vorige maand, voornamelijk afkomstig van externe kanalen.

Voorbeeld grafiek:
{
  "title": {"text": "Deze Maand's Lead Trend"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Negatieve voorbeelden (optioneel)
- Talen mixen → Taalconsistentie bewaren
- Overladen grafieken → Elke grafiek moet slechts één thema uitdrukken
- Onvolledige gegevens → Eerlijk vermelden "Geen gegevens beschikbaar"
```

**Ontwerppunten**

* "Authenticiteit" verschijnt meerdere keren in de workflow, herhaling en regels (sterke herinnering)
* Kies een tweedelige "beschrijving + JSON"-uitvoer voor eenvoudige frontend-integratie
* Specificeer "alleen-lezen SQL" om risico's te verminderen

## 4. Hoe u prompts in de loop van de tijd kunt verbeteren

### 4.1 Vijfstaps-iteratie

```
Begin met een werkende versie → Test op kleine schaal → Noteer problemen → Voeg regels/voorbeelden toe om problemen aan te pakken → Test opnieuw
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Optimalisatieproces" width="50%">

Het wordt aanbevolen om 5-10 typische taken tegelijk te testen en één ronde binnen 30 minuten te voltooien.

### 4.2 Principes en verhoudingen

* **Positieve begeleiding heeft prioriteit**: Vertel de AI eerst wat het moet doen
* **Probleemgestuurde verbetering**: Voeg beperkingen toe alleen wanneer er problemen ontstaan
* **Gematigde beperkingen**: Stapel niet meteen 'verboden' op

Empirische verhouding: **80% Positief : 20% Negatief**.

### 4.3 Een typische optimalisatie

**Probleem**: Overladen grafieken, slechte leesbaarheid
**Optimalisatie**:

1. Voeg toe aan "Achtergrondinformatie": één thema per grafiek
2. Geef een "enkele-metric grafiek" in "Referentievoorbeelden"
3. Als het probleem aanhoudt, voeg dan een strikte beperking toe in "Strikte regels/Herhaling"

## 5. Geavanceerde technieken

### 5.1 Gebruik XML/tags voor een duidelijkere structuur (aanbevolen voor lange prompts)

Wanneer de inhoud meer dan 1000 tekens bevat of verwarrend kan zijn, is het gebruik van tags voor partitionering stabieler:

```xml
<Rol>U bent Dex, een data-organisatie-expert.</Rol>
<Stijl>Meticuleus, nauwkeurig en georganiseerd.</Stijl>

<Taak>
Moet in de volgende stappen worden voltooid:
1. Identificeer sleutelvelden
2. Extraheer veldwaarden
3. Standaardiseer formaat (Datum JJJJ-MM-DD)
4. Uitvoer JSON
</Taak>

<Regels>
MUST: Handhaaf de nauwkeurigheid van veldwaarden
NEVER: Raad ontbrekende informatie
ALWAYS: Markeer onzekere items
</Regels>

<Voorbeeld>
{"Naam":"John Doe","Datum":"2024-01-15","Bedrag":5000,"Status":"Bevestigd"}
</Voorbeeld>
```

### 5.2 Gelaagde "Achtergrond + Taak"-benadering (een intuïtievere manier)

* **Achtergrond** (stabiliteit op lange termijn): Wie deze agent is, zijn stijl en welke capaciteiten het heeft
* **Taak** (op aanvraag): Wat nu te doen, op welke metrics te focussen en wat het standaardbereik is

Dit komt natuurlijk overeen met het "Agent + Taak"-model van NocoBase: een vaste achtergrond met flexibele taken.

### 5.3 Modulair hergebruik

Breek veelvoorkomende regels op in modules om naar behoefte te combineren:

**Gegevensbeveiligingsmodule**

```
MUST: Alleen SELECT gebruiken
NEVER: Voer INSERT/UPDATE/DELETE uit
```

**Uitvoerstructuurmodule**

```
Uitvoer moet bevatten:
1) Korte beschrijving (2-3 zinnen)
2) Kerninhoud (grafiek/gegevens/code)
3) Optionele suggesties (indien aanwezig)
```

## 6. Gouden regels (praktische conclusies)

1. Eén AI voor één type taak; specialisatie is stabieler
2. Voorbeelden zijn effectiever dan slogans; geef eerst positieve modellen
3. Gebruik MUST/ALWAYS/NEVER om grenzen te stellen
4. Gebruik een procesgerichte aanpak om onzekerheid te verminderen
5. Begin klein, test meer, wijzig minder en itereer continu
6. Beperk niet te veel; vermijd 'hard-coding' van gedrag
7. Registreer problemen en wijzigingen om versies te creëren
8. 80/20: Leg eerst uit "hoe het goed te doen", en beperk vervolgens "wat niet fout te doen"

## 7. Veelgestelde vragen

**V1: Wat is de ideale lengte?**

* Basis-agent: 500–800 tekens
* Complexe agent: 800–1500 tekens
* Niet aanbevolen >2000 tekens (kan traag en redundant zijn)
  Standaard: Alle negen elementen zijn gedekt, maar zonder overbodige tekst.

**V2: Wat als de AI de instructies niet volgt?**

1. Gebruik MUST/ALWAYS/NEVER om grenzen te verduidelijken
2. Herhaal belangrijke vereisten 2–3 keer
3. Gebruik tags/partities om de structuur te verbeteren
4. Geef meer positieve voorbeelden, minder abstracte principes
5. Evalueer of een krachtiger model nodig is

**V3: Hoe brengt u positieve en negatieve begeleiding in balans?**
Schrijf eerst de positieve delen (rol, workflow, voorbeelden), voeg vervolgens beperkingen toe op basis van fouten, en beperk alleen de punten die "herhaaldelijk fout" zijn.

**V4: Moet het vaak worden bijgewerkt?**

* Achtergrond (identiteit/stijl/kerncapaciteiten): Stabiliteit op lange termijn
* Taak (scenario/metrics/bereik): Aanpassen aan bedrijfsbehoeften
* Creëer een nieuwe versie voor eventuele wijzigingen en log "waarom het is gewijzigd."

## 8. Volgende stappen

**Praktische oefening**

* Kies een eenvoudige rol (bijv. klantenservice-assistent), schrijf een "werkbare versie" met behulp van de negen elementen en test deze met 5 typische taken
* Zoek een bestaande agent, verzamel 3–5 echte problemen en voer een kleine iteratie uit

**Verder lezen**

* [AI Agent · Configuratiegids voor beheerders](./admin-configuration.md): Prompts omzetten in daadwerkelijke configuratie
* Specifieke handleidingen voor elke AI-agent: Bekijk complete rol-/taaksjablonen

## Conclusie

**Laat het eerst werken, verfijn het daarna.**
Begin met een "werkende" versie en verzamel continu problemen, voeg voorbeelden en regels toe in echte taken.
Onthoud: **Vertel het eerst hoe het dingen goed moet doen (positieve begeleiding), en beperk het vervolgens om dingen fout te doen (gematigde beperking).**