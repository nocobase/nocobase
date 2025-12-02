:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Integrazione di flussi di lavoro con Webhook

Grazie ai trigger Webhook, NocoBase può ricevere chiamate HTTP da sistemi di terze parti e attivare automaticamente i flussi di lavoro, consentendo un'integrazione senza interruzioni con sistemi esterni.

## Panoramica

Un Webhook è un meccanismo di "API inversa" che permette ai sistemi esterni di inviare proattivamente dati a NocoBase quando si verificano eventi specifici. Rispetto al polling attivo, i Webhook offrono un approccio di integrazione più in tempo reale ed efficiente.

## Scenari di utilizzo tipici

### Invio di dati da moduli

Sistemi esterni di sondaggi, moduli di registrazione e moduli di feedback dei clienti possono inviare dati a NocoBase tramite Webhook dopo l'invio da parte dell'utente, creando automaticamente record e attivando processi successivi (come l'invio di email di conferma, l'assegnazione di compiti, ecc.).

### Notifiche di messaggi

Eventi provenienti da piattaforme di messaggistica di terze parti (come WeCom, DingTalk, Slack), ad esempio nuovi messaggi, menzioni o completamento di approvazioni, possono attivare processi automatizzati in NocoBase tramite Webhook.

### Sincronizzazione dei dati

Quando i dati cambiano in sistemi esterni (come CRM, ERP), i Webhook inviano aggiornamenti a NocoBase in tempo reale per mantenere la sincronizzazione dei dati.

### Integrazione di servizi di terze parti

- **GitHub**: Eventi come push di codice o creazione di PR attivano flussi di lavoro di automazione.
- **GitLab**: Notifiche sullo stato delle pipeline CI/CD.
- **Invii di moduli**: Sistemi di moduli esterni inviano dati a NocoBase.
- **Dispositivi IoT**: Cambiamenti di stato dei dispositivi, segnalazione di dati da sensori.

## Caratteristiche

### Meccanismo di attivazione flessibile

- Supporta i metodi HTTP GET, POST, PUT, DELETE.
- Analizza automaticamente JSON, dati di moduli e altri formati comuni.
- Validazione delle richieste configurabile per garantire fonti affidabili.

### Capacità di elaborazione dei dati

- I dati ricevuti possono essere utilizzati come variabili nei flussi di lavoro.
- Supporta logiche complesse di trasformazione ed elaborazione dei dati.
- Può essere combinato con altri nodi del flusso di lavoro per implementare logiche di business complesse.

### Garanzia di sicurezza

- Supporta la verifica della firma per prevenire richieste contraffatte.
- Lista bianca IP configurabile.
- Trasmissione crittografata HTTPS.

## Passaggi per l'utilizzo

### 1. Installare il plugin

