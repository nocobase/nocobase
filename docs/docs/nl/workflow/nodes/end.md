:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Workflow beëindigen

Dit knooppunt beëindigt de huidige workflow onmiddellijk bij uitvoering, met de status die u in het knooppunt hebt ingesteld. U gebruikt dit doorgaans voor procesbeheer op basis van specifieke logica. Zodra aan bepaalde logische voorwaarden is voldaan, stopt de huidige workflow en worden verdere processen niet meer uitgevoerd. U kunt het vergelijken met de `return`-instructie in programmeertalen, die wordt gebruikt om de huidige functie te verlaten.

## Knooppunt toevoegen

In het workflow-configuratiescherm klikt u op de plusknop ("+") in de flow om een "Workflow beëindigen"-knooppunt toe te voegen:

![Workflow beëindigen_Toevoegen](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Knooppuntconfiguratie

![Workflow beëindigen_Knooppuntconfiguratie](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Eindstatus

De eindstatus beïnvloedt de uiteindelijke status van de workflow-uitvoering. U kunt deze instellen op "Geslaagd" of "Mislukt". Zodra de workflow dit knooppunt bereikt, wordt deze onmiddellijk afgesloten met de ingestelde status.

:::info{title=Tip}
Wanneer u dit knooppunt gebruikt in een workflow van het type "Voor actie-gebeurtenis", zal het de aanvraag die de actie heeft geïnitieerd, onderscheppen. Raadpleeg voor meer details [Gebruik van "Voor actie-gebeurtenis"](../triggers/pre-action).

Naast het onderscheppen van de aanvraag die de actie heeft geïnitieerd, beïnvloedt de configuratie van de eindstatus ook de status van de feedback in het "antwoordbericht" voor dit type workflow.
:::