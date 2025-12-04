:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Arbetsflödesintegration med HTTP-förfrågningar

Med noden för HTTP-förfrågningar kan NocoBase-arbetsflöden proaktivt skicka förfrågningar till valfri HTTP-tjänst, vilket möjliggör datautbyte och affärsintegration med externa system.

## Översikt

Noden för HTTP-förfrågningar är en central integrationskomponent i arbetsflöden. Den låter er anropa tredjeparts-API:er, interna tjänstegränssnitt eller andra webbtjänster under ett arbetsflödes körning för att hämta data eller utlösa externa åtgärder.

## Typiska användningsfall

### Datahämtning

- **Förfrågningar till tredjepartsdata**: Hämta realtidsdata från väder-API:er, valutakurs-API:er m.m.
- **Adressupplösning**: Anropa karttjänst-API:er för adressanalys och geokodning.
- **Synkronisering av företagsdata**: Hämta kund- och orderdata från CRM- och ERP-system.

### Affärsutlösare

- **Meddelandepush**: Anropa SMS-, e-post- eller WeCom-tjänster för att skicka meddelanden.
- **Betalningsförfrågningar**: Initiera betalningar, återbetalningar med betalningsgateways.
- **Orderhantering**: Skicka fraktsedlar, fråga efter leveransstatus med logistiksystem.

### Systemintegration

- **Mikrotjänstanrop**: Anropa API:er för andra tjänster i mikrotjänstarkitekturer.
- **Datainsamling**: Rapportera affärsdata till analysplattformar och övervakningssystem.
- **Tredjepartstjänster**: Integrera AI-tjänster, OCR-igenkänning, talsyntes m.m.

### Automation

- **Schemalagda uppgifter**: Anropa externa API:er regelbundet för att synkronisera data.
- **Händelsereaktion**: Anropa automatiskt externa API:er när data ändras för att meddela relevanta system.
- **Godkännandearbetsflöden**: Skicka godkännandeförfrågningar via API:er för godkännandesystem.

## Funktioner

### Fullständigt HTTP-stöd

- Stöder alla HTTP-metoder: GET, POST, PUT, PATCH, DELETE.
- Stöder anpassade förfrågningshuvuden (Headers).
- Stöder flera dataformat: JSON, formulärdata, XML m.m.
- Stöder olika parametertyper: URL-parametrar, sökvägsparametrar, förfrågningskropp m.m.

### Flexibel datahantering

- **Variabelreferenser**: Konstruera förfrågningar dynamiskt med arbetsflödesvariabler.
- **Svarsparsning**: Parsar automatiskt JSON-svar och extraherar önskad data.
- **Datatransformering**: Transformera formatet på förfrågnings- och svarsdata.
- **Felhantering**: Konfigurera omprövningsstrategier, tidsgränsinställningar och felhanteringslogik.

### Säkerhetsautentisering

- **Basic Auth**: Grundläggande HTTP-autentisering.
- **Bearer Token**: Tokenautentisering.
- **API Key**: Anpassad API-nyckelautentisering.
- **Anpassade Headers**: Stöd för valfri autentiseringsmetod.

## Användningssteg

### 1. Kontrollera att pluginet är aktiverat

Noden för HTTP-förfrågningar är en inbyggd funktion i **[Arbetsflödes-pluginet](/plugins/@nocobase/plugin-workflow/)**. Se till att det är aktiverat.

### 2. Lägg till en nod för HTTP-förfrågningar i arbetsflödet

1. Skapa eller redigera ett arbetsflöde.
2. Lägg till en **HTTP-förfrågan**-nod på önskad plats.

