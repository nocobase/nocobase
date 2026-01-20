---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Approvazione

## Introduzione

L'approvazione è una forma di processo pensata specificamente per attività avviate e gestite manualmente, con l'obiettivo di determinare lo stato dei dati correlati. Viene tipicamente impiegata per la gestione dei processi nell'automazione d'ufficio o in altre attività che richiedono decisioni umane. Ad esempio, permette di creare e gestire **flussi di lavoro** manuali per scenari come le "richieste di ferie", le "approvazioni di rimborsi spese" e le "approvazioni per l'acquisto di materie prime".

Il **plugin** di Approvazione offre un **tipo di flusso di lavoro** (trigger) dedicato, "Approvazione (evento)", e un **nodo** "Approvazione" specifico per questo processo. In combinazione con le **collezioni** e i blocchi personalizzati unici di NocoBase, consente di creare e gestire in modo rapido e flessibile diversi scenari di approvazione.

## Creare un Flusso di Lavoro

Quando crea un **flusso di lavoro**, selezioni il tipo "Approvazione" per creare un **flusso di lavoro** di approvazione:

![Trigger di Approvazione_Creare un Flusso di Lavoro di Approvazione](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Successivamente, nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul trigger per aprire una finestra di dialogo e procedere con ulteriori configurazioni.

## Configurazione del Trigger

### Collegare una Collezione

Il **plugin** di Approvazione di NocoBase è progettato per la massima flessibilità e può essere utilizzato con qualsiasi **collezione** personalizzata. Ciò significa che la configurazione dell'approvazione non richiede di riconfigurare il modello di **dati**, ma riutilizza direttamente una **collezione** esistente. Pertanto, dopo essere entrato nella configurazione del trigger, deve prima selezionare una **collezione** per determinare quale **collezione** di **dati** attiverà questo **flusso di lavoro** al momento della creazione o dell'aggiornamento dei **dati**:

![Trigger di Approvazione_Configurazione del Trigger_Selezionare la Collezione](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Successivamente, nel modulo per la creazione (o modifica) dei **dati** della **collezione** corrispondente, colleghi questo **flusso di lavoro** al pulsante di invio:

![Avviare Approvazione_Collegare il Flusso di Lavoro](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Dopodiché, l'invio di questo modulo da parte di un utente attiverà il **flusso di lavoro** di approvazione corrispondente. I **dati** inviati non solo vengono salvati nella **collezione** pertinente, ma vengono anche "fotografati" (snapshot) all'interno del **flusso di lavoro** di approvazione per essere consultati dagli approvatori successivi.

### Ritiro

Se un **flusso di lavoro** di approvazione consente all'iniziatore di ritirare la richiesta, è necessario abilitare il pulsante "Ritiro" nella configurazione dell'interfaccia dell'iniziatore:

![Trigger di Approvazione_Configurazione del Trigger_Consenti Ritiro](https://static-docs.nocobase.com/20251029232544.png)

Una volta abilitata, un'approvazione avviata da questo **flusso di lavoro** può essere ritirata dall'iniziatore prima che qualsiasi approvatore la elabori. Tuttavia, dopo che un approvatore in un **nodo** di approvazione successivo l'ha elaborata, non potrà più essere ritirata.

:::info{title=Nota}
Dopo aver abilitato o eliminato il pulsante di ritiro, è necessario cliccare su "Salva" e "Invia" nella finestra di dialogo di configurazione del trigger affinché le modifiche abbiano effetto.
:::

### Configurazione dell'Interfaccia del Modulo dell'Iniziatore

Infine, deve configurare l'interfaccia del modulo dell'iniziatore. Questa interfaccia verrà utilizzata per le operazioni di invio quando si avvia dal blocco del centro approvazioni e quando si riavvia dopo un ritiro. Clicchi sul pulsante di configurazione per aprire la finestra di dialogo:

![Trigger di Approvazione_Configurazione del Trigger_Modulo dell'Iniziatore](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Può aggiungere all'interfaccia dell'iniziatore un modulo di compilazione basato sulla **collezione** collegata, oppure un testo descrittivo (Markdown) per suggerimenti e guida. Il modulo è obbligatorio; in caso contrario, l'iniziatore non sarà in grado di eseguire alcuna operazione una volta entrato in questa interfaccia.

Dopo aver aggiunto un blocco modulo, proprio come in una normale interfaccia di configurazione del modulo, può aggiungere i componenti di campo dalla **collezione** corrispondente e disporli a piacimento per organizzare il contenuto da compilare nel modulo:

![Trigger di Approvazione_Configurazione del Trigger_Modulo dell'Iniziatore_Configurazione Campi](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Oltre al pulsante di invio diretto, può anche aggiungere un pulsante di azione "Salva come bozza" per supportare un processo di archiviazione temporanea:

![Trigger di Approvazione_Configurazione del Trigger_Modulo dell'Iniziatore_Configurazione Azioni](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Nodo di Approvazione

In un **flusso di lavoro** di approvazione, è necessario utilizzare il **nodo** "Approvazione" dedicato per configurare la logica operativa che gli approvatori useranno per elaborare (approvare, rifiutare o restituire) l'approvazione avviata. Il **nodo** "Approvazione" può essere utilizzato solo nei **flussi di lavoro** di approvazione. Per maggiori dettagli, consulti [Nodo di Approvazione](../nodes/approval.md).

## Configurare l'Avvio dell'Approvazione

Dopo aver configurato e abilitato un **flusso di lavoro** di approvazione, può collegarlo al pulsante di invio del modulo della **collezione** corrispondente, consentendo agli utenti di avviare un'approvazione al momento dell'invio:

![Avviare Approvazione_Collegare il Flusso di Lavoro](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Dopo aver collegato il **flusso di lavoro**, quando un utente invia il modulo corrente, viene avviata un'approvazione.

:::info{title=Nota}
Attualmente, il pulsante per avviare un'approvazione supporta solo il pulsante "Invia" (o "Salva") nei moduli di creazione o aggiornamento. Non supporta il pulsante "Invia al flusso di lavoro" (che può essere collegato solo a un "Evento dopo l'azione").
:::

## Centro Attività

Il Centro Attività offre un punto di accesso unificato per consentire agli utenti di visualizzare ed elaborare le proprie attività in sospeso. Le approvazioni avviate dall'utente corrente e le attività in attesa possono essere consultate tramite il Centro Attività nella barra degli strumenti superiore, e i diversi tipi di attività in sospeso possono essere visualizzati tramite la navigazione categorizzata sulla sinistra.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Le Mie Richieste

#### Visualizzare le Approvazioni Inviate

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Avviare Direttamente una Nuova Approvazione

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Le Mie Attività in Sospeso

#### Elenco Attività in Sospeso

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Dettagli Attività in Sospeso

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniziatore

#### Avviare da Collezione

Per avviare da un blocco **dati**, può effettuare una chiamata come questa (usando come esempio il pulsante di creazione della **collezione** `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Qui, il parametro URL `triggerWorkflows` è la chiave del **flusso di lavoro**; più chiavi di **flusso di lavoro** sono separate da virgole. Questa chiave può essere ottenuta passando il mouse sopra il nome del **flusso di lavoro** nella parte superiore della tela del **flusso di lavoro**:

![Flusso di Lavoro_Chiave_Metodo di Visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo una chiamata riuscita, verrà attivato il **flusso di lavoro** di approvazione per la **collezione** `posts` corrispondente.

:::info{title="Nota"}
Poiché anche le chiamate esterne devono basarsi sull'identità dell'utente, quando si effettua una chiamata tramite HTTP API, proprio come le richieste inviate dall'interfaccia normale, è necessario fornire le informazioni di autenticazione, inclusi l'header `Authorization` o il parametro `token` (il token ottenuto al login), e l'header `X-Role` (il nome del ruolo corrente dell'utente).
:::

Se è necessario attivare un evento per **dati** correlati uno-a-uno in questa azione (il uno-a-molti non è ancora supportato), può utilizzare `!` nel parametro per specificare i **dati** del trigger per il campo di associazione:

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

Dopo una chiamata riuscita, verrà attivato l'evento di approvazione per la **collezione** `categories` corrispondente.

:::info{title="Nota"}
Quando si attiva un evento post-azione tramite HTTP API, è necessario prestare attenzione anche allo stato di abilitazione del **flusso di lavoro** e alla corrispondenza della configurazione della **collezione**; in caso contrario, la chiamata potrebbe non riuscire o potrebbe verificarsi un errore.
:::

#### Avviare dal Centro Approvazioni

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametri**

*   `collectionName`: Il nome della **collezione** di destinazione per l'avvio dell'approvazione. Obbligatorio.
*   `workflowId`: L'ID del **flusso di lavoro** utilizzato per avviare l'approvazione. Obbligatorio.
*   `data`: I campi del record della **collezione** creati all'avvio dell'approvazione. Obbligatorio.
*   `status`: Lo stato del record creato all'avvio dell'approvazione. Obbligatorio. I valori possibili includono:
    *   `0`: Bozza, indica il salvataggio senza invio per l'approvazione.
    *   `1`: Invia per approvazione, indica che l'iniziatore invia la richiesta di approvazione, entrando nel processo di approvazione.

#### Salva e Invia

Quando un'approvazione avviata (o ritirata) si trova in stato di bozza, può salvarla o inviarla nuovamente tramite la seguente API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Ottenere l'Elenco delle Approvazioni Inviate

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Ritiro

L'iniziatore può ritirare un record attualmente in approvazione tramite la seguente API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametri**

*   `<approval id>`: L'ID del record di approvazione da ritirare. Obbligatorio.

### Approvatore

Dopo che il **flusso di lavoro** di approvazione entra in un **nodo** di approvazione, viene creata un'attività in sospeso per l'approvatore corrente. L'approvatore può completare l'attività di approvazione tramite l'interfaccia o richiamando l'HTTP API.

#### Ottenere i Record di Approvazione

Le attività in sospeso sono i record di approvazione. Può ottenere tutti i record di approvazione dell'utente corrente tramite la seguente API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Qui, `approvalRecords` è una risorsa di **collezione**, quindi può utilizzare condizioni di query comuni come `filter`, `sort`, `pageSize` e `page`.

#### Ottenere un Singolo Record di Approvazione

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Approva e Rifiuta

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametri**

*   `<record id>`: L'ID del record da approvare. Obbligatorio.
*   `status`: Lo stato del processo di approvazione. `2` per "Approva", `-1` per "Rifiuta". Obbligatorio.
*   `comment`: Note per il processo di approvazione. Opzionale.
*   `data`: Modifiche al record della **collezione** nel **nodo** di approvazione corrente dopo l'approvazione. Opzionale (efficace solo in caso di approvazione).

#### Restituisci <Badge>v1.9.0+</Badge>

Prima della versione v1.9.0, la restituzione utilizzava la stessa API di "Approva" e "Rifiuta", con `"status": 1` che rappresentava una restituzione.

A partire dalla versione v1.9.0, la restituzione ha un'API separata:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametri**

*   `<record id>`: L'ID del record da approvare. Obbligatorio.
*   `returnToNodeKey`: La chiave del **nodo** di destinazione a cui tornare. Opzionale. Quando nel **nodo** è configurato un intervallo di **nodi** a cui è possibile tornare, questo parametro può essere utilizzato per specificare a quale **nodo** tornare. Se non configurato, questo parametro non deve essere passato e, per impostazione predefinita, si tornerà al punto di partenza affinché l'iniziatore possa inviare nuovamente.

#### Delega

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametri**

*   `<record id>`: L'ID del record da approvare. Obbligatorio.
*   `assignee`: L'ID dell'utente a cui delegare. Obbligatorio.

#### Aggiungi Firmatario

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametri**

*   `<record id>`: L'ID del record da approvare. Obbligatorio.
*   `assignees`: Un elenco di ID utente da aggiungere come firmatari. Obbligatorio.
*   `order`: L'ordine del firmatario aggiunto. `-1` indica "prima di me", `1` indica "dopo di me".