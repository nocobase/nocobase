---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/workflow/triggers/approval) voor nauwkeurige informatie.
:::

# Goedkeuring

## Introductie

Goedkeuring is een procesvorm die specifiek is ontworpen om door mensen te worden gestart en verwerkt om de status van relevante gegevens te bepalen. Het wordt doorgaans gebruikt voor procesbeheer in kantoorautomatisering of andere handmatige besluitvormingszaken. U kunt hiermee handmatige processen creëren en beheren voor scenario's zoals "verlofaanvragen", "onkostendeclaraties" en "goedkeuringen voor inkoop van grondstoffen".

De goedkeuringsplugin biedt een specifiek workflowtype (trigger) "Goedkeuring (gebeurtenis)" en een specifieke "Goedkeuring"-node voor dit proces. In combinatie met de unieke aangepaste collecties en aangepaste blokken van NocoBase kunt u snel en flexibel diverse goedkeuringsscenario's creëren en beheren.

## Workflow aanmaken

Selecteer bij het aanmaken van een workflow het type "Goedkeuring" om een goedkeuringsworkflow te maken:

![Goedkeuringstrigger_Workflow aanmaken](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Klik daarna in de workflow-configuratie-interface op de trigger om een pop-up te openen voor meer configuraties.

## Trigger-configuratie

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Een collectie koppelen

De goedkeuringsplugin van NocoBase is ontworpen op basis van flexibiliteit en kan worden gebruikt met elke aangepaste collectie. Dit betekent dat u voor de goedkeuringsconfiguratie het datamodel niet opnieuw hoeft te configureren, maar direct een bestaande collectie kunt hergebruiken. Nadat u de trigger-configuratie hebt geopend, moet u eerst een collectie selecteren om te bepalen voor welke collectiegegevens het proces bedoeld is:

![Goedkeuringstrigger_Trigger-configuratie_Collectie selecteren](https://static-docs.nocobase.com/20251226103223.png)

### Triggermethode

Bij het starten van een goedkeuring voor bedrijfsgegevens kunt u kiezen uit de volgende twee triggermethoden:

*   **Voordat gegevens worden opgeslagen**

    Start de goedkeuring voordat de ingediende gegevens worden opgeslagen. Dit is geschikt voor scenario's waarin gegevens pas mogen worden opgeslagen nadat de goedkeuring is verleend. In deze modus zijn de gegevens bij het starten van de goedkeuring slechts tijdelijk; ze worden pas officieel in de bijbehorende collectie opgeslagen nadat de goedkeuring is verleend.

*   **Nadat gegevens zijn opgeslagen**

    Start de goedkeuring nadat de ingediende gegevens zijn opgeslagen. Dit is geschikt voor scenario's waarin gegevens eerst kunnen worden opgeslagen en daarna worden goedgekeurd. In deze modus zijn de gegevens al opgeslagen in de bijbehorende collectie wanneer de goedkeuring start, en wijzigingen tijdens het goedkeuringsproces worden ook opgeslagen.

### Locatie voor het starten van de goedkeuring

U kunt kiezen waar in het systeem de goedkeuring kan worden gestart:

*   **Alleen starten in gegevensblokken**

    U kunt de actie van elk formulierblok van deze tabel koppelen aan deze workflow om een goedkeuring te starten. Het goedkeuringsproces kan worden verwerkt en gevolgd in het goedkeuringsblok van een enkel record. Dit is doorgaans geschikt voor bedrijfsgegevens.

*   **Kan worden gestart in zowel gegevensblokken als het Takenoverzicht**

    Naast gegevensblokken kunt u goedkeuringen ook starten en verwerken in het globale Takenoverzicht. Dit is doorgaans geschikt voor administratieve gegevens.

### Wie kan de goedkeuring starten

U kunt machtigingen configureren op basis van gebruikersbereik om te bepalen welke gebruikers de goedkeuring kunnen starten:

*   **Alle gebruikers**

    Alle gebruikers in het systeem kunnen de goedkeuring starten.

*   **Alleen geselecteerde gebruikers**

    Alleen gebruikers binnen het opgegeven bereik mogen de goedkeuring starten. Meerdere selecties zijn mogelijk.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configuratie van de formulierinterface van de initiatiefnemer

Ten slotte moet u de formulierinterface van de initiatiefnemer configureren. Deze interface wordt gebruikt voor indieningsacties wanneer een goedkeuring wordt gestart vanuit het goedkeuringscentrum-blok en wanneer deze opnieuw wordt gestart na een intrekking door de gebruiker. Klik op de configuratieknop om de pop-up te openen:

![Goedkeuringstrigger_Trigger-configuratie_Initiatiefnemer-formulier](https://static-docs.nocobase.com/20251226130239.png)

U kunt een invulformulier toevoegen aan de interface van de initiatiefnemer op basis van de gekoppelde collectie, of beschrijvende tekst (Markdown) ter begeleiding en instructie. Het toevoegen van een formulier is verplicht; anders kan de initiatiefnemer geen acties uitvoeren zodra deze de interface betreedt.

Nadat u een formulierblok hebt toegevoegd, kunt u, net als in een reguliere formulierconfiguratie-interface, veldcomponenten van de betreffende collectie toevoegen en deze naar wens rangschikken om de inhoud van het formulier te organiseren:

![Goedkeuringstrigger_Trigger-configuratie_Initiatiefnemer-formulier_Veldconfiguratie](https://static-docs.nocobase.com/20251226130339.png)

In tegenstelling tot de directe verzendknop kunt u ook een actieknop "Concept opslaan" toevoegen om een tijdelijk opslagproces te ondersteunen:

![Goedkeuringstrigger_Trigger-configuratie_Initiatiefnemer-formulier_Actieconfiguratie_Opslaan](https://static-docs.nocobase.com/20251226130512.png)

Als een goedkeuringsworkflow de initiatiefnemer toestaat om in te trekken, moet u de knop "Intrekken" inschakelen in de interfaceconfiguratie van de initiatiefnemer:

![Goedkeuringstrigger_Trigger-configuratie_Intrekken toestaan](https://static-docs.nocobase.com/20251226130637.png)

Na inschakeling kan de goedkeuring die door deze workflow is gestart door de initiatiefnemer worden ingetrokken voordat een goedkeurder deze verwerkt. Echter, nadat een goedkeurder in een volgende goedkeuringsnode de aanvraag heeft verwerkt, kan deze niet meer worden ingetrokken.

:::info{title=Tip}
Na het inschakelen of verwijderen van de intrekknop moet u in de pop-up van de trigger-configuratie op opslaan klikken om de wijzigingen door te voeren.
:::

### "Mijn aanvragen"-kaart <Badge>2.0+</Badge>

Kan worden gebruikt om de taakkaarten in de lijst "Mijn aanvragen" van het Takenoverzicht te configureren.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

In de kaart kunt u vrij de bedrijfsvelden (behalve relatievelden) of goedkeuringsgerelateerde informatie configureren die u wilt weergeven.

Nadat de goedkeuringsaanvraag is aangemaakt, is de aangepaste taakkaart zichtbaar in de lijst van het Takenoverzicht:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Weergavemodus van records in de workflow

*   **Snapshot**

    In de goedkeuringsworkflow is dit de recordstatus die de aanvrager en goedkeurders zien bij binnenkomst. Na indiening zien ze alleen de records die ze zelf hebben gewijzigd — ze zien geen updates die later door anderen zijn gemaakt.

*   **Nieuwste**

    In de goedkeuringsworkflow zien de aanvrager en goedkeurders gedurende het hele proces altijd de nieuwste versie van de record, ongeacht de status van de record voordat ze hun actie uitvoerden. Na afloop van het proces zien ze de definitieve versie van de record.

## Goedkeuringsnode

In een goedkeuringsworkflow moet u de specifieke "Goedkeuring"-node gebruiken om de operationele logica te configureren voor goedkeurders om de gestarte goedkeuring te verwerken (goedkeuren, afwijzen of terugsturen). De "Goedkeuring"-node kan alleen worden gebruikt in goedkeuringsworkflows. Raadpleeg [Goedkeuringsnode](../nodes/approval.md) voor details.

:::info{title=Tip}
Als een goedkeuringsworkflow geen "Goedkeuring"-nodes bevat, wordt de workflow automatisch goedgekeurd.
:::

## Configuratie voor het starten van een goedkeuring

Nadat u een goedkeuringsworkflow hebt geconfigureerd en ingeschakeld, kunt u deze workflow koppelen aan de verzendknop van het formulier van de bijbehorende collectie, zodat gebruikers een goedkeuring kunnen starten bij het indienen:

![Goedkeuring starten_Workflow koppelen](https://static-docs.nocobase.com/20251226110710.png)

Daarna zal het indienen van dit formulier door de gebruiker de bijbehorende goedkeuringsworkflow activeren. De ingediende gegevens worden niet alleen opgeslagen in de bijbehorende collectie, maar worden ook als snapshot vastgelegd in de goedkeuringsstroom voor raadpleging door latere goedkeurders.

:::info{title=Tip}
De knop om een goedkeuring te starten ondersteunt momenteel alleen de knop "Indienen" (of "Opslaan") in een aanmaak- of updateformulier. De knop "Workflow activeren" wordt niet ondersteund (deze knop kan alleen worden gekoppeld aan een "Aangepaste actie-gebeurtenis").
:::

## Takenoverzicht

Het Takenoverzicht biedt een centraal toegangspunt waar gebruikers hun taken kunnen bekijken en verwerken. Goedkeuringen die door de huidige gebruiker zijn gestart en openstaande taken zijn toegankelijk via het Takenoverzicht in de bovenste werkbalk, en verschillende typen taken kunnen worden bekeken via de navigatie aan de linkerkant.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Door mij gestart

#### Gestarte goedkeuringen bekijken

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Direct een nieuwe goedkeuring starten

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mijn taken

#### Takenlijst

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Taakdetails

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiatiefnemer

#### Starten vanuit collectie

Om vanuit een gegevensblok te starten, kunt u het volgende aanroepen (met de aanmaakknop van de `posts`-collectie als voorbeeld):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

De URL-parameter `triggerWorkflows` is de sleutel van de workflow; meerdere workflows worden gescheiden door komma's. Deze sleutel kunt u verkrijgen door met de muis over de workflownaam bovenaan het workflowcanvas te zweven:

![Workflow_sleutel_bekijken](https://static-docs.nocobase.com/20240426135108.png)

Na een succesvolle aanroep wordt de goedkeuringsworkflow voor de betreffende `posts`-collectie geactiveerd.

:::info{title="Tip"}
Omdat externe aanroepen ook gebaseerd moeten zijn op de gebruikersidentiteit, moet bij het aanroepen via de HTTP API authenticatie-informatie worden verstrekt, net als bij verzoeken vanuit de reguliere interface. Dit omvat de `Authorization`-header of de `token`-parameter (de bij het inloggen verkregen token), en de `X-Role`-header (de huidige rolnaam van de gebruiker).
:::

Als u een gebeurtenis wilt activeren voor één-op-één relatiegegevens in deze actie (één-op-veel wordt momenteel niet ondersteund), kunt u `!` gebruiken in de parameter om de triggergegevens voor het relatieveld te specificeren:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Na een succesvolle aanroep wordt de goedkeuringsgebeurtenis voor de betreffende `categories`-collectie geactiveerd.

:::info{title="Tip"}
Let bij het activeren van een gebeurtenis na de actie via de HTTP API ook op de status van de workflow en of de collectie-configuratie overeenkomt; anders kan de aanroep mislukken of een fout veroorzaken.
:::

#### Starten vanuit goedkeuringscentrum

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parameters**

* `collectionName`: De naam van de doelcollectie voor het starten van de goedkeuring, verplicht.
* `workflowId`: De ID van de workflow die wordt gebruikt om de goedkeuring te starten, verplicht.
* `data`: De velden van de collectierecord die worden aangemaakt bij het starten van de goedkeuring, verplicht.
* `status`: De status van de record die wordt aangemaakt bij het starten van de goedkeuring, verplicht. Mogelijke waarden zijn:
  * `0`: Concept, betekent opslaan zonder ter goedkeuring in te dienen.
  * `2`: Indienen ter goedkeuring, betekent dat de initiatiefnemer de goedkeuringsaanvraag indient en het goedkeuringsproces start.

#### Opslaan en indienen

Wanneer een gestarte (of ingetrokken) goedkeuring de status concept heeft, kunt u deze via de volgende interface opnieuw opslaan of indienen:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Lijst van gestarte goedkeuringen ophalen

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Intrekken

De initiatiefnemer kan een record dat zich momenteel in het goedkeuringsproces bevindt intrekken via de volgende interface:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameters**

* `<approval id>`: De ID van de goedkeuringsrecord die moet worden ingetrokken, verplicht.

### Goedkeurder

Nadat de goedkeuringsworkflow een goedkeuringsnode binnengaat, wordt er een taak aangemaakt voor de huidige goedkeurder. De goedkeurder kan de goedkeuringstaak voltooien via de interface of door een HTTP API-aanroep te doen.

#### Goedkeuringsverwerkingsrecords ophalen

Openstaande taken zijn goedkeuringsverwerkingsrecords. U kunt alle goedkeuringsverwerkingsrecords van de huidige gebruiker ophalen via de volgende interface:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Hierbij is `approvalRecords` een collectie-resource, dus u kunt algemene zoekcondities gebruiken zoals `filter`, `sort`, `pageSize` en `page`.

#### Eén goedkeuringsverwerkingsrecord ophalen

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Goedkeuren en afwijzen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parameters**

* `<record id>`: De ID van de record die moet worden verwerkt, verplicht.
* `status`: Veld voor de status van de goedkeuringsverwerking, `2` betekent "Goedkeuren", `-1` betekent "Afwijzen", verplicht.
* `comment`: Opmerkingen bij de goedkeuringsverwerking, optioneel.
* `data`: Wijzigingen aan de collectierecord van de huidige goedkeuringsnode na goedkeuring, optioneel (alleen effectief bij goedkeuring).

#### Terugsturen <Badge>v1.9.0+</Badge>

Vóór versie v1.9.0 gebruikten terugsturen, "goedkeuren" en "afwijzen" dezelfde interface, waarbij `"status": 1` stond voor terugsturen.

Vanaf versie v1.9.0 heeft terugsturen een aparte interface:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameters**

* `<record id>`: De ID van de record die moet worden verwerkt, verplicht.
* `returnToNodeKey`: De sleutel van de doelnode waarnaar moet worden teruggestuurd, optioneel. Wanneer in de node een bereik van terugstuurbare nodes is geconfigureerd, kan deze parameter worden gebruikt om te specificeren naar welke node moet worden teruggestuurd. Indien niet geconfigureerd, hoeft deze parameter niet te worden doorgegeven en wordt er standaard teruggestuurd naar het startpunt, zodat de initiatiefnemer opnieuw kan indienen.

#### Overdragen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameters**

* `<record id>`: De ID van de record die moet worden verwerkt, verplicht.
* `assignee`: De gebruikers-ID waaraan wordt overgedragen, verplicht.

#### Extra ondertekenaar toevoegen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameters**

* `<record id>`: De ID van de record die moet worden verwerkt, verplicht.
* `assignees`: Lijst met gebruikers-ID's voor extra ondertekening, verplicht.
* `order`: De volgorde van extra ondertekening, `-1` geeft aan vóór "mij", `1` geeft aan ná "mij".