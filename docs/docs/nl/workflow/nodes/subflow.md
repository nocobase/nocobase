---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Workflow aanroepen

## Introductie

Met deze functionaliteit kunt u vanuit één workflow andere workflows aanroepen. U kunt variabelen uit de huidige workflow gebruiken als invoer voor de sub-workflow, en de uitvoer van de sub-workflow vervolgens gebruiken als variabelen in de huidige workflow voor latere knooppunten.

Het proces van het aanroepen van een workflow wordt hieronder weergegeven:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Door workflows aan te roepen, kunt u gemeenschappelijke proceslogica hergebruiken, zoals het verzenden van e-mails of sms-berichten. Ook kunt u een complexe workflow opsplitsen in meerdere sub-workflows voor eenvoudiger beheer en onderhoud.

In essentie maakt een workflow geen onderscheid of een proces een sub-workflow is. Elke workflow kan als sub-workflow worden aangeroepen door andere workflows, en kan zelf ook andere workflows aanroepen. Alle workflows zijn gelijk; er bestaat alleen een relatie van aanroepen en aangeroepen worden.

Het gebruik van het aanroepen van een workflow vindt op twee plaatsen plaats:

1.  In de hoofd-workflow: Hier fungeert het als de aanroeper en roept het andere workflows aan via het knooppunt "Workflow aanroepen".
2.  In de sub-workflow: Hier fungeert het als de aangeroepene en slaat het de variabelen op die moeten worden uitgevoerd vanuit de huidige workflow via het knooppunt "Workflow uitvoer". Deze variabelen kunnen vervolgens worden gebruikt door latere knooppunten in de workflow die deze sub-workflow heeft aangeroepen.

## Knooppunt aanmaken

In de workflowconfiguratie-interface klikt u op de plusknop ('+') in de workflow om een knooppunt "Workflow aanroepen" toe te voegen:

![Knooppunt 'Workflow aanroepen' toevoegen](https://static-docs.nocobase.com/20241230001323.png)

## Knooppunt configureren

### Workflow selecteren

Selecteer de workflow die u wilt aanroepen. U kunt de zoekbalk gebruiken om snel te zoeken:

![Workflow selecteren](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tip}
*   Uitgeschakelde workflows kunnen ook als sub-workflows worden aangeroepen.
*   Wanneer de huidige workflow in synchrone modus is, kan deze alleen sub-workflows aanroepen die zich ook in synchrone modus bevinden.
:::

### Workflow-trigger variabelen configureren

Nadat u een workflow heeft geselecteerd, moet u ook de variabelen van de trigger configureren. Deze dienen als invoergegevens om de sub-workflow te activeren. U kunt direct statische gegevens selecteren of variabelen uit de huidige workflow kiezen:

![Trigger variabelen configureren](https://static-docs.nocobase.com/20241230162722.png)

Verschillende typen triggers vereisen verschillende variabelen, die u naar behoefte in het formulier kunt configureren.

## Workflow uitvoer knooppunt

Raadpleeg de inhoud van het knooppunt [Workflow uitvoer](./output.md) om de uitvoervariabelen van de sub-workflow te configureren.

## Workflow uitvoer gebruiken

Terug in de hoofd-workflow, in andere knooppunten onder het knooppunt "Workflow aanroepen", kunt u, wanneer u de uitvoerwaarde van de sub-workflow wilt gebruiken, het resultaat van het knooppunt "Workflow aanroepen" selecteren. Als de sub-workflow een eenvoudige waarde uitvoert, zoals een string, getal, booleaanse waarde of datum (een datum is een string in UTC-formaat), kunt u deze direct gebruiken. Als het een complex object is (zoals een object uit een collectie), moet het eerst worden gemapt via een JSON Parse-knooppunt voordat de eigenschappen ervan kunnen worden gebruikt; anders kan het alleen als een geheel object worden gebruikt.

Als de sub-workflow geen "Workflow uitvoer"-knooppunt heeft geconfigureerd, of geen uitvoerwaarde heeft, dan krijgt u bij het gebruik van het resultaat van het knooppunt "Workflow aanroepen" in de hoofd-workflow alleen een lege waarde (`null`).