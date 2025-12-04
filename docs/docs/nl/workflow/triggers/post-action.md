---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Gebeurtenis na actie

## Introductie

Alle gegevenswijzigingen die gebruikers in het systeem aanbrengen, gebeuren meestal via een actie. Dit is vaak in de vorm van het klikken op een knop, zoals een verzendknop in een formulier of een actieknop in een datablok. De gebeurtenis na actie wordt gebruikt om gerelateerde **workflows** te koppelen aan de acties van deze knoppen, zodat een specifiek proces wordt geactiveerd nadat de gebruikersactie succesvol is voltooid.

Wanneer u bijvoorbeeld gegevens toevoegt of bijwerkt, kunt u de optie 'Koppel **workflow**' voor een knop configureren. Nadat de actie is voltooid, wordt de gekoppelde **workflow** geactiveerd.

Op implementatieniveau, aangezien de verwerking van gebeurtenissen na actie zich in de middleware-laag bevindt (Koa's middleware), kunnen HTTP API-aanroepen naar NocoBase ook gedefinieerde gebeurtenissen na actie activeren.

## Installatie

Dit is een ingebouwde **plugin**, dus installatie is niet nodig.

## Triggerconfiguratie

### **Workflow** aanmaken

Wanneer u een **workflow** aanmaakt, kiest u 'Gebeurtenis na actie' als type:

![Create Workflow_Post-Action Event Trigger](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Uitvoeringsmodus

Voor gebeurtenissen na actie kunt u bij het aanmaken ook de uitvoeringsmodus 'Synchroon' of 'Asynchroon' kiezen:

![Create Workflow_Select Synchronous or Asynchronous](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Als het proces direct na de gebruikersactie moet worden uitgevoerd en een resultaat moet teruggeven, kunt u de synchrone modus gebruiken; anders is de standaardinstelling de asynchrone modus. In de asynchrone modus is de actie direct voltooid nadat de **workflow** is geactiveerd, en wordt de **workflow** sequentieel uitgevoerd in de achtergrondwachtrij van de applicatie.

### **Collectie** configureren

Ga naar het **workflow**-canvas, klik op de trigger om het configuratievenster te openen en selecteer eerst de **collectie** die u wilt koppelen:

![Workflow Configuration_Select Collection](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Triggermodus selecteren

Selecteer vervolgens de triggermodus; er zijn twee opties: lokale modus en globale modus:

![Workflow Configuration_Select Trigger Mode](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Hierbij geldt:

*   Lokale modus wordt alleen geactiveerd op actieknoppen waaraan deze **workflow** is gekoppeld. Het klikken op knoppen waaraan deze **workflow** niet is gekoppeld, zal deze niet activeren. U kunt beslissen of u deze **workflow** wilt koppelen op basis van de vraag of formulieren met verschillende doeleinden hetzelfde proces moeten activeren.
*   Globale modus wordt geactiveerd op alle geconfigureerde actieknoppen van de **collectie**, ongeacht van welk formulier ze afkomstig zijn, en het is niet nodig om de corresponderende **workflow** te koppelen.

In de lokale modus worden momenteel de volgende actieknoppen ondersteund voor koppeling:

*   De knoppen 'Verzenden' en 'Opslaan' in het toevoegformulier.
*   De knoppen 'Verzenden' en 'Opslaan' in het bijwerkformulier.
*   De knop 'Gegevens bijwerken' in gegevensrijen (tabel, lijst, kanban, enz.).

### Actietype selecteren

Als u de globale modus hebt gekozen, moet u ook het actietype selecteren. Momenteel worden 'Gegevens aanmaken' en 'Gegevens bijwerken' ondersteund. Beide acties activeren de **workflow** nadat de actie succesvol is voltooid.

### Vooraf geladen relatiegegevens selecteren

Als u de gekoppelde gegevens van de triggerende data in latere processen wilt gebruiken, kunt u de relatievelden selecteren die vooraf moeten worden geladen:

![Workflow Configuration_Preload Association](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Na activering kunt u deze gekoppelde gegevens direct in het proces gebruiken.

## Actieconfiguratie

Voor acties in de lokale triggermodus, nadat de **workflow** is geconfigureerd, moet u terugkeren naar de gebruikersinterface en de **workflow** koppelen aan de formulieractieknop van het corresponderende datablok.

**Workflows** die zijn geconfigureerd voor de knop 'Verzenden' (inclusief de knop 'Gegevens opslaan') worden geactiveerd nadat de gebruiker het corresponderende formulier heeft ingediend en de gegevensactie is voltooid.

![Post-Action Event_Submit Button](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Selecteer 'Koppel **workflow**' in het configuratiemenu van de knop om het configuratievenster voor koppeling te openen. In dit venster kunt u een willekeurig aantal **workflows** configureren die moeten worden geactiveerd. Als u er geen configureert, betekent dit dat er geen activering nodig is. Voor elke **workflow** moet u eerst bepalen of de triggerende gegevens de gegevens van het hele formulier zijn of de gegevens van een specifiek relatieveld in het formulier. Vervolgens selecteert u, op basis van de **collectie** die overeenkomt met het geselecteerde datamodel, de formulier-**workflow** die is geconfigureerd om overeen te komen met dat **collectie**model.

![Post-Action Event_Bind Workflow Configuration_Context Selection](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Post-Action Event_Bind Workflow Configuration_Workflow Selection](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Tip"}
De **workflow** moet zijn ingeschakeld voordat deze in de bovenstaande interface kan worden geselecteerd.
:::

## Voorbeeld

Hier volgt een demonstratie met behulp van de aanmaakactie.

Stel u een scenario voor van een 'Declaratieaanvraag'. We moeten, nadat een medewerker een declaratie heeft ingediend, een automatische controle van het bedrag uitvoeren en een handmatige controle voor bedragen die de limiet overschrijden. Alleen aanvragen die de controle doorstaan, worden goedgekeurd en daarna overgedragen aan de financiële afdeling voor verdere verwerking.

Eerst kunnen we een '**collectie**' genaamd 'Declaratie' aanmaken met de volgende velden:

- Projectnaam: Enkele regel tekst
- Aanvrager: Veel-op-één (Gebruiker)
- Bedrag: Getal
- Status: Enkele selectie ('Goedgekeurd', 'Verwerkt')

Maak vervolgens een **workflow** van het type 'Gebeurtenis na actie' aan en configureer het **collectie**model in de trigger als de '**collectie**' 'Declaratie':

![Example_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Nadat u de **workflow** hebt ingeschakeld, zullen we later terugkomen om de specifieke verwerkingsstappen van het proces te configureren.

Vervolgens maken we op de interface een tabelblok voor de '**collectie**' 'Declaratie', voegen we een 'Toevoegen'-knop toe aan de werkbalk en configureren we de corresponderende formuliervelden. In de configuratie-opties van de 'Verzenden'-actieknop van het formulier opent u het configuratiedialoogvenster 'Koppel **workflow**', selecteert u de volledige formuliergegevens als context, en kiest u de **workflow** die we eerder hebben aangemaakt:

![Example_Form Button Configuration_Bind Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Nadat de formulierconfiguratie is voltooid, keren we terug naar de logische opzet van de **workflow**. We willen bijvoorbeeld dat een handmatige controle door een beheerder vereist is wanneer het bedrag hoger is dan €500; anders wordt het direct goedgekeurd. Pas na goedkeuring wordt een declaratierecord aangemaakt en verder verwerkt door de financiële afdeling (weggelaten).

![Example_Processing Flow](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Als we de verdere financiële verwerking buiten beschouwing laten, is hiermee de configuratie van het declaratieaanvraagproces voltooid. Wanneer een medewerker een declaratieaanvraag invult en indient, wordt de corresponderende **workflow** geactiveerd. Als het declaratiebedrag minder dan €500 is, wordt automatisch een record aangemaakt en wacht het op verdere verwerking door de financiële afdeling. Anders wordt het beoordeeld door een leidinggevende, en na goedkeuring wordt eveneens een record aangemaakt en overgedragen aan de financiële afdeling.

Het proces in dit voorbeeld kan ook worden geconfigureerd op een reguliere 'Verzenden'-knop. U kunt, afhankelijk van het specifieke bedrijfsscenario, beslissen of u eerst een record wilt aanmaken voordat u de verdere processen uitvoert.

## Externe aanroep

Het activeren van gebeurtenissen na actie is niet beperkt tot gebruikersinterface-operaties; het kan ook worden geactiveerd via HTTP API-aanroepen.

:::info{title="Tip"}
Wanneer u een gebeurtenis na actie activeert via een HTTP API-aanroep, moet u ook letten op de ingeschakelde status van de **workflow** en of de **collectie**configuratie overeenkomt, anders kan de aanroep mislukken of een fout veroorzaken.
:::

Voor **workflows** die lokaal zijn gekoppeld aan een actieknop, kunt u deze als volgt aanroepen (met de aanmaakknop van de `posts`-**collectie** als voorbeeld):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Hierbij is de URL-parameter `triggerWorkflows` de sleutel van de **workflow**, waarbij meerdere **workflows** worden gescheiden door komma's. Deze sleutel kunt u verkrijgen door met de muis over de **workflow**naam bovenaan het **workflow**-canvas te zweven:

![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)

Nadat de bovenstaande aanroep succesvol is, wordt de gebeurtenis na actie van de corresponderende `posts`-**collectie** geactiveerd.

:::info{title="Tip"}
Aangezien externe aanroepen ook gebaseerd moeten zijn op gebruikersidentiteit, moet bij het aanroepen via HTTP API, net als bij verzoeken die vanuit de normale interface worden verzonden, authenticatie-informatie worden verstrekt. Dit omvat de `Authorization`-requestheader of de `token`-parameter (de token verkregen bij het inloggen), en de `X-Role`-requestheader (de huidige rolnaam van de gebruiker).
:::

Als u een gebeurtenis wilt activeren voor een één-op-één relatiegegeven in deze actie (één-op-veel wordt momenteel niet ondersteund), kunt u `!` in de parameter gebruiken om de triggerende gegevens van het relatieveld te specificeren:

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

Nadat de bovenstaande aanroep succesvol is, wordt de gebeurtenis na actie van de corresponderende `categories`-**collectie** geactiveerd.

:::info{title="Tip"}
Als de gebeurtenis is geconfigureerd in de globale modus, hoeft u de URL-parameter `triggerWorkflows` niet te gebruiken om de corresponderende **workflow** te specificeren. Een directe aanroep van de corresponderende **collectie**-actie zal deze activeren.
:::

## Veelgestelde vragen

### Verschil met gebeurtenis vóór actie

*   Gebeurtenis vóór actie: Wordt geactiveerd voordat een actie (zoals toevoegen, bijwerken, enz.) wordt uitgevoerd. Voordat de actie wordt uitgevoerd, kunnen de aangevraagde gegevens in de **workflow** worden gevalideerd of verwerkt. Als de **workflow** wordt beëindigd (de aanvraag wordt onderschept), wordt de actie (toevoegen, bijwerken, enz.) niet uitgevoerd.
*   Gebeurtenis na actie: Wordt geactiveerd nadat een gebruikersactie succesvol is voltooid. Op dit punt zijn de gegevens succesvol ingediend en opgeslagen in de database, en kunnen gerelateerde processen verder worden verwerkt op basis van het succesvolle resultaat.

Zoals weergegeven in de onderstaande afbeelding:

![Action Execution Order](https://static-docs.nocobase.com/7c901be2267d785205b70391332b7.png)

### Verschil met **collectie**-gebeurtenis

Gebeurtenissen na actie en **collectie**-gebeurtenissen vertonen overeenkomsten; beide zijn processen die worden geactiveerd na gegevenswijzigingen. Hun implementatieniveaus verschillen echter: gebeurtenissen na actie zijn gericht op het API-niveau, terwijl **collectie**-gebeurtenissen gericht zijn op gegevenswijzigingen binnen de **collectie**.

**Collectie**-gebeurtenissen liggen dichter bij de onderliggende laag van het systeem. In sommige gevallen kan een gegevenswijziging veroorzaakt door de ene gebeurtenis een andere gebeurtenis activeren, wat een kettingreactie teweegbrengt. Vooral wanneer gegevens in sommige gekoppelde **collecties** ook veranderen tijdens de bewerking van de huidige **collectie**, kunnen gebeurtenissen met betrekking tot de gekoppelde **collectie** ook worden geactiveerd.

De activering van **collectie**-gebeurtenissen bevat geen gebruikersgerelateerde informatie. Gebeurtenissen na actie daarentegen staan dichter bij de gebruiker en zijn het resultaat van gebruikersacties. De context van de **workflow** zal ook gebruikersgerelateerde informatie bevatten, waardoor ze geschikt zijn voor het verwerken van processen die voortvloeien uit gebruikersacties. In het toekomstige ontwerp van NocoBase zullen mogelijk meer gebeurtenissen na actie worden uitgebreid die kunnen worden gebruikt voor activering, daarom **wordt het sterker aanbevolen om gebeurtenissen na actie te gebruiken** voor het verwerken van processen waarbij gegevenswijzigingen worden veroorzaakt door gebruikersacties.

Een ander verschil is dat gebeurtenissen na actie lokaal kunnen worden gekoppeld aan specifieke formulierknoppen. Als er meerdere formulieren zijn, kunnen de inzendingen van een deel van de formulieren deze gebeurtenis activeren, terwijl andere dit niet doen. **Collectie**-gebeurtenissen daarentegen zijn gericht op gegevenswijzigingen in de gehele **collectie** en kunnen niet lokaal worden gekoppeld.