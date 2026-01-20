---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Aangepaste Actie-gebeurtenis

## Introductie

NocoBase bevat ingebouwde standaard data-acties (toevoegen, verwijderen, bijwerken, bekijken, enz.). Wanneer deze acties niet volstaan voor complexe bedrijfsprocessen, kunt u aangepaste actie-gebeurtenissen gebruiken in een workflow. Door zo'n gebeurtenis te koppelen aan een "Workflow activeren"-knop in een pagina-blok, wordt een aangepaste actie-workflow geactiveerd wanneer een gebruiker erop klikt.

## Een workflow aanmaken

Wanneer u een workflow aanmaakt, kiest u "Aangepaste Actie-gebeurtenis":

![Workflow "Aangepaste Actie-gebeurtenis" aanmaken](https://static-docs.nocobase.com/20240509091820.png)

## Triggerconfiguratie

### Contexttype

> v.1.6.0+

Het contexttype bepaalt aan welke knoppen in blokken de workflow kan worden gekoppeld:

*   Geen context: Dit is een globale gebeurtenis die kan worden gekoppeld aan actieknoppen in de actiebalk en datablokken.
*   Enkele record: Kan worden gekoppeld aan actieknoppen in datablokken zoals tabelrijen, formulieren en detailweergaven.
*   Meerdere records: Kan worden gekoppeld aan knoppen voor bulkacties in een tabel.

![Triggerconfiguratie_Contexttype](https://static-docs.nocobase.com/20250215135808.png)

### Collectie

Wanneer het contexttype "Enkele record" of "Meerdere records" is, moet u de collectie selecteren waaraan het datamodel moet worden gekoppeld:

![Triggerconfiguratie_Collectie selecteren](https://static-docs.nocobase.com/20250215135919.png)

### Te gebruiken gerelateerde data

Als u de gerelateerde data van de triggerende datarij in de workflow wilt gebruiken, kunt u hier diepere gerelateerde velden selecteren:

![Triggerconfiguratie_Te gebruiken gerelateerde data selecteren](https://static-docs.nocobase.com/20250215135955.png)

Deze velden worden automatisch vooraf geladen in de workflowcontext nadat de gebeurtenis is geactiveerd, zodat ze in de workflow kunnen worden gebruikt.

## Actieconfiguratie

De configuratie van actieknoppen in verschillende blokken verschilt afhankelijk van het contexttype dat in de workflow is ingesteld.

### Geen context

> v.1.6.0+

In de actiebalk en andere datablokken kunt u een "Workflow activeren"-knop toevoegen:

![Blok actieknop toevoegen_Actiebalk](https://static-docs.nocobase.com/20250215221738.png)

![Blok actieknop toevoegen_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Blok actieknop toevoegen_Gantt-diagram](https://static-docs.nocobase.com/20250215221810.png)

Nadat u de knop heeft toegevoegd, koppelt u de eerder aangemaakte workflow zonder context. Hier is een voorbeeld met een knop in de actiebalk:

![Workflow aan knop koppelen_Actiebalk](https://static-docs.nocobase.com/20250215222120.png)

![Workflow selecteren om te koppelen_Geen context](https://static-docs.nocobase.com/20250215222234.png)

### Enkele record

In elk datablok kan een "Workflow activeren"-knop worden toegevoegd aan de actiebalk voor een enkele record, zoals in formulieren, tabelrijen, detailweergaven, enz.:

![Blok actieknop toevoegen_Formulier](https://static-docs.nocobase.com/20240509165428.png)

![Blok actieknop toevoegen_Tabelrij](https://static-docs.nocobase.com/20240509165340.png)

![Blok actieknop toevoegen_Details](https://static-docs.nocobase.com/20240509165545.png)

Nadat u de knop heeft toegevoegd, koppelt u de eerder aangemaakte workflow:

![Workflow aan knop koppelen](https://static-docs.nocobase.com/20240509165631.png)

![Workflow selecteren om te koppelen](https://static-docs.nocobase.com/20240509165658.png)

Daarna activeert u de aangepaste actie-gebeurtenis door op deze knop te klikken:

![Resultaat van het klikken op de knop](https://static-docs.nocobase.com/20240509170453.png)

### Meerdere records

> v.1.6.0+

In de actiebalk van een tabelblok is er bij het toevoegen van een "Workflow activeren"-knop een extra optie om het contexttype te selecteren: "Geen context" of "Meerdere records":

![Blok actieknop toevoegen_Tabel](https://static-docs.nocobase.com/20250215222507.png)

Wanneer "Geen context" is geselecteerd, is dit een globale gebeurtenis en kan deze alleen worden gekoppeld aan workflows van het type "Geen context".

Wanneer "Meerdere records" is geselecteerd, kunt u een workflow van het type "Meerdere records" koppelen, die kan worden gebruikt voor bulkacties na het selecteren van meerdere records (momenteel alleen ondersteund door tabellen). De beschikbare workflows zijn dan beperkt tot de workflows die zijn geconfigureerd om overeen te komen met de collectie van het huidige datablok:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Wanneer u op de knop klikt om de workflow te activeren, moeten er eerst enkele datarijen in de tabel zijn aangevinkt; anders wordt de workflow niet geactiveerd:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Voorbeeld

Stel, we hebben een "Monsters"-collectie. Voor monsters met de status "Verzameld" moeten we een "Ter inspectie aanbieden"-actie aanbieden. Deze actie controleert eerst de basisinformatie van het monster, genereert vervolgens een "Inspectierecord" en wijzigt tot slot de status van het monster naar "Ter inspectie aangeboden". Deze reeks processen kan niet worden voltooid met eenvoudige "toevoegen, verwijderen, bijwerken, bekijken"-knopklikken, dus kan een aangepaste actie-gebeurtenis worden gebruikt om dit te realiseren.

Maak eerst een "Monsters"-collectie en een "Inspectierecords"-collectie aan, en voer enkele basis testdata in de "Monsters"-collectie in:

![Voorbeeld_Monsters collectie](https://static-docs.nocobase.com/20240509172234.png)

Maak vervolgens een "Aangepaste Actie-gebeurtenis" workflow aan. Als u snelle feedback van het proces nodig heeft, kunt u de synchrone modus kiezen (in synchrone modus kunt u geen asynchrone knooppunten zoals handmatige verwerking gebruiken):

![Voorbeeld_Workflow aanmaken](https://static-docs.nocobase.com/20240509173106.png)

In de triggerconfiguratie selecteert u "Monsters" voor de collectie:

![Voorbeeld_Triggerconfiguratie](https://static-docs.nocobase.com/20240509173148.png)

Stel de logica in het proces samen volgens de bedrijfsvereisten. Sta bijvoorbeeld alleen indiening voor inspectie toe wanneer de indicatorparameter groter is dan `90`; toon anders een relevante melding:

![Voorbeeld_Bedrijfslogica samenstellen](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tip}
Het "[Antwoordbericht](../nodes/response-message.md)" knooppunt kan worden gebruikt in synchrone aangepaste actie-gebeurtenissen om een melding aan de client te retourneren. Het kan niet worden gebruikt in asynchrone modus.
:::

Nadat u de workflow heeft geconfigureerd en geactiveerd, keert u terug naar de tabelinterface en voegt u een "Workflow activeren"-knop toe in de actiekolom van de tabel:

![Voorbeeld_Actieknop toevoegen](https://static-docs.nocobase.com/20240509174525.png)

Kies vervolgens in het configuratiemenu van de knop om een workflow te koppelen en open het configuratievenster:

![Voorbeeld_Koppel workflow pop-up openen](https://static-docs.nocobase.com/20240509174633.png)

Voeg de eerder geactiveerde workflow toe:

![Voorbeeld_Workflow selecteren](https://static-docs.nocobase.com/20240509174723.png)

Na het indienen wijzigt u de knoptekst naar de naam van de actie, bijvoorbeeld "Ter inspectie aanbieden". De configuratie is nu voltooid.

Om het te gebruiken, selecteert u een willekeurige monsterdata in de tabel en klikt u op de knop "Ter inspectie aanbieden" om de aangepaste actie-gebeurtenis te activeren. Zoals eerder in de logica is ingesteld, wordt de volgende melding weergegeven als de indicatorparameter van het monster kleiner is dan 90:

![Voorbeeld_Indicator voldoet niet aan indieningscriteria](https://static-docs.nocobase.com/20240509175026.png)

Als de indicatorparameter groter is dan 90, wordt het proces normaal uitgevoerd, wordt een "Inspectierecord" gegenereerd en wordt de status van het monster gewijzigd naar "Ter inspectie aangeboden":

![Voorbeeld_Indiening succesvol](https://static-docs.nocobase.com/20240509175247.png)

Hiermee is een eenvoudige aangepaste actie-gebeurtenis voltooid. Op vergelijkbare wijze kunnen complexe bedrijfsprocessen, zoals orderverwerking of het indienen van rapporten, worden geïmplementeerd met behulp van aangepaste actie-gebeurtenissen.

## Externe aanroep

Het activeren van aangepaste actie-gebeurtenissen is niet beperkt tot gebruikersinterface-acties; het kan ook worden geactiveerd via HTTP API-aanroepen. Specifiek bieden aangepaste actie-gebeurtenissen een nieuw actietype voor alle collectie-acties om workflows te activeren: `trigger`, dat kan worden aangeroepen met de standaard actie-API van NocoBase.

Een workflow die, zoals in het voorbeeld, door een knop wordt geactiveerd, kan als volgt worden aangeroepen:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Aangezien deze actie betrekking heeft op een enkele record, moet u bij het aanroepen van bestaande data de ID van de datarij opgeven en het `<:id>`-gedeelte in de URL vervangen.

Als het wordt aangeroepen voor een formulier (bijvoorbeeld voor het aanmaken of bijwerken), kunt u de ID weglaten voor een formulier dat nieuwe data aanmaakt, maar u moet wel de ingediende data doorgeven als de uitvoeringscontext:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Voor een updateformulier moet u zowel de ID van de datarij als de bijgewerkte data doorgeven:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Als zowel een ID als data worden doorgegeven, wordt eerst de datarij geladen die overeenkomt met de ID, en vervolgens worden de eigenschappen uit het doorgegeven data-object gebruikt om de oorspronkelijke datarij te overschrijven, om zo de uiteindelijke triggerdata-context te verkrijgen.

:::warning{title="Let op"}
Als gerelateerde data wordt doorgegeven, zal deze ook worden overschreven. Wees extra voorzichtig bij het verwerken van inkomende data als het vooraf laden van gerelateerde data-items is geconfigureerd, om onverwachte overschrijvingen van gerelateerde data te voorkomen.
:::

Bovendien is de URL-parameter `triggerWorkflows` de sleutel van de workflow; meerdere workflows worden gescheiden door komma's. Deze sleutel kunt u verkrijgen door met de muis over de workflownaam bovenaan het workflowcanvas te bewegen:

![Workflow_Sleutel_Weergavemethode](https://static-docs.nocobase.com/20240426135108.png)

Na een succesvolle aanroep wordt de aangepaste actie-gebeurtenis voor de corresponderende `samples`-collectie geactiveerd.

:::info{title="Tip"}
Aangezien externe aanroepen ook gebaseerd moeten zijn op de gebruikersidentiteit, moet u bij het aanroepen via HTTP API, net als bij verzoeken die vanuit de reguliere interface worden verzonden, authenticatie-informatie verstrekken. Dit omvat de `Authorization`-requestheader of `token`-parameter (de token verkregen bij het inloggen), en de `X-Role`-requestheader (de huidige rolnaam van de gebruiker).
:::

Als u een gebeurtenis wilt activeren voor een één-op-één gerelateerde data (één-op-veel wordt momenteel niet ondersteund) binnen deze actie, kunt u `!` in de parameter gebruiken om de triggerdata van het gerelateerde veld te specificeren:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Na een succesvolle aanroep wordt de aangepaste actie-gebeurtenis voor de corresponderende `categories`-collectie geactiveerd.

:::info{title="Tip"}
Wanneer u een actie-gebeurtenis activeert via een HTTP API-aanroep, moet u ook letten op de geactiveerde status van de workflow en of de collectieconfiguratie overeenkomt; anders kan de aanroep mislukken of een fout veroorzaken.
:::