:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Arbetsflödesintegration med Webhook

Med Webhook-utlösare kan NocoBase ta emot HTTP-anrop från tredjepartssystem och automatiskt trigga arbetsflöden, vilket möjliggör sömlös integration med externa system.

## Översikt

Webhooks är en "omvänd API"-mekanism som gör att externa system proaktivt kan skicka data till NocoBase när specifika händelser inträffar. Jämfört med aktiv polling erbjuder Webhooks en mer realtidsbaserad och effektiv integrationsmetod.

## Typiska användningsfall

### Inlämning av formulärdata

Externa enkätundersökningssystem, registreringsformulär och kundfeedbackformulär kan, efter att användaren skickat in data, skicka denna data till NocoBase via Webhook. Detta skapar automatiskt poster och triggar efterföljande bearbetningsprocesser (som att skicka bekräftelsemejl, tilldela uppgifter etc.).

### Meddelandenotifikationer

Händelser från tredjepartsmeddelandeplattformar (som WeCom, DingTalk, Slack), till exempel nya meddelanden, @-omnämnanden eller slutförda godkännanden, kan trigga automatiserade processer i NocoBase via Webhooks.

### Datasynkronisering

När data ändras i externa system (som CRM, ERP) kan Webhooks skicka uppdateringar till NocoBase i realtid för att upprätthålla datasynkronisering.

### Tredjepartsintegrationer

- **GitHub**: Kodpushar, skapande av pull-förfrågningar (PR) och andra händelser triggar automatiserade arbetsflöden.
- **GitLab**: Notifikationer om CI/CD-pipeline-status.
- **Formulärinlämningar**: Externa formulärsystem skickar data till NocoBase.
- **IoT-enheter**: Ändringar i enhetsstatus, rapportering av sensordata.

## Funktioner

### Flexibel utlösningsmekanism

- Stödjer HTTP-metoder som GET, POST, PUT, DELETE.
- Parsar automatiskt vanliga format som JSON och formulärdata.
- Konfigurerbar begäransvalidering för att säkerställa betrodda källor.

### Databehandlingskapacitet

- Mottagen data kan användas som variabler i arbetsflöden.
- Stödjer komplex datatransformation och bearbetningslogik.
- Kan kombineras med andra arbetsflödesnoder för att implementera komplex affärslogik.

### Säkerhetsgaranti

- Stödjer signaturverifiering för att förhindra förfalskade förfrågningar.
- Konfigurerbar IP-vitlista.
- HTTPS-krypterad överföring.

## Användningssteg

### 1. Installera plugin

Hitta och installera **[Arbetsflöde: Webhook-utlösare](/plugins/@nocobase/plugin-workflow-webhook/)** pluginet i pluginhanteraren.

> Observera: Detta är ett kommersiellt plugin som kräver separat köp eller prenumeration.

### 2. Skapa ett Webhook-arbetsflöde

1. Gå till sidan för **Arbetsflödeshantering**.
2. Klicka på **Skapa arbetsflöde**.
3. Välj **Webhook-utlösare** som utlösartyp.

