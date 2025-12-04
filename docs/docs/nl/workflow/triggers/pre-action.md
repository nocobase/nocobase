---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Gebeurtenis vóór actie

## Introductie

De **plugin** 'Gebeurtenis vóór actie' biedt een interceptiemechanisme voor acties. Deze kan worden geactiveerd nadat een verzoek voor een aanmaak-, update- of verwijderactie is ingediend, maar voordat het wordt verwerkt.

Als een "Eindig **workflow**"-knooppunt wordt uitgevoerd in de geactiveerde **workflow**, of als een ander knooppunt niet succesvol wordt uitgevoerd (door een fout of andere onvolledigheid), dan wordt de formulieractie onderschept. Anders wordt de beoogde actie normaal uitgevoerd.

Door het te gebruiken in combinatie met het knooppunt "Antwoordbericht", kunt u een antwoordbericht configureren dat naar de client wordt teruggestuurd, om zo passende meldingen te geven. Gebeurtenissen vóór actie kunnen worden gebruikt voor bedrijfsvalidatie of logische controles, om aanmaak-, update- en verwijderverzoeken die door de client zijn ingediend, goed te keuren of te onderscheppen.

## Triggerconfiguratie

### Trigger aanmaken

Wanneer u een **workflow** aanmaakt, selecteert u het type "Gebeurtenis vóór actie":

