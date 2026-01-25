---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Export Pro

## Introductie

De Export Pro plugin biedt uitgebreide functionaliteit bovenop de standaard exportfunctie.

## Installatie

Deze plugin is afhankelijk van de plugin voor Asynchroon Taakbeheer. U dient deze plugin eerst in te schakelen voordat u Export Pro kunt gebruiken.

## Functieverbeteringen

- Ondersteunt asynchrone exportbewerkingen, uitgevoerd in een aparte thread, voor het exporteren van grote hoeveelheden gegevens.
- Ondersteunt het exporteren van bijlagen.

## Gebruikershandleiding

### Exportmodus configureren

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Op de exportknop kunt u de exportmodus configureren. Er zijn drie optionele modi beschikbaar:

- **Automatisch**: De exportmodus wordt bepaald op basis van de hoeveelheid gegevens. Als het aantal records minder dan 1000 is (of 100 voor bijlage-exports), wordt synchrone export gebruikt. Als het aantal records groter is dan 1000 (of 100 voor bijlage-exports), wordt asynchrone export gebruikt.
- **Synchroon**: Maakt gebruik van synchrone export, die in de hoofdthread wordt uitgevoerd. Dit is geschikt voor kleinere datasets. Het exporteren van grote hoeveelheden gegevens in de synchrone modus kan leiden tot systeemblokkades, vertragingen en het onvermogen om andere gebruikersverzoeken te verwerken.
- **Asynchroon**: Maakt gebruik van asynchrone export, die in een aparte achtergrondthread wordt uitgevoerd en het huidige systeemgebruik niet blokkeert.

### Asynchrone export

Nadat u een export start, wordt het proces uitgevoerd in een aparte achtergrondthread, zonder dat u handmatig iets hoeft te configureren. In de gebruikersinterface wordt, na het starten van een exportbewerking, de momenteel actieve exporttaak rechtsboven weergegeven, inclusief de realtime voortgang.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Nadat de export is voltooid, kunt u het geëxporteerde bestand downloaden vanuit de exporttaken.

#### Gelijktijdige exports
Een groot aantal gelijktijdige exporttaken kan de serverconfiguratie beïnvloeden, wat leidt tot een tragere systeemrespons. Daarom wordt systeemontwikkelaars aangeraden het maximale aantal gelijktijdige exporttaken te configureren (standaard is 3). Wanneer het aantal gelijktijdige taken de geconfigureerde limiet overschrijdt, worden nieuwe taken in de wachtrij geplaatst.

![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Configuratiemethode voor gelijktijdigheid: Omgevingsvariabele `ASYNC_TASK_MAX_CONCURRENCY=aantal_gelijktijdige_taken`

Op basis van uitgebreide tests met verschillende configuraties en datacomplexiteiten, zijn de aanbevolen aantallen gelijktijdige taken:
- 2-core CPU, 3 gelijktijdige taken.
- 4-core CPU, 5 gelijktijdige taken.

#### Over prestaties
Wanneer u merkt dat het exportproces abnormaal traag verloopt (zie onderstaande referentie), kan dit duiden op een prestatieprobleem veroorzaakt door de structuur van de collectie.

| Gegevenskenmerken | Indextype | Gegevensvolume | Exportduur |
|---------|---------|--------|---------|
| Geen relatievelden | Primaire sleutel / Unieke constraint | 1 miljoen | 3-6 minuten |
| Geen relatievelden | Reguliere index | 1 miljoen | 6-10 minuten |
| Geen relatievelden | Samengestelde index (niet-uniek) | 1 miljoen | 30 minuten |
| Relatievelden<br>(Eén-op-één, Eén-op-veel,<br>Veel-op-één, Veel-op-veel) | Primaire sleutel / Unieke constraint | 500.000 | 15-30 minuten | Relatievelden verminderen prestaties |

Om efficiënte exports te garanderen, raden wij u aan:
1. De collectie moet aan de volgende voorwaarden voldoen:

| Type voorwaarde | Vereiste voorwaarde | Overige opmerkingen |
|---------|------------------------|------|
| Collectiestructuur (voldoe aan ten minste één) | Heeft een primaire sleutel<br>Heeft een unieke constraint<br>Heeft een index (uniek, regulier, samengesteld) | Prioriteit: Primaire sleutel > Unieke constraint > Index
| Veldkenmerken | De primaire sleutel / unieke constraint / index (één daarvan) moet sorteerbare kenmerken hebben, zoals: auto-increment ID, Snowflake ID, UUID v1, timestamp, nummer, etc.<br>(Let op: Niet-sorteerbare velden zoals UUID v3/v4/v5, reguliere strings, etc., beïnvloeden de prestaties) | Geen |

2. Verminder het aantal onnodige velden dat geëxporteerd moet worden, met name relatievelden (prestatieproblemen veroorzaakt door relatievelden worden nog geoptimaliseerd).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Als de export na het voldoen aan bovenstaande voorwaarden nog steeds traag is, kunt u de logs analyseren of feedback geven aan het officiële team.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Koppelingsregel](/interface-builder/actions/action-settings/linkage-rule): Dynamisch de knop tonen/verbergen;
- [Knop bewerken](/interface-builder/actions/action-settings/edit-button): De titel, het type en het pictogram van de knop bewerken;