![Skapa Webhook-arbetsflöde](https://static-docs.nocobase.com/20241210105049.png)

4. Konfigurera Webhook-parametrar

![Konfiguration av Webhook-utlösare](https://static-docs.nocobase.com/20241210105441.png)
   - **Begäranssökväg**: Anpassad Webhook-URL-sökväg.
   - **Begäransmetod**: Välj tillåtna HTTP-metoder (GET/POST/PUT/DELETE).
   - **Synkron/Asynkron**: Välj om ni vill vänta på att arbetsflödet slutförs innan resultat returneras.
   - **Validering**: Konfigurera signaturverifiering eller andra säkerhetsmekanismer.

### 3. Konfigurera arbetsflödesnoder

Lägg till arbetsflödesnoder baserat på era affärsbehov, till exempel:

- **Samlingsoperationer**: Skapa, uppdatera, radera poster.
- **Villkorslogik**: Förgrena baserat på mottagen data.
- **HTTP-förfrågan**: Anropa andra API:er.
- **Notifikationer**: Skicka e-post, SMS, etc.
- **Anpassad kod**: Utför JavaScript-kod.

### 4. Hämta Webhook-URL

Efter att arbetsflödet har skapats genererar systemet en unik Webhook-URL, vanligtvis i formatet:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Konfigurera i tredjepartssystem

Konfigurera den genererade Webhook-URL:en i tredjepartssystemet:

- Ställ in callback-adress för datainlämning i formulärsystem.
- Konfigurera Webhook i GitHub/GitLab.
- Konfigurera adress för händelsepush i WeCom/DingTalk.

### 6. Testa Webhook

Testa Webhooken med verktyg som Postman eller cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Åtkomst till begäransdata

I arbetsflöden kan ni komma åt Webhook-data via variabler:

- `{{$context.data}}`: Begärans brödtextdata
- `{{$context.headers}}`: Begärans rubrikinformation
- `{{$context.query}}`: URL-frågeparametrar
- `{{$context.params}}`: Sökvägsparametrar

![Parsning av begäransparametrar](https://static-docs.nocobase.com/20241210111155.png)

![Parsning av begärans brödtext](https://static-docs.nocobase.com/20241210112529.png)

## Svarskonfiguration

![Svarsinställningar](https://static-docs.nocobase.com/20241210114312.png)

### Synkront läge

Returnerar resultat efter att arbetsflödet har slutförts, konfigurerbart:

- **Svarsstatuskod**: 200, 201, etc.
- **Svarsdata**: Anpassad JSON-data som returneras.
- **Svarsrubriker**: Anpassade HTTP-rubriker.

### Asynkront läge

Returnerar omedelbar bekräftelse, arbetsflödet körs i bakgrunden. Lämpligt för:

- Långvariga arbetsflöden.
- Scenarier som inte kräver att exekveringsresultat returneras.
- Scenarier med hög samtidighet.

## Bästa säkerhetspraxis

### 1. Aktivera signaturverifiering

De flesta tredjepartstjänster stödjer signaturmekanismer:

```javascript
// Exempel: Verifiera GitHub Webhook-signatur
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Använd HTTPS

Se till att NocoBase är driftsatt med HTTPS för att skydda dataöverföringen.

### 3. Begränsa begäranskällor

Konfigurera en IP-vitlista för att endast tillåta begäranden från betrodda källor.

### 4. Datavalidering

Lägg till datavalideringslogik i arbetsflöden för att säkerställa att mottagen data har korrekt format och giltigt innehåll.

### 5. Granskningsloggning

Logga alla Webhook-förfrågningar för att underlätta spårning och felsökning.

## Felsökning

### Webhook triggas inte?

1. Kontrollera att Webhook-URL:en är korrekt.
2. Bekräfta att arbetsflödets status är "Aktiverat".
3. Granska tredjepartssystemets sändningsloggar.
4. Kontrollera brandväggs- och nätverkskonfigurationen.

### Hur felsöker man Webhooks?

1. Granska arbetsflödets exekveringsloggar för detaljerad information om förfrågningar och anropsresultat.
2. Använd Webhook-testverktyg (som Webhook.site) för att verifiera förfrågningarna.
3. Kontrollera viktig data och felmeddelanden i exekveringsloggarna.

### Hur hanterar man återförsök?

Vissa tredjepartstjänster försöker skicka igen om de inte får ett lyckat svar:

- Se till att arbetsflödet är idempotent.
- Använd unika identifierare för deduplicering.
- Logga behandlade begärans-ID:n.

### Tips för prestandaoptimering

- Använd asynkront läge för tidskrävande operationer.
- Lägg till villkorslogik för att filtrera bort onödiga förfrågningar.
- Överväg att använda meddelandeköer för scenarier med hög samtidighet.

## Exempelscenarier

### Bearbetning av externa formulärinlämningar

```javascript
// 1. Verifiera datakälla
// 2. Parsa formulärdata
const formData = context.data;

// 3. Skapa kundpost
// 4. Tilldela till relevant ansvarig
// 5. Skicka bekräftelsemejl till den som skickade in
if (formData.email) {
  // Skicka e-postnotifikation
}
```

### GitHub-kodpushnotifikation

```javascript
// 1. Parsa push-data
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Om det är huvudgrenen
if (branch === 'main') {
  // 3. Trigga driftsättningsprocess
  // 4. Meddela teammedlemmar
}
```

![Exempel på Webhook-arbetsflöde](https://static-docs.nocobase.com/20241210120655.png)

## Relaterade resurser

- [Dokumentation för arbetsflödesplugin](/plugins/@nocobase/plugin-workflow/)
- [Arbetsflöde: Webhook-utlösare](/workflow/triggers/webhook)
- [Arbetsflöde: HTTP-begäransnod](/integration/workflow-http-request/)
- [API-nyckelautentisering](/integration/api-keys/)