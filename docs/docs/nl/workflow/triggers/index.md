:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

Een trigger is het startpunt voor een workflow. Wanneer er tijdens het uitvoeren van de applicatie een gebeurtenis plaatsvindt die voldoet aan de voorwaarden van de trigger, wordt de workflow geactiveerd en uitgevoerd. Het type trigger is tevens het type workflow; u kiest dit bij het aanmaken van de workflow en kunt het daarna niet meer wijzigen. De momenteel ondersteunde triggertypes zijn:

- [Collectiegebeurtenissen](./collection) (Ingebouwd)
- [Geplande taak](./schedule) (Ingebouwd)
- [Voor actie](./pre-action) (Aangeboden door de `@nocobase/plugin-workflow-request-interceptor` plugin)
- [Na actie](./post-action) (Aangeboden door de `@nocobase/plugin-workflow-action-trigger` plugin)
- [Aangepaste actie](./custom-action) (Aangeboden door de `@nocobase/plugin-workflow-custom-action-trigger` plugin)
- [Goedkeuring](./approval) (Aangeboden door de `@nocobase/plugin-workflow-approval` plugin)
- [Webhook](./webhook) (Aangeboden door de `@nocobase/plugin-workflow-webhook` plugin)

De timing waarop elke gebeurtenis wordt geactiveerd, ziet u in de onderstaande afbeelding:

![Workflow Gebeurtenissen](https://static-docs.nocobase.com/20251029221709.png)

Een geconfigureerde workflow kan bijvoorbeeld worden geactiveerd wanneer een gebruiker een formulier indient, wanneer gegevens in een collectie wijzigen door een gebruikersactie of een programma-aanroep, of wanneer een geplande taak de uitvoeringstijd bereikt.

Triggers die gerelateerd zijn aan gegevens (zoals acties, collectiegebeurtenissen) bevatten meestal contextgegevens van de trigger. Deze gegevens fungeren als variabelen en kunnen door knooppunten in de workflow worden gebruikt als verwerkingsparameters om geautomatiseerde gegevensverwerking te realiseren. Als een gebruiker bijvoorbeeld een formulier indient en de indieningsknop is gekoppeld aan een workflow, wordt die workflow geactiveerd en uitgevoerd. De ingediende gegevens worden dan in de contextomgeving van het uitvoeringsplan geïnjecteerd, zodat volgende knooppunten deze als variabelen kunnen gebruiken.

Nadat u een workflow heeft aangemaakt, wordt de trigger op de workflowoverzichtspagina weergegeven als een startknooppunt aan het begin van het proces. Door op deze kaart te klikken, opent u het configuratiescherm. Afhankelijk van het triggertype kunt u de bijbehorende voorwaarden configureren.

![Trigger_Startknooppunt](https://static-docs.nocobase.com/20251029222231.png)