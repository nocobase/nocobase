---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/workflow/triggers/approval).
:::

# Approvazione

## Introduzione

L'approvazione è una forma di processo dedicata all'avvio e all'elaborazione manuale per decidere lo stato dei dati correlati. Viene solitamente utilizzata per l'automazione d'ufficio o altre attività decisionali umane; ad esempio, è possibile creare e gestire processi manuali per scenari come "richieste di ferie", "approvazione rimborsi spese" e "approvazione acquisto materie prime".

Il plugin di approvazione fornisce un tipo di flusso di lavoro dedicato (trigger) "Approvazione (evento)" e un nodo "Approvazione" specifico per questo processo. In combinazione con le collezioni personalizzate e i blocchi personalizzati di NocoBase, consente di creare e gestire in modo rapido e flessibile vari scenari di approvazione.

## Creare un flusso di lavoro

Durante la creazione di un flusso di lavoro, selezioni il tipo "Approvazione" per creare un flusso di lavoro di approvazione:

![Trigger di approvazione_Creare un flusso di lavoro di approvazione](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Successivamente, nell'interfaccia di configurazione del flusso di lavoro, clicchi sul trigger per aprire la finestra di dialogo ed eseguire ulteriori configurazioni.

## Configurazione del trigger

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Collegare una collezione

Il plugin di approvazione di NocoBase si basa su un design flessibile e può essere utilizzato con qualsiasi collezione personalizzata. Ciò significa che la configurazione dell'approvazione non richiede la riconfigurazione del modello dati, ma riutilizza direttamente le collezioni già create. Pertanto, dopo essere entrato nella configurazione del trigger, deve innanzitutto selezionare una collezione per decidere su quali dati della collezione il processo eseguirà l'approvazione:

![Trigger di approvazione_Configurazione del trigger_Selezionare la collezione](https://static-docs.nocobase.com/20251226103223.png)

### Metodo di attivazione

Quando si avvia un'approvazione per i dati aziendali, è possibile scegliere tra i seguenti due metodi di attivazione:

*   **Prima del salvataggio dei dati**

    Avvia l'approvazione prima che i dati inviati vengano salvati; è adatto per scenari in cui i dati devono essere salvati solo dopo l'approvazione. In questa modalità, i dati al momento dell'avvio dell'approvazione sono solo dati temporanei e verranno salvati ufficialmente nella collezione corrispondente solo dopo l'approvazione.

*   **Dopo il salvataggio dei dati**

    Avvia l'approvazione dopo che i dati inviati sono stati salvati; è adatto per scenari in cui i dati possono essere salvati prima dell'approvazione. In questa modalità, i dati al momento dell'avvio dell'approvazione sono già stati salvati nella collezione corrispondente e anche le modifiche apportate durante il processo di approvazione verranno salvate.

### Posizione di avvio dell'approvazione

È possibile scegliere la posizione nel sistema da cui avviare l'approvazione:

*   **Avvia solo nei blocchi dati**

    È possibile collegare l'azione di qualsiasi blocco modulo di questa tabella al flusso di lavoro per avviare l'approvazione, e gestire o tracciare il processo di approvazione nel blocco di approvazione del singolo record; solitamente adatto per i dati aziendali.

*   **Avvia sia nei blocchi dati che nel Centro attività**

    Oltre ai blocchi dati, è possibile avviare e gestire le approvazioni nel Centro attività globale; solitamente adatto per i dati amministrativi.

### Chi può avviare l'approvazione

È possibile configurare i permessi in base all'ambito dell'utente per decidere quali utenti possono avviare l'approvazione:

*   **Tutti gli utenti**

    Tutti gli utenti nel sistema possono avviare l'approvazione.

*   **Solo gli utenti selezionati**

    Consente l'avvio dell'approvazione solo agli utenti nell'ambito specificato; è possibile selezionarne più di uno.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configurazione dell'interfaccia del modulo dell'iniziatore

Infine, è necessario configurare l'interfaccia del modulo dell'iniziatore, che verrà utilizzata per le operazioni di invio dal blocco del Centro approvazioni e per il reinvio dopo il ritiro da parte dell'utente. Clicchi sul pulsante di configurazione per aprire la finestra di dialogo:

![Trigger di approvazione_Configurazione del trigger_Modulo dell'iniziatore](https://static-docs.nocobase.com/20251226130239.png)

Può aggiungere all'interfaccia dell'iniziatore un modulo di compilazione basato sulla collezione collegata, oppure un testo descrittivo (Markdown) per suggerimenti e guida. L'aggiunta del modulo è obbligatoria, altrimenti l'iniziatore non potrà operare una volta entrato in questa interfaccia.

Dopo aver aggiunto un blocco modulo, come in una normale interfaccia di configurazione del modulo, può aggiungere i componenti di campo della collezione corrispondente e disporli liberamente per organizzare il contenuto da compilare:

![Trigger di approvazione_Configurazione del trigger_Modulo dell'iniziatore_Configurazione campi](https://static-docs.nocobase.com/20251226130339.png)

A differenza del pulsante di invio diretto, può anche aggiungere un pulsante di azione "Salva bozza" per supportare i processi di archiviazione temporanea:

![Trigger di approvazione_Configurazione del trigger_Modulo dell'iniziatore_Configurazione azioni_Salva](https://static-docs.nocobase.com/20251226130512.png)

Se un flusso di lavoro di approvazione consente all'iniziatore di ritirare la richiesta, è necessario abilitare il pulsante "Ritiro" nella configurazione dell'interfaccia dell'iniziatore:

![Trigger di approvazione_Configurazione del trigger_Consenti ritiro](https://static-docs.nocobase.com/20251226130637.png)

Una volta abilitato, l'approvazione avviata da questo flusso può essere ritirata dall'iniziatore prima che qualsiasi approvatore la elabori; tuttavia, dopo che qualsiasi approvatore configurato nei nodi di approvazione successivi l'ha elaborata, non sarà più possibile ritirarla.

:::info{title=Suggerimento}
Dopo aver abilitato o eliminato il pulsante di ritiro, è necessario cliccare su salva e invia nella finestra di dialogo di configurazione del trigger affinché le modifiche abbiano effetto.
:::

### Scheda "Le mie richieste" <Badge>2.0+</Badge>

Può essere utilizzata per configurare le schede delle attività nell'elenco "Le mie richieste" del Centro attività.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Nella scheda è possibile configurare liberamente i campi aziendali che si desidera visualizzare (esclusi i campi di relazione) o le informazioni relative all'approvazione.

Dopo la creazione della richiesta di approvazione, sarà possibile vedere la scheda dell'attività personalizzata nell'elenco del Centro attività:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Modalità di visualizzazione dei record nel flusso

*   **Snapshot**

    Lo stato del record visto dal richiedente e dagli approvatori al momento dell'accesso; dopo l'invio, vedranno solo i record da loro modificati e non vedranno gli aggiornamenti apportati successivamente da altri.

*   **Ultimo**

    Il richiedente e gli approvatori vedono sempre l'ultima versione del record durante l'intero processo, indipendentemente dallo stato del record prima della loro operazione. Al termine del processo, vedranno la versione finale del record.

## Nodo di approvazione

Nel flusso di lavoro di approvazione, è necessario utilizzare il nodo dedicato "Approvazione" per configurare la logica operativa (approvazione, rifiuto o restituzione) che gli approvatori utilizzeranno per gestire l'approvazione avviata. Il nodo "Approvazione" può essere utilizzato solo nei flussi di lavoro di approvazione. Consulti [Nodo di approvazione](../nodes/approval.md) per i dettagli.

:::info{title=Suggerimento}
Se un flusso di lavoro di approvazione non contiene alcun nodo "Approvazione", il flusso verrà approvato automaticamente.
:::

## Configurazione dell'avvio dell'approvazione

Dopo aver configurato e abilitato un flusso di lavoro di approvazione, è possibile collegare tale flusso al pulsante di invio del modulo della collezione corrispondente, in modo che l'utente possa avviare l'approvazione al momento dell'invio:

![Avviare approvazione_Collegare flusso di lavoro](https://static-docs.nocobase.com/20251226110710.png)

Successivamente, l'invio di tale modulo da parte dell'utente attiverà il flusso di lavoro di approvazione corrispondente. I dati inviati, oltre ad essere salvati nella collezione pertinente, verranno anche "fotografati" (snapshot) nel flusso di approvazione per la consultazione da parte del personale di approvazione successivo.

:::info{title=Suggerimento}
Il pulsante per avviare l'approvazione supporta attualmente solo il pulsante "Invia" (o "Salva") nei moduli di creazione o aggiornamento; non supporta il pulsante "Attiva flusso di lavoro" (tale pulsante può essere collegato solo a "Eventi di azione personalizzati").
:::

## Centro attività

Il Centro attività fornisce un punto di ingresso unificato per consentire agli utenti di visualizzare e gestire le attività in sospeso. Le approvazioni avviate dall'utente corrente e le attività in sospeso sono accessibili tramite il Centro attività nella barra degli strumenti superiore, e i diversi tipi di attività possono essere visualizzati tramite la navigazione categorizzata a sinistra.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Le mie richieste

#### Visualizzare le approvazioni inviate

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Avviare direttamente una nuova approvazione

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Le mie attività

#### Elenco attività

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Dettagli attività

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniziatore

#### Avviare da collezione

Per avviare da un blocco dati, è possibile effettuare una chiamata come questa (usando come esempio il pulsante di creazione della collezione `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Il parametro URL `triggerWorkflows` è la chiave del flusso di lavoro; più flussi di lavoro sono separati da virgole. Questa chiave può essere ottenuta passando il mouse sul nome del flusso di lavoro nella parte superiore della tela del flusso di lavoro:

![Flusso di lavoro_chiave_metodo di visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo una chiamata riuscita, verrà attivato il flusso di lavoro di approvazione per la collezione `posts` corrispondente.

:::info{title="Suggerimento"}
Poiché anche le chiamate esterne devono basarsi sull'identità dell'utente, quando si effettua una chiamata tramite HTTP API, proprio come le richieste inviate dall'interfaccia normale, è necessario fornire le informazioni di autenticazione, inclusi l'header `Authorization` o il parametro `token` (il token ottenuto al login), e l'header `X-Role` (il nome del ruolo corrente dell'utente).
:::

Se è necessario attivare un evento per dati correlati uno-a-uno in questa azione (il uno-a-molti non è ancora supportato), può utilizzare `!` nel parametro per specificare i dati del trigger per il campo di relazione:

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

Dopo una chiamata riuscita, verrà attivato l'evento di approvazione per la collezione `categories` corrispondente.

:::info{title="Suggerimento"}
Quando si attiva un evento post-azione tramite HTTP API, è necessario prestare attenzione anche allo stato di abilitazione del flusso di lavoro e alla corrispondenza della configurazione della collezione; in caso contrario, la chiamata potrebbe non riuscire o potrebbe verificarsi un errore.
:::

#### Avviare dal Centro approvazioni

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

* `collectionName`: Il nome della collezione di destinazione per l'avvio dell'approvazione. Obbligatorio.
* `workflowId`: L'ID del flusso di lavoro utilizzato per avviare l'approvazione. Obbligatorio.
* `data`: I campi del record della collezione creati all'avvio dell'approvazione. Obbligatorio.
* `status`: Lo stato del record creato all'avvio dell'approvazione. Obbligatorio. I valori possibili includono:
  * `0`: Bozza, indica il salvataggio senza invio per l'approvazione.
  * `2`: Invia per approvazione, indica che l'iniziatore invia la richiesta di approvazione, entrando nel processo di approvazione.

#### Salva e invia

Quando un'approvazione avviata (o ritirata) si trova in stato di bozza, può salvarla o inviarla nuovamente tramite la seguente interfaccia:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Ottenere l'elenco delle approvazioni inviate

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Ritiro

L'iniziatore può ritirare un record attualmente in approvazione tramite la seguente interfaccia:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametri**

* `<approval id>`: L'ID del record di approvazione da ritirare. Obbligatorio.

### Approvatore

Dopo che il flusso di lavoro di approvazione entra in un nodo di approvazione, viene creata un'attività in sospeso per l'approvatore corrente. L'approvatore può completare l'attività di approvazione tramite l'interfaccia o richiamando l'HTTP API.

#### Ottenere i record di elaborazione dell'approvazione

Le attività in sospeso sono i record di elaborazione dell'approvazione. Può ottenere tutti i record di elaborazione dell'approvazione dell'utente corrente tramite la seguente interfaccia:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Qui, `approvalRecords` è una risorsa di collezione, quindi può utilizzare condizioni di query comuni come `filter`, `sort`, `pageSize` e `page`.

#### Ottenere un singolo record di elaborazione dell'approvazione

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Approva e rifiuta

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

* `<record id>`: L'ID del record da elaborare. Obbligatorio.
* `status`: Lo stato dell'elaborazione dell'approvazione. `2` per "Approva", `-1` per "Rifiuta". Obbligatorio.
* `comment`: Note per l'elaborazione dell'approvazione. Opzionale.
* `data`: Modifiche al record della collezione nel nodo di approvazione corrente dopo l'approvazione. Opzionale (efficace solo in caso di approvazione).

#### Restituisci <Badge>v1.9.0+</Badge>

Prima della versione v1.9.0, la restituzione utilizzava la stessa interfaccia di "Approva" e "Rifiuta", con `"status": 1` che rappresentava una restituzione.

A partire dalla versione v1.9.0, la restituzione ha un'interfaccia separata:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametri**

* `<record id>`: L'ID del record da elaborare. Obbligatorio.
* `returnToNodeKey`: La chiave del nodo di destinazione a cui tornare. Opzionale. Quando nel nodo è configurato un intervallo di nodi a cui è possibile tornare, questo parametro può essere utilizzato per specificare a quale nodo tornare. Se non configurato, questo parametro non deve essere passato e, per impostazione predefinita, si tornerà al punto di partenza affinché l'iniziatore possa inviare nuovamente.

#### Delega

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametri**

* `<record id>`: L'ID del record da elaborare. Obbligatorio.
* `assignee`: L'ID dell'utente a cui delegare. Obbligatorio.

#### Aggiungi firmatario

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametri**

* `<record id>`: L'ID del record da elaborare. Obbligatorio.
* `assignees`: Un elenco di ID utente da aggiungere come firmatari. Obbligatorio.
* `order`: L'ordine del firmatario aggiunto. `-1` indica "prima di me", `1` indica "dopo di me".