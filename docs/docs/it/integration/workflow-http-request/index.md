:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Integrazione delle richieste HTTP nei flussi di lavoro

Attraverso il nodo di richiesta HTTP, i flussi di lavoro di NocoBase possono inviare proattivamente richieste a qualsiasi servizio HTTP, facilitando l'interazione di dati e l'integrazione aziendale con sistemi esterni.

## Panoramica

Il nodo di richiesta HTTP è un componente di integrazione fondamentale nei flussi di lavoro, che Le consente di chiamare API di terze parti, interfacce di servizi interni o altri servizi web durante l'esecuzione del flusso di lavoro per recuperare dati o attivare operazioni esterne.

## Scenari di utilizzo tipici

### Recupero dati

- **Query di dati di terze parti**: Recuperare dati in tempo reale da API meteorologiche, API di tassi di cambio, ecc.
- **Risoluzione indirizzi**: Chiamare API di servizi di mappatura per l'analisi degli indirizzi e la geocodifica.
- **Sincronizzazione dati aziendali**: Recuperare dati di clienti e ordini da sistemi CRM ed ERP.

### Trigger aziendali

- **Invio di messaggi**: Chiamare servizi SMS, email, WeCom per inviare notifiche.
- **Richieste di pagamento**: Avviare pagamenti, rimborsi con gateway di pagamento.
- **Elaborazione ordini**: Inviare lettere di vettura, interrogare lo stato della logistica con i sistemi di spedizione.

### Integrazione di sistema

- **Chiamate a microservizi**: Chiamare API di altri servizi in architetture a microservizi.
- **Reporting dati**: Segnalare dati aziendali a piattaforme di analisi, sistemi di monitoraggio.
- **Servizi di terze parti**: Integrare servizi AI, riconoscimento OCR, sintesi vocale.

### Automazione

- **Attività pianificate**: Chiamare periodicamente API esterne per sincronizzare i dati.
- **Risposta a eventi**: Chiamare automaticamente API esterne quando i dati cambiano.
- **Flussi di lavoro di approvazione**: Inviare richieste di approvazione tramite API di sistemi di approvazione.

## Caratteristiche

### Supporto HTTP completo

- Supporta tutti i metodi HTTP: GET, POST, PUT, PATCH, DELETE.
- Intestazioni di richiesta personalizzate (Headers).
- Diversi formati di dati: JSON, dati di modulo, XML.
- Vari tipi di parametri: parametri URL, parametri di percorso, corpo della richiesta.

### Elaborazione flessibile dei dati

- **Riferimenti a variabili**: Costruire dinamicamente richieste utilizzando variabili del flusso di lavoro.
- **Parsing della risposta**: Analizzare automaticamente le risposte JSON ed estrarre i dati.
- **Trasformazione dei dati**: Trasformare i formati dei dati di richiesta e risposta.
- **Gestione degli errori**: Configurare strategie di riprova, impostazioni di timeout, logica di gestione degli errori.

### Autenticazione di sicurezza

- **Basic Auth**: Autenticazione HTTP di base.
- **Bearer Token**: Autenticazione tramite token.
- **Chiave API**: Autenticazione tramite chiave API personalizzata.
- **Intestazioni personalizzate**: Supporto per qualsiasi metodo di autenticazione.

## Passaggi per l'utilizzo

### 1. Verificare che il plugin sia abilitato

Il nodo Richiesta HTTP è una funzionalità integrata del plugin flusso di lavoro. Si assicuri che il **[plugin flusso di lavoro](/plugins/@nocobase/plugin-workflow/)** sia abilitato.

### 2. Aggiungere un nodo Richiesta HTTP al flusso di lavoro

1. Creare o modificare un flusso di lavoro.
2. Aggiungere un nodo **Richiesta HTTP** nella posizione desiderata.

