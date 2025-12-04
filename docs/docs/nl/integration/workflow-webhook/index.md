:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Workflow Webhook-integratie



# Workflow Webhook-integratie

Met Webhook-triggers kan NocoBase HTTP-aanroepen van externe systemen ontvangen en automatisch workflows activeren, wat een naadloze integratie met externe systemen mogelijk maakt.

## Overzicht

Een Webhook is een 'omgekeerd API'-mechanisme dat externe systemen in staat stelt om proactief gegevens naar NocoBase te sturen wanneer specifieke gebeurtenissen plaatsvinden. In vergelijking met actief pollen bieden Webhooks een meer real-time en efficiëntere manier van integratie.

## Typische gebruiksscenario's

### Gegevensindiening via formulieren

Externe enquêteformulieren, aanmeldingsformulieren en klantfeedbackformulieren kunnen, nadat een gebruiker gegevens heeft ingediend, deze via een Webhook naar NocoBase pushen. Dit creëert automatisch records en activeert vervolgprocessen (zoals het verzenden van bevestigingsmails of het toewijzen van taken).

### Berichtmeldingen

Gebeurtenissen van externe berichtenplatforms (zoals WeChat Work, DingTalk, Slack), zoals nieuwe berichten, @vermeldingen of voltooide goedkeuringen, kunnen via Webhooks geautomatiseerde processen in NocoBase activeren.

### Gegevenssynchronisatie

Wanneer gegevens in externe systemen (zoals CRM, ERP) wijzigen, worden deze via Webhooks in real-time naar NocoBase gepusht om de gegevens gesynchroniseerd te houden.

### Integratie met externe services

- **GitHub**: Code-pushes, het aanmaken van pull-requests en andere gebeurtenissen activeren automatiseringsworkflows.
- **GitLab**: Statusmeldingen van CI/CD-pipelines.
- **Formulierinzendingen**: Externe formuliersystemen dienen gegevens in bij NocoBase.
- **IoT-apparaten**: Wijzigingen in apparaatstatus, rapportage van sensorgegevens.

## Functionaliteiten

### Flexibel trigger-mechanisme

- Ondersteunt HTTP-methoden zoals GET, POST, PUT, DELETE.
- Parseert automatisch veelvoorkomende formaten zoals JSON en formuliergegevens.
- Configureerbare aanvraagvalidatie om betrouwbare bronnen te garanderen.

### Gegevensverwerkingsmogelijkheden

- Ontvangen gegevens kunnen als variabelen in workflows worden gebruikt.
- Ondersteunt complexe gegevenstransformatie- en verwerkingslogica.
- Kan worden gecombineerd met andere workflow-nodes om complexe bedrijfslogica te implementeren.

### Beveiligingsgaranties

- Ondersteunt handtekeningverificatie om vervalste aanvragen te voorkomen.
- Configureerbare IP-whitelist.
- HTTPS-gecodeerde overdracht.

## Gebruiksstappen

### 1. Installeer de plugin

Zoek en installeer de **[workflow: Webhook-trigger](/plugins/@nocobase/plugin-workflow-webhook/)** plugin in de plugin-manager.

> Let op: Dit is een commerciële plugin die apart moet worden aangeschaft of waarvoor een abonnement nodig is.

### 2. Maak een Webhook-workflow

1. Ga naar de pagina **Workflowbeheer**.
2. Klik op **Workflow aanmaken**.
3. Selecteer **Webhook-trigger** als triggertype.

