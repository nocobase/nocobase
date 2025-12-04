:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Workflow koppelen

## Introductie

Op sommige actieknoppen kunt u een workflow koppelen. Dit zorgt ervoor dat de betreffende actie wordt gekoppeld aan een workflow, wat resulteert in geautomatiseerde gegevensverwerking.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Ondersteunde acties en workflowtypen

De momenteel ondersteunde actieknoppen en workflowtypen zijn als volgt:

| Actieknop \ Workflowtype | Voor actie-gebeurtenis | Na actie-gebeurtenis | Goedkeurings-gebeurtenis | Aangepaste actie-gebeurtenis |
| --- | --- | --- | --- | --- |
| "Verzenden", "Opslaan" knoppen van formulieren | ✅ | ✅ | ✅ | ❌ |
| "Gegevens bijwerken" knop in gegevensrijen (Tabel, Lijst, etc.) | ✅ | ✅ | ✅ | ❌ |
| "Verwijderen" knop in gegevensrijen (Tabel, Lijst, etc.) | ✅ | ❌ | ❌ | ❌ |
| "Workflow activeren" knop | ❌ | ❌ | ❌ | ✅ |

## Meerdere workflows koppelen

Een actieknop kan aan meerdere workflows worden gekoppeld. Wanneer u meerdere workflows koppelt, volgt de uitvoeringsvolgorde van de workflows de volgende regels:

1. Voor workflows van hetzelfde triggertype worden synchrone workflows eerst uitgevoerd, gevolgd door asynchrone workflows.
2. Workflows van hetzelfde triggertype worden uitgevoerd in de geconfigureerde volgorde.
3. Tussen workflows van verschillende triggertypen geldt:
    1. Gebeurtenissen vóór de actie worden altijd uitgevoerd vóór gebeurtenissen na de actie en goedkeuringsgebeurtenissen.
    2. Gebeurtenissen na de actie en goedkeuringsgebeurtenissen hebben geen specifieke volgorde, en de bedrijfslogica mag niet afhankelijk zijn van de configuratievolgorde.

## Meer informatie

Voor de verschillende workflow-gebeurtenistypen verwijzen wij u naar de gedetailleerde documentatie van de relevante plugins:

* [Na actie-gebeurtenis]
* [Voor actie-gebeurtenis]
* [Goedkeurings-gebeurtenis]
* [Aangepaste actie-gebeurtenis]