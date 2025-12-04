---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Goedkeuring

## Introductie

Goedkeuring is een type workflow dat specifiek is ontworpen om handmatig te worden gestart en verwerkt, met als doel de status van gerelateerde gegevens te bepalen. Het wordt vaak gebruikt voor procesbeheer in kantoorautomatisering of andere handmatige besluitvormingsprocessen. Denk hierbij aan het creëren en beheren van handmatige workflows voor scenario's zoals 'verlofaanvragen', 'declaratiegoedkeuringen' en 'goedkeuringen voor inkoop van grondstoffen'.

De Goedkeuring plugin biedt een speciaal workflowtype (trigger) 'Goedkeuring (gebeurtenis)' en een specifieke 'Goedkeuring' node voor dit proces. In combinatie met de unieke aangepaste collecties en aangepaste blokken van NocoBase, kunt u snel en flexibel diverse goedkeuringsscenario's creëren en beheren.

## Een workflow aanmaken

Wanneer u een workflow aanmaakt, kiest u het type 'Goedkeuring' om een goedkeuringsworkflow te creëren:

![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Vervolgens klikt u in de workflow configuratie-interface op de trigger om een dialoogvenster te openen voor verdere configuratie.

## Trigger configuratie

### Een collectie koppelen

De Goedkeuring plugin van NocoBase is ontworpen voor flexibiliteit en kan worden gebruikt met elke aangepaste collectie. Dit betekent dat u voor de goedkeuringsconfiguratie het datamodel niet opnieuw hoeft te configureren, maar direct een bestaande collectie kunt hergebruiken. Nadat u de trigger configuratie hebt geopend, moet u daarom eerst een collectie selecteren om te bepalen welke gegevens van die collectie de workflow zullen activeren bij aanmaak of update:

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Koppel vervolgens in het formulier voor het aanmaken (of bewerken) van gegevens van de betreffende collectie deze workflow aan de verzendknop:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Nadat een gebruiker dit formulier heeft ingediend, wordt de bijbehorende goedkeuringsworkflow geactiveerd. De ingediende gegevens worden niet alleen opgeslagen in de betreffende collectie, maar worden ook als snapshot vastgelegd in de goedkeuringsstroom, zodat latere goedkeurders deze kunnen raadplegen en gebruiken.

### Intrekken

Als een goedkeuringsworkflow toestaat dat de initiatiefnemer deze intrekt, moet u de knop 'Intrekken' inschakelen in de interface configuratie van de initiatiefnemer:

![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)

Na inschakeling kan een goedkeuring die via deze workflow is gestart, door de initiatiefnemer worden ingetrokken voordat een goedkeurder deze heeft verwerkt. Echter, nadat een goedkeurder in een volgende goedkeuringsnode de aanvraag heeft verwerkt, kan deze niet meer worden ingetrokken.

:::info{title=Opmerking}
Nadat u de intrekknop hebt ingeschakeld of verwijderd, moet u in het dialoogvenster van de trigger configuratie op 'Opslaan' klikken en de wijzigingen indienen om ze van kracht te laten worden.
:::

### Configuratie van de indieningsinterface voor goedkeuringen

Tot slot moet u de formulierinterface van de initiatiefnemer configureren. Deze interface wordt gebruikt voor indieningsacties wanneer een goedkeuring wordt gestart vanuit het goedkeuringscentrum blok, en wanneer deze opnieuw wordt gestart na een intrekking. Klik op de configuratieknop om het dialoogvenster te openen:

![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

U kunt aan de interface van de initiatiefnemer een invulformulier toevoegen, gebaseerd op de gekoppelde collectie, of beschrijvende tekst (Markdown) ter begeleiding en instructie. Het formulier is verplicht; anders kan de initiatiefnemer geen acties uitvoeren zodra deze de interface betreedt.

Nadat u een formulierblok hebt toegevoegd, kunt u, net als in een reguliere formulierconfiguratie-interface, veldcomponenten van de betreffende collectie toevoegen en deze naar wens rangschikken om de in te vullen inhoud van het formulier te organiseren:

![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Naast de directe verzendknop kunt u ook een actieknop 'Opslaan als concept' toevoegen om een tijdelijk opslagproces te ondersteunen:

![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Goedkeuringsnode

Binnen een goedkeuringsworkflow moet u de speciale 'Goedkeuring' node gebruiken om de operationele logica te configureren voor goedkeurders om de gestarte goedkeuring te verwerken (goedkeuren, afwijzen of terugsturen). De 'Goedkeuring' node kan alleen worden gebruikt in goedkeuringsworkflows. Raadpleeg [Goedkeuringsnode](../nodes/approval.md) voor meer details.

## Configuratie voor het starten van een goedkeuring

Nadat u een goedkeuringsworkflow hebt geconfigureerd en ingeschakeld, kunt u deze koppelen aan de verzendknop van het formulier van de betreffende collectie, zodat gebruikers een goedkeuring kunnen starten bij het indienen:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Nadat de workflow is gekoppeld, wordt er een goedkeuring gestart wanneer een gebruiker het huidige formulier indient.

:::info{title=Opmerking}
Momenteel ondersteunt de knop om een goedkeuring te starten alleen de knop 'Verzenden' (of 'Opslaan') in een aanmaak- of updateformulier. De knop 'Verzenden naar workflow' wordt niet ondersteund (deze knop kan alleen worden gekoppeld aan een 'Na actie gebeurtenis').
:::

## Takenoverzicht

Het Takenoverzicht biedt een centraal toegangspunt voor gebruikers om hun openstaande taken te bekijken en te verwerken. Goedkeuringen die door de huidige gebruiker zijn gestart en diens openstaande taken zijn toegankelijk via het Takenoverzicht in de bovenste werkbalk, en verschillende typen openstaande taken kunnen worden bekeken via de categorienavigatie aan de linkerkant.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mijn aanvragen

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

#### Starten vanuit een collectie

Om vanuit een datablok te starten, kunt u een aanroep doen zoals hieronder (met de aanmaakknop van de `posts` collectie als voorbeeld):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Hier is de URL-parameter `triggerWorkflows` de sleutel van de workflow; meerdere workflows worden gescheiden door komma's. Deze sleutel kunt u verkrijgen door met de muis over de workflownaam bovenaan het workflowcanvas te zweven:

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

Na een succesvolle aanroep wordt de goedkeuringsworkflow voor de betreffende `posts` collectie geactiveerd.

:::info{title="Opmerking"}
Aangezien externe aanroepen ook gebaseerd moeten zijn op de gebruikersidentiteit, moet bij het aanroepen via de HTTP API, net als bij verzoeken die vanuit de reguliere interface worden verzonden, authenticatie-informatie worden verstrekt. Dit omvat de `Authorization` header of de `token` parameter (de token verkregen bij het inloggen), en de `X-Role` header (de huidige rolnaam van de gebruiker).
:::

Als u een gebeurtenis wilt activeren voor één-op-één gerelateerde gegevens binnen deze actie (één-op-veel wordt momenteel niet ondersteund), kunt u `!` gebruiken in de parameter om de triggergegevens voor het relatieveld te specificeren:

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

Na een succesvolle aanroep wordt de goedkeuringsgebeurtenis voor de betreffende `categories` collectie geactiveerd.

:::info{title="Opmerking"}
Wanneer u een 'na-actie' gebeurtenis activeert via de HTTP API, moet u ook letten op de ingeschakelde status van de workflow en of de collectie configuratie overeenkomt; anders kan de aanroep mislukken of een fout veroorzaken.
:::

#### Starten vanuit het goedkeuringscentrum

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

*   `collectionName`: De naam van de doelcollectie voor het starten van de goedkeuring. Verplicht.
*   `workflowId`: De ID van de workflow die wordt gebruikt om de goedkeuring te starten. Verplicht.
*   `data`: De velden van de collectie record die worden aangemaakt bij het starten van de goedkeuring. Verplicht.
*   `status`: De status van de record die wordt aangemaakt bij het starten van de goedkeuring. Verplicht. Mogelijke waarden zijn:
    *   `0`: Concept, geeft aan dat de record wordt opgeslagen zonder deze ter goedkeuring in te dienen.
    *   `1`: Indienen ter goedkeuring, geeft aan dat de initiatiefnemer de goedkeuringsaanvraag indient en het goedkeuringsproces ingaat.

#### Opslaan en indienen

Wanneer een gestarte (of ingetrokken) goedkeuring de status 'concept' heeft, kunt u deze via de volgende API opnieuw opslaan of indienen:

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

De initiatiefnemer kan een record dat zich momenteel in het goedkeuringsproces bevindt, intrekken via de volgende API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameters**

*   `<approval id>`: De ID van de goedkeuringsrecord die moet worden ingetrokken. Verplicht.

### Goedkeurder

Nadat de goedkeuringsworkflow een goedkeuringsnode binnengaat, wordt er een openstaande taak aangemaakt voor de huidige goedkeurder. De goedkeurder kan de goedkeuringstaak voltooien via de interface of door een HTTP API aanroep te doen.

#### Goedkeuringsrecords ophalen

Openstaande taken zijn goedkeuringsrecords. U kunt alle goedkeuringsrecords van de huidige gebruiker ophalen via de volgende API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Hier is `approvalRecords` een collectie resource, dus u kunt algemene zoekcondities gebruiken zoals `filter`, `sort`, `pageSize` en `page`.

#### Eén goedkeuringsrecord ophalen

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

*   `<record id>`: De ID van de record die moet worden goedgekeurd. Verplicht.
*   `status`: Het veld voor de status van het goedkeuringsproces. ``2`` staat voor 'Goedkeuren', ``-1`` voor 'Afwijzen'. Verplicht.
*   `comment`: Opmerkingen voor het goedkeuringsproces. Optioneel.
*   `data`: Wijzigingen aan de collectie record bij de huidige goedkeuringsnode na goedkeuring. Optioneel (alleen van kracht bij goedkeuring).

#### Terugsturen <Badge>v1.9.0+</Badge>

Vóór versie v1.9.0 werd voor het terugsturen dezelfde API gebruikt als voor 'Goedkeuren' en 'Afwijzen', waarbij `"status": 1` stond voor terugsturen.

Vanaf versie v1.9.0 heeft het terugsturen een aparte API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameters**

*   `<record id>`: De ID van de record die moet worden goedgekeurd. Verplicht.
*   `returnToNodeKey`: De sleutel van de doelnode waarnaar moet worden teruggestuurd. Optioneel. Wanneer een bereik van terugstuurbare nodes is geconfigureerd in de node, kan deze parameter worden gebruikt om te specificeren naar welke node moet worden teruggestuurd. Indien niet geconfigureerd, hoeft deze parameter niet te worden doorgegeven en zal deze standaard terugkeren naar het startpunt, zodat de initiatiefnemer opnieuw kan indienen.

#### Overdragen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameters**

*   `<record id>`: De ID van de record die moet worden goedgekeurd. Verplicht.
*   `assignee`: De ID van de gebruiker waaraan moet worden overgedragen. Verplicht.

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

*   `<record id>`: De ID van de record die moet worden goedgekeurd. Verplicht.
*   `assignees`: Een lijst met gebruikers-ID's die als extra ondertekenaars moeten worden toegevoegd. Verplicht.
*   `order`: De volgorde van de toegevoegde ondertekenaar. ``-1`` betekent vóór 'mij', ``1`` betekent ná 'mij'.