:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Integratie van HTTP-verzoeken in workflows

Met de HTTP-verzoeknode kunnen NocoBase workflows proactief verzoeken sturen naar elke HTTP-dienst, waardoor gegevensuitwisseling en bedrijfsintegratie met externe systemen mogelijk wordt.

## Overzicht

De HTTP-verzoeknode is een essentieel integratieonderdeel in workflows. Hiermee kunt u tijdens de uitvoering van een workflow API's van derden, interne service-interfaces of andere webdiensten aanroepen om gegevens op te halen of externe bewerkingen te activeren.

## Typische toepassingsscenario's

### Gegevens ophalen

- **Externe gegevens opvragen**: Haal realtime gegevens op van weer-API's, wisselkoers-API's, enz.
- **Adresresolutie**: Roep kaartservice-API's aan voor adresparsing en geocodering.
- **Bedrijfsgegevens synchroniseren**: Haal klant- en ordergegevens op uit CRM- en ERP-systemen.

### Bedrijfstriggers

- **Berichten versturen**: Roep SMS-, e-mail- of WeCom-diensten aan om meldingen te versturen.
- **Betaalverzoeken**: Start betalingen of terugbetalingen via betaalgateways.
- **Orderverwerking**: Dien vrachtbrieven in of vraag de logistieke status op bij verzendsystemen.

### Systeemintegratie

- **Microservice-aanroepen**: Roep API's van andere diensten aan in microservice-architecturen.
- **Gegevens rapporteren**: Rapporteer bedrijfsgegevens aan analyseplatforms of monitoringsystemen.
- **Diensten van derden**: Integreer AI-diensten, OCR-herkenning, spraaksynthese, enz.

### Automatisering

- **Geplande taken**: Roep periodiek externe API's aan om gegevens te synchroniseren.
- **Gebeurtenisrespons**: Roep automatisch externe API's aan wanneer gegevens wijzigen.
- **Goedkeuringsworkflows**: Dien goedkeuringsverzoeken in via API's van goedkeuringssystemen.

## Mogelijkheden

### Volledige HTTP-ondersteuning

- Ondersteunt alle HTTP-methoden: GET, POST, PUT, PATCH, DELETE.
- Ondersteuning voor aangepaste request headers (kopteksten).
- Meerdere gegevensformaten: JSON, formuliergegevens, XML, enz.
- Diverse parametertypen: URL-parameters, padparameters, request body (aanvraagtekst).

### Flexibele gegevensverwerking

- **Variabele referenties**: Gebruik workflowvariabelen om verzoeken dynamisch samen te stellen.
- **Respons parsing**: Parseert automatisch JSON-responses en extraheert de benodigde gegevens.
- **Gegevenstransformatie**: Transformeert de formaten van request- en responsgegevens.
- **Foutafhandeling**: Configureer herhaalstrategieën, time-outinstellingen en logica voor foutafhandeling.

### Beveiligde authenticatie

- **Basic Auth**: HTTP basisauthenticatie.
- **Bearer Token**: Tokenauthenticatie.
- **API Key**: Aangepaste API-sleutelauthenticatie.
- **Aangepaste Headers**: Ondersteuning voor elke authenticatiemethode.

## Gebruiksstappen

### 1. Controleer of de plugin is ingeschakeld

De HTTP-verzoeknode is een ingebouwde functie van de **workflow** plugin. Zorg ervoor dat de **[workflow](/plugins/@nocobase/plugin-workflow/)** plugin is ingeschakeld.

### 2. Voeg een HTTP-verzoeknode toe aan de workflow

1. Maak of bewerk een workflow.
2. Voeg een **HTTP-verzoek** node toe op de gewenste positie.

