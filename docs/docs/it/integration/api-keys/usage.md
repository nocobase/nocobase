:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Utilizzare le chiavi API in NocoBase

Questa guida Le mostra come utilizzare le chiavi API in NocoBase per recuperare dati, attraverso un esempio pratico di "Cose da fare". Segua le istruzioni passo-passo qui sotto per comprendere il flusso di lavoro completo.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Comprendere le chiavi API

Una chiave API è un token di sicurezza utilizzato per autenticare le richieste API provenienti da utenti autorizzati. Funziona come una credenziale che convalida l'identità del richiedente quando accede al sistema NocoBase tramite applicazioni web, app mobili o script di backend.

Nell'intestazione della richiesta HTTP, troverà un formato simile a:

```txt
Authorization: Bearer {API 密钥}
```

Il prefisso "Bearer" indica che la stringa successiva è una chiave API autenticata, utilizzata per verificare i permessi del richiedente.

### Casi d'uso comuni

Le chiavi API sono tipicamente utilizzate nei seguenti scenari:

1.  **Accesso da applicazioni client**: I browser web e le app mobili utilizzano le chiavi API per autenticare l'identità dell'utente, garantendo che solo gli utenti autorizzati possano accedere ai dati.
2.  **Esecuzione di attività automatizzate**: I processi in background e le attività pianificate utilizzano le chiavi API per eseguire in modo sicuro aggiornamenti, sincronizzazione dei dati e operazioni di logging.
3.  **Sviluppo e test**: Gli sviluppatori utilizzano le chiavi API durante il debug e il testing per simulare richieste autenticate e verificare le risposte API.

Le chiavi API offrono molteplici vantaggi in termini di sicurezza: verifica dell'identità, monitoraggio dell'utilizzo, limitazione della frequenza delle richieste e prevenzione delle minacce, garantendo il funzionamento stabile e sicuro di NocoBase.

## 2 Creare chiavi API in NocoBase

### 2.1 Attivare il plugin Auth: Chiavi API

Si assicuri che il [plugin](/plugins/@nocobase/plugin-api-keys/) integrato "Auth: Chiavi API" sia attivato. Una volta abilitato, apparirà una nuova pagina di configurazione delle chiavi API nelle impostazioni di sistema.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Creare una collezione di test

A scopo dimostrativo, crei una collezione denominata `todos` con i seguenti campi:

-   `id`
-   `titolo`
-   `completato`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Aggiunga alcune registrazioni di esempio alla collezione:

-   mangiare
-   dormire
-   giocare

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Creare e assegnare un ruolo

Le chiavi API sono associate ai ruoli utente e il sistema determina i permessi di richiesta in base al ruolo assegnato. Prima di creare una chiave API, deve creare un ruolo e configurare i permessi appropriati. Crei un ruolo chiamato "Ruolo API Cose da fare" e gli conceda l'accesso completo alla collezione `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Se il "Ruolo API Cose da fare" non fosse disponibile durante la creazione di una chiave API, si assicuri che all'utente corrente sia stato assegnato questo ruolo:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Dopo l'assegnazione del ruolo, aggiorni la pagina e navighi alla pagina di gestione delle chiavi API. Clicchi su "Aggiungi chiave API" per verificare che il "Ruolo API Cose da fare" appaia nella selezione del ruolo.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Per un migliore controllo degli accessi, consideri di creare un account utente dedicato (ad esempio, "Utente API Cose da fare") specificamente per la gestione e il test delle chiavi API. Assegni il "Ruolo API Cose da fare" a questo utente.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Generare e salvare la chiave API

Dopo aver inviato il modulo, il sistema visualizzerà un messaggio di conferma con la chiave API appena generata. **Importante**: Copi e memorizzi questa chiave immediatamente in un luogo sicuro, poiché per motivi di sicurezza non verrà più visualizzata.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Esempio di chiave API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Note importanti

-   Il periodo di validità della chiave API è determinato dall'impostazione di scadenza configurata durante la creazione.
-   La generazione e la verifica della chiave API dipendono dalla variabile d'ambiente `APP_KEY`. **Non modifichi questa variabile**, poiché ciò invaliderebbe tutte le chiavi API esistenti nel sistema.

## 3 Testare l'autenticazione della chiave API

### 3.1 Utilizzare il plugin Documentazione API