![Create Before Action Event](https://static-docs.nocobase.com/2add03f2bdb0a86baae5fe9864fc4b6.png)

### Collectie selecteren

In de trigger van een interceptie-**workflow** is het eerste wat u moet configureren de **collectie** die overeenkomt met de actie:

![Interceptor Event Configuration_Collection](https://static-docs.nocobase.com/8f712caca159d334cf776f838d53d6.png)

Vervolgens selecteert u de interceptiemodus. U kunt ervoor kiezen om alleen de actieknop te onderscheppen die aan deze **workflow** is gekoppeld, of om alle geselecteerde acties voor deze **collectie** te onderscheppen (ongeacht uit welk formulier ze komen, en zonder dat de bijbehorende **workflow** hoeft te worden gekoppeld):

### Interceptiemodus

![Interceptor Event Configuration_Interception Mode](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Momenteel ondersteunde actietypen zijn "Aanmaken", "Updaten" en "Verwijderen". U kunt meerdere actietypen tegelijk selecteren.

## Actieconfiguratie

Als in de triggerconfiguratie de modus "Interceptie alleen activeren wanneer een formulier dat aan deze **workflow** is gekoppeld, wordt ingediend" is geselecteerd, moet u ook teruggaan naar de formulierinterface en deze **workflow** koppelen aan de bijbehorende actieknop:

![Add Order_Bind Workflow](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

In de **workflow**-koppelingsconfiguratie selecteert u de bijbehorende **workflow**. Meestal is de standaardcontext voor het activeren van **gegevens**, "Volledige formuliergegevens", voldoende:

![Select Workflow to Bind](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Tip}
De knoppen die aan een 'Gebeurtenis vóór actie' kunnen worden gekoppeld, ondersteunen momenteel alleen de knoppen "Verzenden" (of "Opslaan"), "Gegevens bijwerken" en "Verwijderen" in aanmaak- of updateformulieren. De knop "Activeer **workflow**" wordt niet ondersteund (deze kan alleen worden gekoppeld aan een 'Gebeurtenis na actie').
:::

## Voorwaarden voor interceptie

Bij een "Gebeurtenis vóór actie" zijn er twee voorwaarden die ertoe leiden dat de bijbehorende actie wordt onderschept:

1. De **workflow** bereikt een "Eindig **workflow**"-knooppunt. Net als in de voorgaande instructies, wanneer de **gegevens** die de **workflow** hebben geactiveerd niet voldoen aan de vooraf ingestelde voorwaarden in een "Conditie"-knooppunt, zal de "Nee"-tak worden ingegaan en het "Eindig **workflow**"-knooppunt worden uitgevoerd. Op dat moment eindigt de **workflow** en wordt de aangevraagde actie onderschept.
2. Een knooppunt in de **workflow** wordt niet succesvol uitgevoerd, inclusief uitvoeringsfouten of andere uitzonderlijke situaties. In dit geval eindigt de **workflow** met een overeenkomstige status en wordt de aangevraagde actie ook onderschept. Als de **workflow** bijvoorbeeld externe **gegevens** oproept via een "HTTP-verzoek" en het verzoek mislukt, eindigt de **workflow** met een mislukte status en wordt tegelijkertijd het bijbehorende actieverzoek onderschept.

Nadat aan de interceptievoorwaarden is voldaan, wordt de bijbehorende actie niet langer uitgevoerd. Als een orderinzending bijvoorbeeld wordt onderschept, worden de bijbehorende order**gegevens** niet aangemaakt.

## Gerelateerde parameters voor de bijbehorende actie

In een **workflow** van het type "Gebeurtenis vóór actie" kunnen, afhankelijk van de actie, verschillende **gegevens** van de trigger als variabelen in de **workflow** worden gebruikt:

| Actietype \ Variabele | "Operator" | "Rol-ID operator" | Actieparameter: "ID" | Actieparameter: "Ingediend **gegevens**object" |
| ---------------------- | ---------- | ----------------- | -------------------- | --------------------------------------------- |
| Een record aanmaken    | ✓          | ✓                 | -                    | ✓                                             |
| Een record bijwerken   | ✓          | ✓                 | ✓                    | ✓                                             |
| Eén of meerdere records verwijderen | ✓          | ✓                 | ✓                    | -                                             |

:::info{title=Tip}
De variabele "Trigger**gegevens** / Actieparameters / Ingediend **gegevens**object" in een 'Gebeurtenis vóór actie' is niet de werkelijke **gegevens** uit de database, maar eerder de parameters die met de actie zijn ingediend. Als u de werkelijke **gegevens** uit de database nodig heeft, moet u deze opvragen met behulp van een "Query **gegevens**"-knooppunt binnen de **workflow**.

Bovendien is voor een verwijderactie de "ID" in de actieparameters een enkele waarde wanneer het om één record gaat, maar een array wanneer het om meerdere records gaat.
:::

## Antwoordbericht uitvoeren

Nadat u de trigger heeft geconfigureerd, kunt u de relevante beoordelingslogica in de **workflow** aanpassen. Meestal gebruikt u de vertakkingsmodus van het "Conditie"-knooppunt om, op basis van de resultaten van specifieke bedrijfscondities, te beslissen of u de "**workflow** beëindigt" en een vooraf ingesteld "Antwoordbericht" retourneert:

![Interceptor Workflow Configuration](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Hiermee is de configuratie van de bijbehorende **workflow** voltooid. U kunt nu proberen **gegevens** in te dienen die niet voldoen aan de voorwaarden die in het conditieknooppunt van de **workflow** zijn geconfigureerd, om zo de interceptielogica van de interceptor te activeren. U zult dan het geretourneerde antwoordbericht zien:

![Error Response Message](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Status van het antwoordbericht

Als het "Eindig **workflow**"-knooppunt is geconfigureerd om met een "Succes"-status af te sluiten, en dit knooppunt wordt uitgevoerd, dan wordt het verzoek voor deze actie nog steeds onderschept. Het geretourneerde antwoordbericht wordt echter weergegeven met een "Succes"-status (in plaats van "Fout").

![Success Status Response Message](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Voorbeeld

Laten we, in combinatie met de bovenstaande basisinstructies, een "Orderinzending"-scenario als voorbeeld nemen. Stel dat we bij het indienen van een bestelling door de gebruiker de voorraad van alle geselecteerde producten moeten controleren. Als de voorraad van een geselecteerd product onvoldoende is, wordt de bestelling onderschept en wordt een bijbehorende melding teruggestuurd. De **workflow** zal elk product controleren totdat de voorraad van alle producten voldoende is, waarna het doorgaat en de order**gegevens** voor de gebruiker aanmaakt.

Andere stappen zijn hetzelfde als in de instructies. Echter, aangezien een bestelling meerdere producten omvat, moet u, naast het toevoegen van een veel-op-veel-relatie "Bestelling" <-- M:1 -- "Bestelregel" -- 1:M --> "Product" in het **gegevens**model, ook een "Lus"-knooppunt toevoegen in de "**workflow** 'Gebeurtenis vóór actie'" om iteratief te controleren of de voorraad van elk product voldoende is:

![Example_Loop Check Workflow](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Het object voor de lus wordt geselecteerd als de array "Bestelregel" uit de ingediende order**gegevens**:

![Example_Loop Object Configuration](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Het conditieknooppunt binnen de lus wordt gebruikt om te bepalen of de voorraad van het huidige productobject in de lus voldoende is:

![Example_Condition in Loop](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Andere configuraties zijn hetzelfde als in het basisgebruik. Wanneer de bestelling uiteindelijk wordt ingediend, wordt de bestelling onderschept en wordt een bijbehorende melding teruggestuurd als een product onvoldoende voorraad heeft. Probeer tijdens het testen een bestelling in te dienen met meerdere producten, waarbij één product onvoldoende voorraad heeft en een ander voldoende. U ziet dan het geretourneerde antwoordbericht:

![Example_Response Message after Submission](https://static-docs.nocobase.com/dd9e81084aa237d5629595ab6cf00f8aa898e3.png)

Zoals u kunt zien, geeft het antwoordbericht niet aan dat het eerste product, "iPhone 15 pro", onvoldoende voorraad heeft, maar alleen dat het tweede product, "iPhone 14 pro", onvoldoende voorraad heeft. Dit komt omdat in de lus het eerste product voldoende voorraad had en daarom niet werd onderschept, terwijl het tweede product onvoldoende voorraad had, wat de orderinzending onderschepte.

## Externe aanroep

De 'Gebeurtenis vóór actie' zelf wordt geïnjecteerd tijdens de verwerkingsfase van het verzoek, en ondersteunt daarom ook activering via HTTP API-aanroepen.

Voor **workflows** die lokaal aan een actieknop zijn gekoppeld, kunt u deze als volgt aanroepen (met de aanmaakknop van de `posts`-**collectie** als voorbeeld):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

De URL-parameter `triggerWorkflows` is de sleutel van de **workflow**; meerdere **workflow**-sleutels worden gescheiden door komma's. Deze sleutel kunt u verkrijgen door de muis over de **workflow**naam bovenaan het **workflow**-canvas te bewegen:

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

Nadat de bovenstaande aanroep is gedaan, wordt de 'Gebeurtenis vóór actie' voor de bijbehorende `posts`-**collectie** geactiveerd. Nadat de bijbehorende **workflow** synchroon is verwerkt, worden de **gegevens** normaal aangemaakt en geretourneerd.

Als de geconfigureerde **workflow** een "Eindknooppunt" bereikt, is de logica hetzelfde als bij een interface-actie: het verzoek wordt onderschept en er worden geen **gegevens** aangemaakt. Als de status van het eindknooppunt is geconfigureerd als mislukt, is de geretourneerde antwoordstatuscode `400`; bij succes is deze `200`.

Als er vóór het eindknooppunt ook een "Antwoordbericht"-knooppunt is geconfigureerd, wordt het gegenereerde bericht ook in het antwoordresultaat geretourneerd. De structuur voor een fout is:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

De berichtstructuur wanneer het "Eindknooppunt" is geconfigureerd voor succes is:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Tip}
Aangezien er meerdere "Antwoordbericht"-knooppunten in een **workflow** kunnen worden toegevoegd, is de **gegevens**structuur van het geretourneerde bericht een array.
:::

Als de 'Gebeurtenis vóór actie' is geconfigureerd in de globale modus, hoeft u bij het aanroepen van de HTTP API de URL-parameter `triggerWorkflows` niet te gebruiken om de bijbehorende **workflow** te specificeren. Een directe aanroep van de bijbehorende **collectie**-actie zal deze activeren.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Tip"}
Wanneer u een 'Gebeurtenis vóór actie' activeert via een HTTP API-aanroep, moet u ook letten op de geactiveerde status van de **workflow** en of de **collectie**-configuratie overeenkomt, anders kan de aanroep mislukken of een fout veroorzaken.
:::