![HTTP Request - Add Node](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Configureer de verzoekparameters.

### 3. Verzoekparameters configureren

![HTTP Request Node - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Basisconfiguratie

- **Verzoek-URL**: Het doel-API-adres, ondersteunt variabelen.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Verzoekmethode**: Selecteer GET, POST, PUT, DELETE, enz.

- **Verzoekheaders**: Configureer HTTP-headers.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Verzoekparameters**:
  - **Query-parameters**: URL-queryparameters.
  - **Body-parameters**: Request body-gegevens (POST/PUT).

#### Geavanceerde configuratie

- **Time-out**: Stel de time-out voor het verzoek in (standaard 30 seconden).
- **Opnieuw proberen bij falen**: Configureer het aantal herhalingen en het herhaalinterval.
- **Falen negeren**: De workflow wordt voortgezet, zelfs als het verzoek mislukt.
- **Proxy-instellingen**: Configureer de HTTP-proxy (indien nodig).

### 4. Responsgegevens gebruiken

Nadat de HTTP-verzoeknode is uitgevoerd, kunnen de responsgegevens in volgende nodes worden gebruikt:

- `{{$node.data.status}}`: HTTP-statuscode.
- `{{$node.data.headers}}`: Responsheaders.
- `{{$node.data.data}}`: Respons body-gegevens.
- `{{$node.data.error}}`: Foutmelding (als het verzoek is mislukt).

![HTTP Request Node - Response Usage](https://static-docs.nocobase.com/20240529110610.png)

## Voorbeeldscenario's

### Voorbeeld 1: Weerinformatie ophalen

```javascript
// Configuratie
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Respons gebruiken
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Voorbeeld 2: WeCom-bericht verzenden

```javascript
// Configuratie
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Bestelling {{$context.orderId}} is verzonden"
  }
}
```

### Voorbeeld 3: Betaalstatus opvragen

```javascript
// Configuratie
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Voorwaardelijke logica
Als {{$node.data.data.status}} gelijk is aan "paid"
  - Werk de orderstatus bij naar "Betaald"
  - Stuur een melding van succesvolle betaling
Anders als {{$node.data.data.status}} gelijk is aan "pending"
  - Houd de orderstatus op "In afwachting van betaling"
Anders
  - Log de mislukte betaling
  - Breng de beheerder op de hoogte om de uitzondering af te handelen
```

### Voorbeeld 4: Gegevens synchroniseren met CRM

```javascript
// Configuratie
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Authenticatieconfiguratie

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API-sleutel

```javascript
// In de header
Headers:
  X-API-Key: your-api-key

// Of in de query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

U moet eerst een access_token verkrijgen en dit vervolgens gebruiken:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Foutafhandeling en debuggen

### Veelvoorkomende fouten

1. **Verbindings-time-out**: Controleer de netwerkverbinding, verhoog de time-outtijd.
2. **401 Ongeautoriseerd**: Controleer of de authenticatiegegevens correct zijn.
3. **404 Niet gevonden**: Controleer of de URL correct is.
4. **500 Serverfout**: Controleer de servicestatus van de API-provider.

### Debugtips

1. **Gebruik lognodes**: Voeg lognodes toe voor en na HTTP-verzoeken om request- en responsgegevens vast te leggen.

2. **Controleer uitvoeringslogboeken**: Uitvoeringslogboeken van workflows bevatten gedetailleerde request- en responsinformatie.

3. **Testtools**: Test de API eerst met tools zoals Postman of cURL.

4. **Foutafhandeling**: Voeg voorwaardelijke logica toe om verschillende responsstatussen af te handelen.

```javascript
Als {{$node.data.status}} >= 200 en {{$node.data.status}} < 300
  - Verwerk de succeslogica
Anders
  - Verwerk de foutlogica
  - Log de fout: {{$node.data.error}}
```

## Prestatieoptimalisatie

### 1. Gebruik asynchrone verwerking

Voor verzoeken die geen onmiddellijke resultaten vereisen, kunt u overwegen asynchrone workflows te gebruiken.

### 2. Configureer redelijke time-outs

Stel time-outs in op basis van de werkelijke responstijden van de API om overmatig wachten te voorkomen.

### 3. Implementeer cachingstrategieën

Voor gegevens die niet vaak veranderen (configuraties, woordenboeken), kunt u overwegen de responsen te cachen.

### 4. Batchverwerking

Als u meerdere keren dezelfde API moet aanroepen, overweeg dan het gebruik van batch-endpoints van de API (indien ondersteund).

### 5. Fout opnieuw proberen

Configureer redelijke herhaalstrategieën, maar vermijd overmatig opnieuw proberen om rate limiting van de API te voorkomen.

## Best practices voor beveiliging

### 1. Bescherm gevoelige informatie

- Geen gevoelige informatie in URL's blootstellen.
- Gebruik HTTPS voor versleutelde overdracht.
- Sla API-sleutels en gevoelige gegevens op in omgevingsvariabelen of configuratiebeheer.

### 2. Valideer responsgegevens

```javascript
// Valideer responsstatus
if (![200, 201].includes($node.data.status)) {
  throw new Error('API-verzoek mislukt');
}

// Valideer gegevensformaat
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Ongeldige responsgegevens');
}
```

### 3. Frequentiebeperking

Houd u aan de frequentiebeperkingen van API's van derden om te voorkomen dat u wordt geblokkeerd.

### 4. Logboekanonimisering

Anonimiseer gevoelige informatie (wachtwoorden, sleutels, enz.) bij het vastleggen van logboeken.

## Vergelijking met Webhook

| Kenmerk | HTTP-verzoeknode | Webhook-trigger |
|---------|------------------|-----------------|
| Richting | NocoBase roept extern aan | Extern roept NocoBase aan |
| Timing | Tijdens workflow-uitvoering | Wanneer externe gebeurtenis plaatsvindt |
| Doel | Gegevens ophalen, externe bewerkingen activeren | Externe meldingen, gebeurtenissen ontvangen |
| Typische scenario's | Betaal-API aanroepen, weer opvragen | Betaal-callbacks, berichtmeldingen |

Deze twee functies vullen elkaar aan en vormen samen een complete oplossing voor systeemintegratie.

## Gerelateerde bronnen

- [Documentatie workflow plugin](/plugins/@nocobase/plugin-workflow/)
- [Workflow: HTTP-verzoeknode](/workflow/nodes/request)
- [Workflow: Webhook-trigger](/integration/workflow-webhook/)
- [API-sleutelauthenticatie](/integration/api-keys/)
- [API-documentatie plugin](/plugins/@nocobase/plugin-api-doc/)