Apra il [plugin Documentazione API](/plugins/@nocobase/plugin-api-doc/) per visualizzare i metodi di richiesta, gli URL, i parametri e le intestazioni per ogni endpoint API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Comprendere le operazioni CRUD di base

NocoBase fornisce API CRUD (Create, Read, Update, Delete - Creare, Leggere, Aggiornare, Eliminare) standard per la manipolazione dei dati:

-   **Query di elenco (API list):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Request Header:
    - Authorization: Bearer <API key>

    ```
-   **Creare record (API create):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Request Header:
    - Authorization: Bearer <API key>

    Request Body (in JSON format), for example:
        {
            "title": "123"
        }
    ```
-   **Aggiornare record (API update):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Request Header:
    - Authorization: Bearer <API key>

    Request Body (in JSON format), for example:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Eliminare record (API delete):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Request Header:
    - Authorization: Bearer <API key>
    ```

Dove:
-   `{baseURL}`: URL del Suo sistema NocoBase
-   `{collectionName}`: Il nome della collezione

Esempio: Per un'istanza locale su `localhost:13000` con una collezione denominata `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testare con Postman

Crei una richiesta GET in Postman con la seguente configurazione:
-   **URL**: L'endpoint della richiesta (ad esempio, `http://localhost:13000/api/todos:list`)
-   **Headers**: Aggiunga l'intestazione `Authorization` con il valore:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Risposta di successo:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Risposta di errore (chiave API non valida/scaduta):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Risoluzione dei problemi**: Se l'autenticazione fallisce, verifichi i permessi del ruolo, l'associazione della chiave API e il formato del token.

### 3.4 Esportare il codice della richiesta

Postman Le permette di esportare la richiesta in vari formati. Esempio di comando cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Utilizzare le chiavi API nel Blocco JS

NocoBase 2.0 supporta la scrittura di codice JavaScript nativo direttamente nelle pagine utilizzando i Blocchi JS. Questo esempio Le mostra come recuperare dati API esterni utilizzando le chiavi API.

### Creare un Blocco JS

Nella Sua pagina NocoBase, aggiunga un Blocco JS e utilizzi il seguente codice per recuperare i dati della lista delle cose da fare:

```javascript
// Recupera i dati delle cose da fare utilizzando la chiave API
async function fetchTodos() {
  try {
    // Mostra il messaggio di caricamento
    ctx.message.loading('正在获取数据...');

    // Carica la libreria axios per le richieste HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('加载 HTTP 库失败');
      return;
    }

    // Chiave API (sostituire con la Sua chiave API reale)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Effettua la richiesta API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Mostra i risultati
    console.log('待办事项列表:', response.data);
    ctx.message.success(`成功获取 ${response.data.data.length} 条数据`);

    // Qui può elaborare i dati
    // Ad esempio: visualizzare in una tabella, aggiornare i campi del modulo, ecc.

  } catch (error) {
    console.error('获取数据出错:', error);
    ctx.message.error('获取数据失败: ' + error.message);
  }
}

// Esegue la funzione
fetchTodos();
```

### Punti chiave

-   **ctx.requireAsync()**: Carica dinamicamente librerie esterne (come axios) per le richieste HTTP
-   **ctx.message**: Visualizza le notifiche utente (caricamento, successo, messaggi di errore)
-   **Autenticazione chiave API**: Passa la chiave API nell'intestazione `Authorization` con il prefisso `Bearer`
-   **Gestione della risposta**: Elabora i dati restituiti secondo necessità (visualizzazione, trasformazione, ecc.)

## 5 Riepilogo

Questa guida ha trattato il flusso di lavoro completo per l'utilizzo delle chiavi API in NocoBase:

1.  **Configurazione iniziale**: Attivare il plugin Chiavi API e creare una collezione di test
2.  **Configurazione**: Creare ruoli con permessi appropriati e generare chiavi API
3.  **Test**: Convalidare l'autenticazione della chiave API utilizzando Postman e il plugin Documentazione API
4.  **Integrazione**: Utilizzare le chiavi API nei Blocchi JS

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Risorse aggiuntive:**
-   [Documentazione del plugin Chiavi API](/plugins/@nocobase/plugin-api-keys/)
-   [Plugin Documentazione API](/plugins/@nocobase/plugin-api-doc/)