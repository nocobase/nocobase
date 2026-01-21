---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# HTTP Verzoek

## Introductie

Wanneer u wilt communiceren met een ander websysteem, kunt u de HTTP Verzoek-node gebruiken. Deze node stuurt, wanneer deze wordt uitgevoerd, een HTTP-verzoek naar het opgegeven adres volgens de configuratie. Het kan gegevens in JSON- of `application/x-www-form-urlencoded`-formaat meezenden om gegevensuitwisseling met externe systemen mogelijk te maken.

Als u bekend bent met tools voor het verzenden van verzoeken, zoals Postman, dan zult u snel de werking van de HTTP Verzoek-node onder de knie krijgen. In tegenstelling tot deze tools kunnen alle parameters in de HTTP Verzoek-node gebruikmaken van contextvariabelen uit de huidige workflow, waardoor een organische integratie met de bedrijfsprocessen van uw systeem mogelijk is.

## Installatie

Ingebouwde plugin, geen installatie vereist.

## Een Node Aanmaken

In de configuratie-interface van de workflow klikt u op de plusknop ('+') in de workflow om een 'HTTP Verzoek'-node toe te voegen:

![HTTP Verzoek_Toevoegen](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Node Configuratie

![HTTP Verzoek Node_Configuratie](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Verzoekmethode

Beschikbare HTTP-verzoekmethoden: `GET`, `POST`, `PUT`, `PATCH` en `DELETE`.

### Verzoek-URL

De URL van de HTTP-service, die het protocolgedeelte (`http://` of `https://`) moet bevatten. Het gebruik van `https://` wordt aanbevolen.

### Verzoekgegevensformaat

Dit is de `Content-Type` in de verzoekheader. Zie het gedeelte '[Verzoekbody](#请求体)' voor ondersteunde formaten.

### Verzoekheader Configuratie

Sleutel-waardeparen voor het Header-gedeelte van het verzoek. De waarden kunnen gebruikmaken van variabelen uit de workflowcontext.

:::info{title=Tip}
De `Content-Type` verzoekheader wordt geconfigureerd via het verzoekgegevensformaat. U hoeft deze hier niet in te vullen, en een eventuele overschrijving is niet effectief.
:::

### Verzoekparameters

Sleutel-waardeparen voor het query-gedeelte van het verzoek. De waarden kunnen gebruikmaken van variabelen uit de workflowcontext.

### Verzoekbody

Het Body-gedeelte van het verzoek. Afhankelijk van de gekozen `Content-Type` worden verschillende formaten ondersteund.

#### `application/json`

Ondersteunt standaard JSON-geformatteerde tekst. U kunt variabelen uit de workflowcontext invoegen via de variabeleknop rechtsboven in het tekstbewerkingsveld.

:::info{title=Tip}
Variabelen moeten binnen een JSON-string worden gebruikt, bijvoorbeeld: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Sleutel-waardepaar formaat. De waarden kunnen gebruikmaken van variabelen uit de workflowcontext. Wanneer variabelen zijn opgenomen, worden deze geparseerd als een stringtemplate en samengevoegd tot de uiteindelijke stringwaarde.

#### `application/xml`

Ondersteunt standaard XML-geformatteerde tekst. U kunt variabelen uit de workflowcontext invoegen via de variabeleknop rechtsboven in het tekstbewerkingsveld.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Ondersteunt sleutel-waardeparen voor formuliergegevens. Bestanden kunnen worden geüpload wanneer het gegevenstype is ingesteld op een bestandsobject. Bestanden kunnen alleen via variabelen worden geselecteerd uit bestaande bestandsobjecten in de context, zoals de resultaten van een query op een bestands-collectie of gerelateerde gegevens van een gekoppelde bestands-collectie.

:::info{title=Tip}
Bij het selecteren van bestandsgegevens moet u ervoor zorgen dat de variabele overeenkomt met een enkel bestandsobject, en niet met een lijst van bestanden (bij een één-op-veel of veel-op-veel relatiequery zal de waarde van het relatieveld een array zijn).
:::

### Time-out Instellingen

Wanneer een verzoek lange tijd niet reageert, kan de time-out instelling worden gebruikt om de uitvoering ervan te annuleren. Als het verzoek een time-out krijgt, wordt de huidige workflow voortijdig beëindigd met een mislukte status.

### Fouten Negeeren

De verzoek-node beschouwt standaard HTTP-statuscodes tussen `200` en `299` (inclusief) als succesvol, en alle andere als mislukt. Als de optie 'Mislukte verzoeken negeren en workflow voortzetten' is aangevinkt, dan worden de daaropvolgende nodes in de workflow nog steeds uitgevoerd, zelfs als het verzoek mislukt.

## Het Gebruiken van het Responsresultaat

Het responsresultaat van een HTTP-verzoek kan worden geparseerd door de [JSON Query](./json-query.md)-node voor gebruik in daaropvolgende nodes.

Vanaf versie `v1.0.0-alpha.16` kunnen drie delen van het responsresultaat van de verzoek-node afzonderlijk als variabelen worden gebruikt:

*   Responsstatuscode
*   Responsheaders
*   Responsgegevens

![HTTP Verzoek Node_Responsresultaat Gebruiken](https://static-docs.nocobase.com/20240529110610.png)

De responsstatuscode is meestal een standaard HTTP-statuscode in numerieke vorm, zoals `200`, `403`, enz. (zoals opgegeven door de serviceprovider).

De responsheaders (Response headers) zijn in JSON-formaat. Zowel de headers als de JSON-geformatteerde responsgegevens moeten nog steeds worden geparseerd met een JSON-node voordat ze kunnen worden gebruikt.

## Voorbeeld

We kunnen bijvoorbeeld de verzoek-node gebruiken om te koppelen met een cloudplatform voor het verzenden van notificatie-sms'jes. De configuratie voor een SMS-API van Alibaba Cloud kan er als volgt uitzien (u dient de documentatie van de specifieke API te raadplegen om de parameters aan te passen):

![HTTP Verzoek Node_Configuratie](https://static-docs.nocobase.com/20240515124004.png)

Wanneer de workflow deze node activeert, zal deze de SMS-API van Alibaba Cloud aanroepen met de geconfigureerde inhoud. Als het verzoek succesvol is, wordt er een sms verzonden via de cloud-sms-service.