![Create Webhook Workflow](https://static-docs.nocobase.com/20241210105049.png)

4. Configureer de Webhook-parameters.

![Webhook Trigger Configuration](https://static-docs.nocobase.com/20241210105441.png)
   - **Aanvraagpad**: Aangepast Webhook URL-pad.
   - **Aanvraagmethode**: Selecteer de toegestane HTTP-methoden (GET/POST/PUT/DELETE).
   - **Synchroon/Asynchroon**: Kies of u wilt wachten tot de workflow is voltooid voordat de resultaten worden geretourneerd.
   - **Validatiemethode**: Configureer handtekeningverificatie of andere beveiligingsmechanismen.

### 3. Configureer workflow-nodes

Voeg workflow-nodes toe op basis van uw bedrijfsbehoeften, zoals:

- **collectie-operaties**: Gegevens aanmaken, bijwerken, verwijderen.
- **Voorwaardelijke logica**: Vertak op basis van ontvangen gegevens.
- **HTTP-aanvraag**: Roep andere API's aan.
- **Meldingen**: Verzend e-mails, sms-berichten, etc.
- **Aangepaste code**: Voer JavaScript-code uit.

### 4. Verkrijg de Webhook URL

Nadat de workflow is aangemaakt, genereert het systeem een unieke Webhook URL, meestal in het formaat:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configureer in een extern systeem

Configureer de gegenereerde Webhook URL in het externe systeem:

- Stel het callback-adres voor gegevensindiening in formuliersystemen in.
- Configureer de Webhook in GitHub/GitLab.
- Configureer het adres voor gebeurtenismeldingen in WeChat Work/DingTalk.

### 6. Test de Webhook

Test de Webhook met tools zoals Postman of cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Toegang tot aanvraaggegevens

In workflows heeft u via variabelen toegang tot de gegevens die de Webhook ontvangt:

- `{{$context.data}}`: Gegevens uit de aanvraagbody.
- `{{$context.headers}}`: Aanvraagheaders.
- `{{$context.query}}`: URL-queryparameters.
- `{{$context.params}}`: Padparameters.

![Request Parameters Parsing](https://static-docs.nocobase.com/20241210111155.png)

![Request Body Parsing](https://static-docs.nocobase.com/20241210112529.png)

## Responsconfiguratie

![Response Settings](https://static-docs.nocobase.com/20241210114312.png)

### Synchrone modus

Retourneert resultaten nadat de workflow is voltooid, configureerbaar:

- **Responsstatuscode**: 200, 201, etc.
- **Responsgegevens**: Aangepaste JSON-respons.
- **Responsheaders**: Aangepaste HTTP-headers.

### Asynchrone modus

Retourneert onmiddellijk een bevestiging; de workflow wordt op de achtergrond uitgevoerd. Geschikt voor:

- Langlopende workflows.
- Scenario's die geen uitvoeringsresultaten vereisen.
- Scenario's met hoge gelijktijdigheid.

## Best practices voor beveiliging

### 1. Schakel handtekeningverificatie in

De meeste externe services ondersteunen handtekeningmechanismen:

```javascript
// Voorbeeld: Verifieer GitHub Webhook-handtekening
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

### 2. Gebruik HTTPS

Zorg ervoor dat NocoBase is geïmplementeerd in een HTTPS-omgeving om de veiligheid van gegevensoverdracht te beschermen.

### 3. Beperk aanvraagbronnen

Configureer een IP-whitelist om alleen aanvragen van vertrouwde bronnen toe te staan.

### 4. Gegevensvalidatie

Voeg gegevensvalidatielogica toe aan workflows om ervoor te zorgen dat de ontvangen gegevens het juiste formaat hebben en legitiem zijn.

### 5. Auditlogboek

Leg alle Webhook-aanvragen vast voor tracering en probleemoplossing.

## Veelgestelde vragen

### Webhook wordt niet geactiveerd?

1. Controleer of de Webhook URL correct is.
2. Controleer of de workflowstatus 'Ingeschakeld' is.
3. Controleer de verzendlogboeken van het externe systeem.
4. Controleer de firewall- en netwerkconfiguratie.

### Hoe debugt u Webhooks?

1. Bekijk de uitvoeringsrecords van de workflow voor gedetailleerde informatie over aanvragen en oproepresultaten.
2. Gebruik Webhook-testtools (zoals Webhook.site) om aanvragen te verifiëren.
3. Controleer belangrijke gegevens en foutmeldingen in de uitvoeringsrecords.

### Hoe gaat u om met herpogingen?

Sommige externe services proberen opnieuw te verzenden als ze geen succesvolle respons ontvangen:

- Zorg ervoor dat de workflow idempotent is.
- Gebruik unieke identificatiegegevens voor deduplicatie.
- Registreer de verwerkte aanvraag-ID's.

### Tips voor prestatieoptimalisatie

- Gebruik de asynchrone modus voor tijdrovende bewerkingen.
- Voeg voorwaardelijke logica toe om onnodige aanvragen te filteren.
- Overweeg het gebruik van message queues voor scenario's met hoge gelijktijdigheid.

## Voorbeeldscenario's

### Verwerking van externe formulierinzendingen

```javascript
// 1. Valideer de gegevensbron
// 2. Parseer de formuliergegevens
const formData = context.data;

// 3. Maak een klantrecord aan
// 4. Wijs toe aan de relevante verantwoordelijke
// 5. Stuur een bevestigingsmail naar de indiener
if (formData.email) {
  // Stuur een e-mailmelding
}
```

### GitHub code-push melding

```javascript
// 1. Parseer de push-gegevens
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Als het de hoofdtak is
if (branch === 'main') {
  // 3. Activeer het implementatieproces
  // 4. Breng teamleden op de hoogte
}
```

![Webhook Workflow Example](https://static-docs.nocobase.com/20241210120655.png)

## Gerelateerde bronnen

- [Documentatie workflow plugin](/plugins/@nocobase/plugin-workflow/)
- [Workflow: Webhook-trigger](/workflow/triggers/webhook)
- [Workflow: HTTP-aanvraag node](/integration/workflow-http-request/)
- [API-sleutelauthenticatie](/integration/api-keys/)