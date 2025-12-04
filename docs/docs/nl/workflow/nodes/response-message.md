---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Responsbericht

## Introductie

De responsbericht-node wordt gebruikt om in specifieke typen workflows aangepaste berichten terug te sturen naar de client die de actie heeft ingediend.

:::info{title=Tip}
Momenteel wordt het ondersteund voor gebruik in workflows van het type 'Before action event' en 'Custom action event' in synchrone modus.
:::

## Een node aanmaken

In ondersteunde workflowtypen kunt u overal in de workflow een 'Responsbericht'-node toevoegen. Klik op de plusknop ('+') in de workflow om een 'Responsbericht'-node toe te voegen:

![Node toevoegen](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Het responsbericht bestaat als een array gedurende het hele aanvraagproces. Wanneer een responsbericht-node in de workflow wordt uitgevoerd, wordt de nieuwe berichtinhoud aan de array toegevoegd. Wanneer de server de respons verstuurt, worden alle berichten gezamenlijk naar de client gestuurd.

## Node-configuratie

De berichtinhoud is een sjabloonstring waarin variabelen kunnen worden ingevoegd. U kunt deze sjablooninhoud naar wens organiseren in de node-configuratie:

![Node-configuratie](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Wanneer de workflow deze node bereikt, wordt het sjabloon geparseerd om de berichtinhoud te genereren. In de bovenstaande configuratie wordt de variabele 'Lokale variabele / Alle producten doorlopen / Loop-object / Product / Titel' in de daadwerkelijke workflow vervangen door een specifieke waarde, bijvoorbeeld:

```
Product "iPhone 14 pro" is niet op voorraad
```

![Berichtinhoud](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Workflow-configuratie

De status van het responsbericht is afhankelijk van het succes of falen van de workflow-uitvoering. Het falen van een willekeurige node zal leiden tot het falen van de gehele workflow. In dit geval wordt de berichtinhoud met een foutstatus teruggestuurd naar de client en weergegeven.

Als u een foutstatus actief wilt definiëren in de workflow, kunt u een 'Eind-node' gebruiken en deze configureren naar een foutstatus. Wanneer deze node wordt uitgevoerd, zal de workflow met een foutstatus worden afgesloten en zal het bericht met een foutstatus naar de client worden teruggestuurd.

Als de gehele workflow geen foutstatus genereert en succesvol wordt uitgevoerd tot het einde, wordt de berichtinhoud met een successtatus teruggestuurd naar de client.

:::info{title=Tip}
Als er meerdere responsbericht-nodes zijn gedefinieerd in de workflow, zullen de uitgevoerde nodes de berichtinhoud aan een array toevoegen. Wanneer deze uiteindelijk naar de client wordt teruggestuurd, wordt alle berichtinhoud gezamenlijk teruggestuurd en weergegeven.
:::

## Gebruiksscenario's

### Workflow 'Before action event'

Het gebruik van een responsbericht in een 'Before action event'-workflow maakt het mogelijk om na afloop van de workflow overeenkomstige berichtfeedback naar de client te sturen. Raadpleeg [Before action event](../triggers/pre-action.md) voor meer details.

### Workflow 'Custom action event'

Het gebruik van een responsbericht in een 'Custom action event' in synchrone modus maakt het mogelijk om na afloop van de workflow overeenkomstige berichtfeedback naar de client te sturen. Raadpleeg [Custom action event](../triggers/custom-action.md) voor meer details.