![HTTP Richiesta_Aggiungi](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Configurare i parametri della richiesta.

### 3. Configurare i parametri della richiesta

![Nodo Richiesta HTTP_Configurazione nodo](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Configurazione di base

- **URL della richiesta**: Indirizzo API di destinazione, supporta variabili.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Metodo della richiesta**: Selezionare GET, POST, PUT, DELETE, ecc.

- **Intestazioni della richiesta**: Configurare le intestazioni HTTP.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parametri della richiesta**:
  - **Parametri di Query**: Parametri di query URL.
  - **Parametri del Body**: Dati del corpo della richiesta (POST/PUT).

#### Configurazione avanzata

- **Timeout**: Impostare il timeout della richiesta (predefinito 30 secondi).
- **Riprova in caso di errore**: Configurare il numero di tentativi e l'intervallo.
- **Ignora errore**: Continuare il flusso di lavoro anche se la richiesta fallisce.
- **Impostazioni proxy**: Configurare il proxy HTTP (se necessario).

### 4. Utilizzare i dati della risposta

Dopo l'esecuzione del nodo Richiesta HTTP, i dati della risposta possono essere utilizzati nei nodi successivi:

- `{{$node.data.status}}`: Codice di stato HTTP.
- `{{$node.data.headers}}`: Intestazioni della risposta.
- `{{$node.data.data}}`: Dati del corpo della risposta.
- `{{$node.data.error}}`: Messaggio di errore (se la richiesta è fallita).

![Nodo Richiesta HTTP_Utilizzo risultato risposta](https://static-docs.nocobase.com/20240529110610.png)

## Scenari di esempio

### Esempio 1: Ottenere informazioni meteorologiche

```javascript
// Configurazione
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Utilizzo della risposta
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Esempio 2: Inviare un messaggio WeCom

```javascript
// Configurazione
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
    "content": "L'ordine {{$context.orderId}} è stato spedito"
  }
}
```

### Esempio 3: Interrogare lo stato del pagamento

```javascript
// Configurazione
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Logica condizionale
Se {{$node.data.data.status}} è uguale a "paid"
  - Aggiornare lo stato dell'ordine a "Pagato"
  - Inviare notifica di pagamento riuscito
Altrimenti, se {{$node.data.data.status}} è uguale a "pending"
  - Mantenere lo stato dell'ordine come "In attesa di pagamento"
Altrimenti
  - Registrare l'errore di pagamento
  - Notificare l'amministratore per gestire l'eccezione
```

### Esempio 4: Sincronizzare i dati con il CRM

```javascript
// Configurazione
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

## Configurazione dell'autenticazione

### Autenticazione Basic

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Token Bearer

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Chiave API

```javascript
// Nell'intestazione
Headers:
  X-API-Key: your-api-key

// O nella Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Prima ottenere l'`access_token`, quindi utilizzare:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Gestione degli errori e debug

### Errori comuni

1.  **Timeout di connessione**: Controllare la connessione di rete, aumentare il timeout.
2.  **401 Non autorizzato**: Verificare le credenziali di autenticazione.
3.  **404 Non trovato**: Controllare che l'URL sia corretto.
4.  **500 Errore del server**: Controllare lo stato del servizio del fornitore API.

### Suggerimenti per il debug

1.  **Utilizzare i nodi di log**: Aggiungere nodi di log prima e dopo le richieste HTTP per registrare i dati di richiesta e risposta.

2.  **Controllare i log di esecuzione**: I log di esecuzione del flusso di lavoro contengono informazioni dettagliate su richiesta e risposta.

3.  **Strumenti di test**: Testare prima l'API utilizzando Postman, cURL, ecc.

4.  **Gestione degli errori**: Aggiungere logica condizionale per gestire diversi stati di risposta.

```javascript
Se {{$node.data.status}} >= 200 e {{$node.data.status}} < 300
  - Gestire la logica di successo
Altrimenti
  - Gestire la logica di fallimento
  - Registrare l'errore: {{$node.data.error}}
```

## Suggerimenti per l'ottimizzazione delle prestazioni

### 1. Utilizzare l'elaborazione asincrona

Per le richieste che non richiedono risultati immediati, considerare l'utilizzo di flussi di lavoro asincroni.

### 2. Configurare timeout ragionevoli

Impostare i timeout in base ai tempi di risposta effettivi dell'API per evitare attese eccessive.

### 3. Implementare strategie di caching

Per i dati che cambiano raramente (configurazioni, dizionari), considerare la memorizzazione nella cache delle risposte.

### 4. Elaborazione batch

Se si effettuano più chiamate alla stessa API, considerare l'utilizzo di endpoint batch (se supportati).

### 5. Riprova in caso di errore

Configurare strategie di riprova ragionevoli, ma evitare riprove eccessive che potrebbero causare limitazioni di frequenza.

## Best practice di sicurezza

### 1. Proteggere le informazioni sensibili

- Non esporre informazioni sensibili negli URL.
- Utilizzare HTTPS per la trasmissione crittografata.
- Memorizzare chiavi API e dati sensibili in variabili d'ambiente o nella gestione della configurazione.

### 2. Validare i dati della risposta

```javascript
// Validare lo stato della risposta
if (![200, 201].includes($node.data.status)) {
  throw new Error('Richiesta API fallita');
}

// Validare il formato dei dati
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Dati di risposta non validi');
}
```

### 3. Limitazione della frequenza delle richieste

Rispettare i limiti di frequenza delle API di terze parti per evitare di essere bloccati.

### 4. Sanitizzazione dei log

Quando si registrano i log, prestare attenzione alla sanitizzazione delle informazioni sensibili (password, chiavi, ecc.).

## Confronto con Webhook

| Caratteristica | Nodo Richiesta HTTP | Trigger Webhook |
|----------------|---------------------|-----------------|
| Direzione      | NocoBase chiama esterno | Esterno chiama NocoBase |
| Tempistica     | Durante l'esecuzione del flusso di lavoro | Quando si verifica un evento esterno |
| Scopo          | Recuperare dati, attivare operazioni esterne | Ricevere notifiche, eventi esterni |
| Scenari tipici | Chiamare API di pagamento, interrogare il meteo | Callback di pagamento, notifiche di messaggi |

Queste due funzionalità si completano a vicenda per costruire una soluzione completa di integrazione di sistema.

## Risorse correlate

- [Documentazione del plugin flusso di lavoro](/plugins/@nocobase/plugin-workflow/)
- [Flusso di lavoro: Nodo Richiesta HTTP](/workflow/nodes/request)
- [Flusso di lavoro: Trigger Webhook](/integration/workflow-webhook/)
- [Autenticazione con chiavi API](/integration/api-keys/)
- [Plugin Documentazione API](/plugins/@nocobase/plugin-api-doc/)