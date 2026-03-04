---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/multi-app/multi-app/index) voor nauwkeurige informatie.
:::

# Multi-appbeheer

## Overzicht

Multi-appbeheer is de uniforme oplossing voor applicatiebeheer van NocoBase, bedoeld voor het creëren en beheren van meerdere fysiek geïsoleerde NocoBase-applicatie-instanties in één of meer runtime-omgevingen. Via de applicatie-supervisor (AppSupervisor) kunnen gebruikers meerdere applicaties creëren en onderhouden vanuit een centraal toegangspunt, om te voldoen aan de behoeften van verschillende bedrijfsonderdelen en schaalfases.

## Enkele applicatie

In de beginfase van een project starten de meeste gebruikers met een enkele applicatie.

In deze modus hoeft er slechts één NocoBase-instantie te worden geïmplementeerd, waarbij alle bedrijfsfuncties, gegevens en gebruikers in dezelfde applicatie draaien. De implementatie is eenvoudig en de configuratiekosten zijn laag, wat het ideaal maakt voor prototype-validatie, kleine projecten of interne tools.

Maar naarmate de bedrijfsactiviteiten complexer worden, krijgt een enkele applicatie te maken met natuurlijke beperkingen:

- Functies stapelen zich op, waardoor het systeem log wordt
- Het is moeilijk om verschillende bedrijfsactiviteiten van elkaar te isoleren
- De kosten voor uitbreiding en onderhoud van de applicatie blijven stijgen

Op dat moment willen gebruikers verschillende bedrijfsactiviteiten opsplitsen in meerdere applicaties om de onderhoudbaarheid en schaalbaarheid van het systeem te verbeteren.

## Multi-app met gedeeld geheugen

Wanneer gebruikers hun bedrijfsactiviteiten willen opsplitsen, maar geen complexe implementatie- en beheerarchitectuur willen introduceren, kunnen ze upgraden naar de multi-app-modus met gedeeld geheugen.

In deze modus kunnen meerdere applicaties tegelijkertijd in één NocoBase-instantie draaien. Elke applicatie is onafhankelijk, kan verbinding maken met een onafhankelijke database en kan afzonderlijk worden gemaakt, gestart en gestopt, maar ze delen hetzelfde proces en dezelfde geheugenruimte. U hoeft nog steeds slechts één NocoBase-instantie te onderhouden.

![](https://static-docs.nocobase.com/202512231055907.png)

Deze aanpak brengt duidelijke verbeteringen met zich mee:

- Bedrijfsactiviteiten kunnen worden opgesplitst per applicatiedimensie
- Functies en configuraties tussen applicaties zijn duidelijker
- Vergeleken met oplossingen met meerdere processen of containers is het verbruik van middelen lager

Omdat alle applicaties echter in hetzelfde proces draaien, delen ze middelen zoals CPU en geheugen. Een afwijking of hoge belasting in een enkele applicatie kan de stabiliteit van andere applicaties beïnvloeden.

Wanneer het aantal applicaties blijft toenemen, of wanneer er hogere eisen worden gesteld aan isolatie en stabiliteit, moet de architectuur verder worden geüpgraded.

## Hybride implementatie in meerdere omgevingen

Wanneer de omvang en complexiteit van de bedrijfsactiviteiten een bepaald niveau bereiken en het aantal applicaties op schaal moet worden uitgebreid, krijgt de multi-app-modus met gedeeld geheugen te maken met uitdagingen zoals concurrentie om middelen, stabiliteit en veiligheid. In de schaalfase kunt u overwegen om een hybride implementatie in meerdere omgevingen te gebruiken om complexere bedrijfsscenario's te ondersteunen.

De kern van deze architectuur is de introductie van een toegangsapplicatie, oftewel het implementeren van één NocoBase als centraal beheercentrum, terwijl meerdere NocoBase-instanties worden geïmplementeerd als runtime-omgevingen voor het daadwerkelijk draaien van de bedrijfsapplicaties.

De toegangsapplicatie is verantwoordelijk voor:

- Creatie, configuratie en levenscyclusbeheer van applicaties
- Het verzenden van beheeropdrachten en het verzamelen van de status

De instantie-applicatieomgeving is verantwoordelijk voor:

- Het daadwerkelijk hosten en uitvoeren van bedrijfsapplicaties via de multi-app-modus met gedeeld geheugen

Voor u kunnen meerdere applicaties nog steeds via één toegangspunt worden gemaakt en beheerd, maar intern:

- Kunnen verschillende applicaties op verschillende nodes of clusters draaien
- Kan elke applicatie onafhankelijke databases en middleware gebruiken
- Kunnen applicaties met een hoge belasting naar behoefte worden uitgebreid of geïsoleerd

![](https://static-docs.nocobase.com/202512231215186.png)

Deze aanpak is geschikt voor SaaS-platforms, grote aantallen demo-omgevingen of multi-tenant scenario's, waarbij de stabiliteit en onderhoudbaarheid van het systeem worden verbeterd terwijl de flexibiliteit behouden blijft.