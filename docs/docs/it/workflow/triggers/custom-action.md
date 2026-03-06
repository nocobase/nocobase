---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/workflow/triggers/custom-action).
:::

# Evento azione personalizzata

## Introduzione

NocoBase dispone di operazioni sui dati integrate (aggiunta, eliminazione, modifica, query, ecc.). Quando queste operazioni non riescono a soddisfare esigenze aziendali complesse, Lei può utilizzare gli eventi di azione personalizzata nei flussi di lavoro e associare tale evento al pulsante "Attiva flusso di lavoro" di un blocco di pagina. Al clic dell'utente, verrà attivato un flusso di lavoro di azione personalizzata.

## Creazione di un flusso di lavoro

Durante la creazione di un flusso di lavoro, selezioni "Evento azione personalizzata":

![Crea flusso di lavoro "Evento azione personalizzata"](https://static-docs.nocobase.com/20240509091820.png)

## Configurazione del trigger

### Tipo di contesto

> v.1.6.0+

Il diverso tipo di contesto determina a quali pulsanti dei blocchi può essere associato il flusso di lavoro:

* Nessun contesto: ovvero un evento globale, può essere associato ai pulsanti di operazione nei pannelli operativi o nei blocchi dati;
* Singolo record: può essere associato ai pulsanti di operazione in blocchi dati come righe di tabelle, moduli, dettagli, ecc.;
* Record multipli: può essere associato ai pulsanti di operazione in blocco delle tabelle.

![Configurazione del trigger_Tipo di contesto](https://static-docs.nocobase.com/20250215135808.png)

### Collezione

Quando il tipo di contesto è Singolo record o Record multipli, è necessario selezionare la collezione a cui associare il modello di dati:

![Configurazione del trigger_Seleziona collezione](https://static-docs.nocobase.com/20250215135919.png)

### Dati di associazione da utilizzare

Se Lei ha bisogno di utilizzare i dati di associazione della riga di dati che attiva il trigger nel flusso di lavoro, può selezionare qui i campi di associazione profondi:

![Configurazione del trigger_Seleziona dati di associazione da utilizzare](https://static-docs.nocobase.com/20250215135955.png)

Questi campi verranno automaticamente precaricati nel contesto del flusso di lavoro dopo l'attivazione dell'evento, in modo da poter essere utilizzati nel flusso di lavoro.

## Configurazione dell'azione

A seconda del tipo di contesto configurato nel flusso di lavoro, la configurazione dei pulsanti di operazione nei diversi blocchi varia.

### Nessun contesto

> v1.6.0+

Sia nel pannello operativo che in altri blocchi dati, è possibile aggiungere il pulsante "Attiva flusso di lavoro":

![Aggiungi pulsante azione al blocco_Pannello operativo](https://static-docs.nocobase.com/20250215221738.png)

![Aggiungi pulsante azione al blocco_Calendario](https://static-docs.nocobase.com/20250215221942.png)

![Aggiungi pulsante azione al blocco_Diagramma di Gantt](https://static-docs.nocobase.com/20250215221810.png)

Dopo aver aggiunto il pulsante, lo associ al flusso di lavoro senza contesto creato in precedenza; prendendo come esempio il pulsante nel pannello operativo:

![Associa flusso di lavoro al pulsante_Pannello operativo](https://static-docs.nocobase.com/20250215222120.png)

![Seleziona flusso di lavoro da associare_Nessun contesto](https://static-docs.nocobase.com/20250215222234.png)

### Singolo record

In qualsiasi blocco dati, è possibile aggiungere il pulsante "Attiva flusso di lavoro" nella barra delle operazioni per i singoli record, come moduli, righe di tabelle, dettagli, ecc.:

![Aggiungi pulsante azione al blocco_Modulo](https://static-docs.nocobase.com/20240509165428.png)

![Aggiungi pulsante azione al blocco_Riga della tabella](https://static-docs.nocobase.com/20240509165340.png)

![Aggiungi pulsante azione al blocco_Dettagli](https://static-docs.nocobase.com/20240509165545.png)

Dopo aver aggiunto il pulsante, lo associ al flusso di lavoro creato in precedenza:

![Associa flusso di lavoro al pulsante](https://static-docs.nocobase.com/20240509165631.png)

![Seleziona flusso di lavoro da associare](https://static-docs.nocobase.com/20240509165658.png)

Successivamente, facendo clic su questo pulsante si attiverà l'evento di azione personalizzata:

![Risultato del clic sul pulsante](https://static-docs.nocobase.com/20240509170453.png)

### Record multipli

> v1.6.0+

Nella barra delle operazioni di un blocco tabella, quando si aggiunge il pulsante "Attiva flusso di lavoro", è presente un'opzione aggiuntiva per selezionare se il tipo di contesto è "Nessun contesto" o "Record multipli":

![Aggiungi pulsante azione al blocco_Tabella](https://static-docs.nocobase.com/20250215222507.png)

Quando si seleziona "Nessun contesto", si tratta di un evento globale e può essere associato solo a flussi di lavoro di tipo senza contesto.

Quando si seleziona "Record multipli", è possibile associare flussi di lavoro di tipo record multipli, utilizzabili per operazioni in blocco dopo la selezione di più dati (attualmente supportato solo dalle tabelle). In questo caso, l'intervallo di flussi di lavoro selezionabili è limitato a quelli configurati per corrispondere alla collezione del blocco dati corrente:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Al momento dell'attivazione tramite clic sul pulsante, è necessario aver selezionato alcune righe di dati nella tabella, altrimenti il flusso di lavoro non verrà attivato:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Esempio

Ad esempio, abbiamo una collezione "Campioni". Per i campioni con stato "Raccolto", è necessario fornire un'operazione di "Invia per ispezione". L'invio per ispezione verificherà prima le informazioni di base del campione, quindi genererà un dato "Record di ispezione" e infine modificherà lo stato del campione in "Inviato". Questa serie di processi non può essere completata con un semplice clic sui pulsanti predefiniti; in questo caso, è possibile utilizzare gli eventi di azione personalizzata.

Per prima cosa, crei una collezione "Campioni" e una collezione "Record di ispezione", inserendo i dati di test di base per la collezione campioni:

![Esempio_Collezione Campioni](https://static-docs.nocobase.com/20240509172234.png)

Quindi, crei un flusso di lavoro "Evento azione personalizzata". Se Lei ha bisogno di un feedback tempestivo dal processo operativo, può scegliere la modalità sincrona (in modalità sincrona non è possibile utilizzare nodi di tipo asincrono come l'elaborazione manuale):

![Esempio_Crea flusso di lavoro](https://static-docs.nocobase.com/20240509173106.png)

Nella configurazione del trigger, selezioni "Campioni" come collezione:

![Esempio_Configurazione del trigger](https://static-docs.nocobase.com/20240509173148.png)

Organizzi la logica nel processo in base ai requisiti aziendali. Ad esempio, consenta l'invio per ispezione solo quando il parametro indicatore è maggiore di `90`, altrimenti mostri un avviso relativo al problema:

![Esempio_Arrangiamento della logica di business](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Suggerimento}
Il nodo "[Messaggio di risposta](../nodes/response-message.md)" può essere utilizzato negli eventi di azione personalizzata sincroni per restituire informazioni di avviso al client. Non può essere utilizzato in modalità asincrona.
:::

Dopo aver configurato e abilitato il flusso di lavoro, torni all'interfaccia della tabella e aggiunga il pulsante "Attiva flusso di lavoro" nella colonna delle operazioni della tabella:

![Esempio_Aggiungi pulsante azione](https://static-docs.nocobase.com/20240509174525.png)

Quindi, nel menu di configurazione del pulsante, scelga di associare il flusso di lavoro aprendo la finestra pop-up di configurazione:

![Esempio_Apri pop-up di associazione flusso di lavoro](https://static-docs.nocobase.com/20240509174633.png)

Aggiunga il flusso di lavoro abilitato in precedenza:

![Esempio_Seleziona flusso di lavoro](https://static-docs.nocobase.com/20240509174723.png)

Dopo l'invio, modifichi il testo del pulsante con il nome dell'operazione, ad esempio "Invia per ispezione", e il processo di configurazione è completato.

Durante l'uso, selezioni una riga di dati campione nella tabella e clicchi sul pulsante "Invia per ispezione" per attivare l'evento di azione personalizzata. Come per la logica organizzata in precedenza, se il parametro indicatore del campione è inferiore a 90, dopo il clic apparirà il seguente avviso:

![Esempio_L'indicatore non soddisfa i criteri di invio](https://static-docs.nocobase.com/20240509175026.png)

Se il parametro indicatore è maggiore di 90, il processo verrà eseguito normalmente, generando il dato "Record di ispezione" e modificando lo stato del campione in "Inviato":

![Esempio_Invio riuscito](https://static-docs.nocobase.com/20240509175247.png)

A questo punto, un semplice evento di azione personalizzata è completato. Allo stesso modo, per processi aziendali con operazioni complesse, come l'elaborazione degli ordini o l'invio di rapporti, è possibile utilizzare gli eventi di azione personalizzata per l'implementazione.

## Chiamata esterna

L'attivazione degli eventi di azione personalizzata non è limitata alle operazioni dell'interfaccia utente, ma può essere attivata anche tramite chiamate API HTTP. In particolare, l'evento di azione personalizzata fornisce un nuovo tipo di operazione per tutte le operazioni sulle collezioni per attivare i flussi di lavoro: `trigger`, che può essere chiamato installando l'API di azione standard di NocoBase.

:::info{title="Suggerimento"}
Poiché anche le chiamate esterne devono basarsi sull'identità dell'utente, quando si effettua una chiamata tramite API HTTP, questa è identica alle richieste inviate dall'interfaccia normale e deve fornire le informazioni di autenticazione, inclusi l'intestazione `Authorization` o il parametro `token` (ottenuto al login) e l'intestazione `X-Role` (nome del ruolo corrente dell'utente).
:::

### Nessun contesto

I flussi di lavoro senza contesto devono essere attivati per la risorsa workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Singolo record

Un flusso di lavoro attivato da un pulsante, come nell'esempio, può essere chiamato in questo modo:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Poiché questa operazione è rivolta a un singolo dato, quando si chiama su dati esistenti, è necessario specificare l'ID della riga di dati, sostituendo la parte `<:id>` nell'URL.

Se la chiamata avviene per un modulo (come l'aggiunta o l'aggiornamento), per il modulo di aggiunta dati non è necessario passare l'ID, ma è necessario passare i dati inviati come contesto di esecuzione:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Per i moduli di aggiornamento, è necessario passare contemporaneamente l'ID della riga di dati e i dati aggiornati:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Se vengono passati contemporaneamente l'ID e i dati, verrà prima caricata la riga di dati corrispondente all'ID, quindi verranno utilizzate le proprietà dell'oggetto dati passato per sovrascrivere la riga di dati originale e ottenere il contesto finale dei dati del trigger.

:::warning{title="Attenzione"}
Se vengono passati dati di associazione, anch'essi verranno sovrascritti. Sia particolarmente cauto nella gestione dei dati in ingresso quando è configurato il precaricamento dei dati di associazione, per evitare che i dati di associazione vengano sovrascritti in modo imprevisto.
:::

Inoltre, il parametro URL `triggerWorkflows` è la chiave del flusso di lavoro; più flussi di lavoro sono separati da virgole. Questa chiave può essere ottenuta passando il mouse sul nome del flusso di lavoro nella parte superiore della tela del flusso di lavoro:

![Flusso di lavoro_Chiave_Metodo di visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo una chiamata riuscita, verrà attivato l'evento di azione personalizzata per la collezione `samples` corrispondente.

:::info{title="Suggerimento"}
Quando si attiva un evento tramite una chiamata API HTTP, è necessario prestare attenzione anche allo stato di attivazione del flusso di lavoro e alla corrispondenza della configurazione della collezione; in caso contrario, la chiamata potrebbe non riuscire o potrebbero verificarsi errori.
:::

### Record multipli

Simile alla modalità di chiamata per il singolo record, ma i dati passati richiedono solo i parametri delle chiavi primarie multiple (`filterByTk[]`) e non è necessario passare la parte data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Questa chiamata attiverà l'evento di azione personalizzata in modalità record multipli e utilizzerà i dati con ID 1 e 2 come dati nel contesto del trigger.