![HTTP Request - Add Node](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Konfigurera förfrågningsparametrarna.

### 3. Konfigurera förfrågningsparametrarna

![HTTP Request Node - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Grundläggande konfiguration

- **Förfrågnings-URL**: Mål-API-adress, stöder variabler.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Förfrågningsmetod**: Välj GET, POST, PUT, DELETE m.m.

- **Förfrågningshuvuden**: Konfigurera HTTP Headers.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Förfrågningsparametrar**:
  - **Query-parametrar**: URL-frågeparametrar.
  - **Body-parametrar**: Förfrågningskroppsdata (POST/PUT).

#### Avancerad konfiguration

- **Tidsgräns**: Ställ in tidsgräns för förfrågan (standard 30 sekunder).
- **Omprövning vid fel**: Konfigurera antal omprövningar och omprövningsintervall.
- **Ignorera fel**: Arbetsflödet fortsätter att köras även om förfrågan misslyckas.
- **Proxyinställningar**: Konfigurera HTTP-proxy (vid behov).

### 4. Använd svarsdata

Efter att noden för HTTP-förfrågningar har körts kan svarsdata användas i efterföljande noder:

- `{{$node.data.status}}`: HTTP-statuskod
- `{{$node.data.headers}}`: Svarshuvuden
- `{{$node.data.data}}`: Svarskroppsdata
- `{{$node.data.error}}`: Felmeddelande (om förfrågan misslyckades)

![HTTP Request Node - Response Usage](https://static-docs.nocobase.com/20240529110610.png)

## Exempelscenarier

### Exempel 1: Hämta väderinformation

```javascript
// Konfiguration
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Använd svar
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Exempel 2: Skicka WeCom-meddelande

```javascript
// Konfiguration
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
    "content": "Order {{$context.orderId}} har skickats"
  }
}
```

### Exempel 3: Fråga betalningsstatus

```javascript
// Konfiguration
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Villkorslogik
Om {{$node.data.data.status}} är lika med "paid"
  - Uppdatera orderstatus till "Betald"
  - Skicka meddelande om lyckad betalning
Annars om {{$node.data.data.status}} är lika med "pending"
  - Behåll orderstatus som "Väntar på betalning"
Annars
  - Logga betalningsfel
  - Meddela administratör för att hantera undantag
```

### Exempel 4: Synkronisera data till CRM

```javascript
// Konfiguration
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

## Autentiseringskonfiguration

### Grundläggande autentisering

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API-nyckel

```javascript
// I Header
Headers:
  X-API-Key: your-api-key

// Eller i Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Ni behöver först hämta en `access_token`, använd sedan:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Felhantering och felsökning

### Vanliga fel

1. **Anslutningstidsgräns**: Kontrollera nätverksanslutningen, öka tidsgränsen.
2. **401 Obehörig**: Kontrollera att autentiseringsuppgifterna är korrekta.
3. **404 Hittades inte**: Kontrollera att URL:en är korrekt.
4. **500 Serverfel**: Kontrollera API-leverantörens tjänstestatus.

### Felsökningstips

1. **Använd loggnoder**: Lägg till loggnoder före och efter HTTP-förfrågningar för att registrera förfrågnings- och svarsdata.

2. **Kontrollera körloggar**: Arbetsflödets körloggar innehåller detaljerad information om förfrågningar och svar.

3. **Testverktyg**: Testa API:et först med verktyg som Postman, cURL m.m.

4. **Felhantering**: Lägg till villkorslogik för att hantera olika svarsstatusar.

```javascript
Om {{$node.data.status}} >= 200 och {{$node.data.status}} < 300
  - Hantera framgångslogik
Annars
  - Hantera fellogik
  - Logga fel: {{$node.data.error}}
```

## Prestandaoptimering

### 1. Använd asynkron bearbetning

För förfrågningar som inte kräver omedelbara resultat, överväg att använda asynkrona arbetsflöden.

### 2. Konfigurera rimliga tidsgränser

Ställ in tidsgränser baserat på API:ets faktiska svarstider för att undvika onödigt långa väntetider.

### 3. Implementera cachningsstrategier

För data som inte ändras ofta (t.ex. konfigurationer, uppslagsverk), överväg att cacha svarsresultaten.

### 4. Batchbearbetning

Om ni behöver göra flera anrop till samma API, överväg att använda API:ets batchgränssnitt (om det stöds).

### 5. Omprövning vid fel

Konfigurera rimliga omprövningsstrategier, men undvik överdrivna omprövningar som kan leda till API-begränsningar.

## Bästa säkerhetspraxis

### 1. Skydda känslig information

- Exponera inte känslig information i URL:er.
- Använd HTTPS för krypterad överföring.
- Använd miljövariabler eller konfigurationshantering för känslig information som API-nycklar.

### 2. Validera svarsdata

```javascript
// Validera svarsstatus
if (![200, 201].includes($node.data.status)) {
  throw new Error('API-förfrågan misslyckades');
}

// Validera dataformat
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Ogiltig svarsdata');
}
```

### 3. Hastighetsbegränsning

Respektera tredjeparts-API:ers hastighetsbegränsningar för att undvika att bli blockerad.

### 4. Loggsanering

Vid loggning, se till att sanera känslig information (lösenord, nycklar m.m.).

## Jämförelse med Webhook

| Funktion | Nod för HTTP-förfrågan | Webhook-utlösare |
|---------|-----------------------|-----------------|
| Riktning | NocoBase anropar externt | Externt anropar NocoBase |
| Tidpunkt | Under arbetsflödeskörning | När extern händelse inträffar |
| Syfte | Hämta data, utlösa externa åtgärder | Ta emot externa meddelanden, händelser |
| Typiska scenarier | Anropa betalnings-API, fråga väder | Betalningsåterkoppling, meddelanden |

Dessa två funktioner kompletterar varandra för att bygga en komplett systemintegrationslösning.

## Relaterade resurser

- [Dokumentation för arbetsflödes-pluginet](/plugins/@nocobase/plugin-workflow/)
- [Arbetsflöde: Nod för HTTP-förfrågan](/workflow/nodes/request)
- [Arbetsflöde: Webhook-utlösare](/integration/workflow-webhook/)
- [API-nyckelautentisering](/integration/api-keys/)
- [API-dokumentations-plugin](/plugins/@nocobase/plugin-api-doc/)