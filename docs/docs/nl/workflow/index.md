---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Overzicht

## Introductie

De Workflow plugin helpt u bij het orkestreren van geautomatiseerde bedrijfsprocessen in NocoBase, zoals dagelijkse goedkeuringen, gegevenssynchronisatie, herinneringen en andere taken. Binnen een workflow kunt u complexe bedrijfslogica implementeren door eenvoudigweg triggers en gerelateerde knooppunten te configureren via een visuele interface, zonder dat u code hoeft te schrijven.

### Voorbeeld

Elke workflow is opgebouwd uit een trigger en verschillende knooppunten. De trigger vertegenwoordigt een gebeurtenis in het systeem en elk knooppunt vertegenwoordigt een uitvoeringsstap. Samen beschrijven ze de bedrijfslogica die moet worden verwerkt nadat de gebeurtenis heeft plaatsgevonden. De onderstaande afbeelding toont een typisch proces voor voorraadaftrek nadat een productbestelling is geplaatst:

![Workflow voorbeeld](https://static-docs.nocobase.com/20251029222146.png)

Wanneer een gebruiker een bestelling indient, controleert de workflow automatisch de voorraad. Als de voorraad voldoende is, wordt de voorraad afgeschreven en wordt de bestelling verder verwerkt; anders eindigt het proces.

### Gebruiksscenario's

Vanuit een breder perspectief kunnen workflows in NocoBase-applicaties problemen oplossen in diverse scenario's:

- Automatiseer repetitieve taken: Orderbeoordelingen, voorraadsynchronisatie, gegevensopschoning, scoreberekeningen, enz., vereisen geen handmatige bediening meer.
- Ondersteun mens-machine samenwerking: Plan goedkeuringen of controles in op belangrijke knooppunten en ga verder met de volgende stappen op basis van de resultaten.
- Verbind met externe systemen: Verstuur HTTP-verzoeken, ontvang pushes van externe services en realiseer cross-systeem automatisering.
- Snel aanpassen aan bedrijfswijzigingen: Pas de processtructuur, voorwaarden of andere knooppuntconfiguraties aan en ga live zonder een nieuwe release.

## Installatie

Workflow is een ingebouwde plugin van NocoBase. Er is geen aanvullende installatie of configuratie vereist.

## Meer informatie

- [Aan de slag](./getting-started)
- [Triggers](./triggers/index)
- [Knooppunten](./nodes/index)
- [Variabelen gebruiken](./advanced/variables)
- [Uitvoeringen](./advanced/executions)
- [Versiebeheer](./advanced/revisions)
- [Geavanceerde configuratie](./advanced/options)
- [Extensieontwikkeling](./development/index)