Trovi e installi il **[plugin Flusso di lavoro: Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** nel gestore dei plugin.

> Nota: Questo è un plugin commerciale che richiede un acquisto o un abbonamento separato.

### 2. Creare un flusso di lavoro Webhook

1. Acceda alla pagina **Gestione flussi di lavoro**.
2. Clicchi su **Crea flusso di lavoro**.
3. Selezioni **Trigger Webhook** come tipo di attivazione.

![Creare un flusso di lavoro Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Configuri i parametri del Webhook.

![Configurazione del trigger Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Percorso richiesta**: Percorso URL Webhook personalizzato.
   - **Metodo richiesta**: Selezioni i metodi HTTP consentiti (GET/POST/PUT/DELETE).
   - **Sincrono/Asincrono**: Scelga se attendere il completamento dell'esecuzione del flusso di lavoro prima di restituire i risultati.
   - **Validazione**: Configuri la verifica della firma o altri meccanismi di sicurezza.

### 3. Configurare i nodi del flusso di lavoro

Aggiunga i nodi del flusso di lavoro in base alle esigenze aziendali, ad esempio:
- **Operazioni su collezioni**: Creare, aggiornare, eliminare record.
- **Logica condizionale**: Creare ramificazioni in base ai dati ricevuti.
- **Richiesta HTTP**: Chiamare altre API.
- **Notifiche**: Inviare email, SMS, ecc.
- **Codice personalizzato**: Eseguire codice JavaScript.

### 4. Ottenere l'URL del Webhook

Dopo la creazione del flusso di lavoro, il sistema genererà un URL Webhook unico, solitamente nel formato:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configurare nel sistema di terze parti

Configuri l'URL del Webhook generato nel sistema di terze parti:
- Imposti l'indirizzo di callback per l'invio dei dati nei sistemi di moduli.
- Configuri il Webhook in GitHub/GitLab.
- Configuri l'indirizzo di push degli eventi in WeCom/DingTalk.

### 6. Testare il Webhook

Testi il Webhook utilizzando strumenti come Postman o cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Accesso ai dati della richiesta

Nei flussi di lavoro, può accedere ai dati ricevuti dal Webhook tramite variabili:
- `{{$context.data}}`: Dati del corpo della richiesta
- `{{$context.headers}}`: Informazioni dell'intestazione della richiesta
- `{{$context.query}}`: Parametri di query dell'URL
- `{{$context.params}}`: Parametri del percorso

![Analisi dei parametri della richiesta](https://static-docs.nocobase.com/20241210111155.png)

![Analisi del corpo della richiesta](https://static-docs.nocobase.com/20241210112529.png)

## Configurazione della risposta

![Impostazioni di risposta](https://static-docs.nocobase.com/20241210114312.png)

### Modalità sincrona

Restituisce i risultati dopo il completamento dell'esecuzione del flusso di lavoro, configurabile:
- **Codice di stato della risposta**: 200, 201, ecc.
- **Dati di risposta**: Dati JSON di ritorno personalizzati.
- **Intestazioni di risposta**: Intestazioni HTTP personalizzate.

### Modalità asincrona

Restituisce una conferma immediata, il flusso di lavoro viene eseguito in background. Adatto per:
- Flussi di lavoro a lunga esecuzione.
- Scenari che non richiedono la restituzione dei risultati dell'esecuzione.
- Scenari ad alta concorrenza.

## Best practice per la sicurezza

### 1. Abilitare la verifica della firma

La maggior parte dei servizi di terze parti supporta meccanismi di firma:

```javascript
// Esempio: Verifica della firma del Webhook di GitHub
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

### 2. Utilizzare HTTPS

Si assicuri che NocoBase sia distribuito in un ambiente HTTPS per proteggere la trasmissione dei dati.

### 3. Limitare le fonti delle richieste

Configuri una lista bianca IP per consentire solo richieste da fonti affidabili.

### 4. Validazione dei dati

Aggiunga una logica di validazione dei dati nei flussi di lavoro per garantire che i dati ricevuti siano nel formato corretto e con contenuto valido.

### 5. Registrazione degli audit (Logging)

Registri tutte le richieste Webhook per facilitare il tracciamento e la risoluzione dei problemi.

## Risoluzione dei problemi

### Il Webhook non si attiva?

1. Verifichi che l'URL del Webhook sia corretto.
2. Confermi che lo stato del flusso di lavoro sia "Abilitato".
3. Controlli i log di invio del sistema di terze parti.
4. Esamini la configurazione del firewall e della rete.

### Come eseguire il debug dei Webhook?

1. Controlli i record di esecuzione del flusso di lavoro per informazioni dettagliate sulle richieste e sui risultati delle chiamate.
2. Utilizzi strumenti di test Webhook (come Webhook.site) per verificare le richieste.
3. Esamini i dati chiave e i messaggi di errore nei record di esecuzione.

### Come gestire i tentativi?

Alcuni servizi di terze parti ritentano l'invio se non ricevono una risposta positiva:
- Si assicuri che il flusso di lavoro sia idempotente.
- Utilizzi identificatori unici per la deduplicazione.
- Registri gli ID delle richieste elaborate.

### Suggerimenti per l'ottimizzazione delle prestazioni

- Utilizzi la modalità asincrona per le operazioni che richiedono molto tempo.
- Aggiunga una logica condizionale per filtrare le richieste che non necessitano di elaborazione.
- Consideri l'utilizzo di code di messaggi per scenari ad alta concorrenza.

## Scenari di esempio

### Elaborazione dell'invio di moduli esterni

```javascript
// 1. Verificare la fonte dei dati
// 2. Analizzare i dati del modulo
const formData = context.data;

// 3. Creare un record cliente
// 4. Assegnare al responsabile pertinente
// 5. Inviare un'email di conferma al mittente
if (formData.email) {
  // Inviare notifica email
}
```

### Notifica di push del codice GitHub

```javascript
// 1. Analizzare i dati del push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Se è il branch principale
if (branch === 'main') {
  // 3. Attivare il processo di deployment
  // 4. Notificare i membri del team
}
```

![Esempio di flusso di lavoro Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Risorse correlate

- [Documentazione del plugin Flusso di lavoro](/plugins/@nocobase/plugin-workflow/)
- [Flusso di lavoro: Trigger Webhook](/workflow/triggers/webhook)
- [Flusso di lavoro: Nodo richiesta HTTP](/integration/workflow-http-request/)
- [Autenticazione con chiavi API](/integration/api-keys/)