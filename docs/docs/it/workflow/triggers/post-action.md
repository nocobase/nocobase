---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Evento Post-Azione

## Introduzione

Tutte le modifiche ai dati generate dagli utenti nel sistema avvengono solitamente tramite un'azione, che si manifesta tipicamente con il clic su un pulsante. Questo pulsante può essere quello di invio in un modulo o un pulsante di azione in un blocco di dati. L'evento post-azione serve ad associare i flussi di lavoro pertinenti alle azioni di questi pulsanti, in modo da attivare un processo specifico una volta che l'operazione dell'utente è stata completata con successo.

Ad esempio, quando si aggiungono o si aggiornano dati, gli utenti possono configurare l'opzione "Associa flusso di lavoro" per un pulsante. Una volta completata l'azione, il flusso di lavoro associato verrà attivato.

A livello di implementazione, poiché la gestione degli eventi post-azione si trova nello strato middleware (il middleware di Koa), anche le chiamate API HTTP a NocoBase possono attivare gli eventi post-azione definiti.

## Installazione

È un plugin integrato, non richiede installazione.

## Configurazione del Trigger

### Creazione del flusso di lavoro

Quando crea un flusso di lavoro, selezioni "Evento Post-Azione" come tipo:

![Creazione del flusso di lavoro_Trigger evento post-azione](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Modalità di Esecuzione

Per gli eventi post-azione, durante la creazione può anche scegliere la modalità di esecuzione tra "Sincrona" o "Asincrona":

![Creazione del flusso di lavoro_Selezione sincrona o asincrona](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Se il processo deve essere eseguito e restituito immediatamente dopo l'azione dell'utente, può utilizzare la modalità sincrona; altrimenti, l'impostazione predefinita è la modalità asincrona. In modalità asincrona, l'azione viene completata immediatamente dopo l'attivazione del flusso di lavoro, e il flusso di lavoro verrà eseguito in sequenza nella coda in background dell'applicazione.

### Configurazione della collezione

Acceda alla tela del flusso di lavoro, clicchi sul trigger per aprire la finestra di configurazione e selezioni innanzitutto la collezione da associare:

![Configurazione del flusso di lavoro_Selezione della collezione](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Selezione della Modalità di Attivazione

Quindi selezioni la modalità di attivazione, che può essere locale o globale:

![Configurazione del flusso di lavoro_Selezione della modalità di attivazione](https://static-docs.nocobase.com/317809c48b2f2a38aedc7d08abdadc.png)

Dove:

*   La modalità locale si attiva solo sui pulsanti di azione a cui è associato questo flusso di lavoro. Cliccando su pulsanti non associati, il flusso di lavoro non verrà attivato. Può decidere se associare questo flusso di lavoro in base alla necessità che moduli con scopi diversi attivino o meno lo stesso processo.
*   La modalità globale si attiva su tutti i pulsanti di azione configurati della collezione, indipendentemente dal modulo da cui provengono, e non è necessario associare il flusso di lavoro corrispondente.

In modalità locale, i pulsanti di azione che attualmente supportano l'associazione sono i seguenti:

*   Pulsanti "Invia" e "Salva" nel modulo di aggiunta.
*   Pulsanti "Invia" e "Salva" nel modulo di aggiornamento.
*   Pulsante "Aggiorna dati" nelle righe di dati (tabella, elenco, Kanban, ecc.).

### Selezione del Tipo di Azione

Se ha scelto la modalità globale, deve anche selezionare il tipo di azione. Attualmente sono supportate le azioni "Crea dati" e "Aggiorna dati". Entrambe le azioni attivano il flusso di lavoro dopo il successo dell'operazione.

### Selezione dei Dati di Relazione Precaricati

Se necessita di utilizzare i dati associati ai dati di attivazione nei processi successivi, può selezionare i campi di relazione da precaricare:

![Configurazione del flusso di lavoro_Precaricamento relazione](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Dopo l'attivazione, potrà utilizzare direttamente questi dati associati nel processo.

## Configurazione dell'Azione

Per le azioni in modalità di attivazione locale, una volta configurato il flusso di lavoro, deve tornare all'interfaccia utente e associare il flusso di lavoro al pulsante di azione del modulo nel blocco di dati corrispondente.

I flussi di lavoro configurati per il pulsante "Invia" (incluso il pulsante "Salva dati") verranno attivati dopo che l'utente avrà inviato il modulo corrispondente e l'operazione sui dati sarà stata completata.

![Evento Post-Azione_Pulsante Invia](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Selezioni "Associa flusso di lavoro" dal menu di configurazione del pulsante per aprire la finestra di configurazione dell'associazione. Qui, può configurare un numero qualsiasi di flussi di lavoro da attivare; se non ne configura nessuno, non sarà necessaria alcuna attivazione. Per ogni flusso di lavoro, deve prima specificare se i dati di attivazione provengono dall'intero modulo o da un campo di relazione specifico al suo interno. Successivamente, in base alla collezione corrispondente al modello di dati selezionato, scelga il flusso di lavoro del modulo che è stato configurato per corrispondere a quel modello di collezione.

![Evento Post-Azione_Configurazione associazione flusso di lavoro_Selezione contesto](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Evento Post-Azione_Configurazione associazione flusso di lavoro_Selezione flusso di lavoro](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Nota"}
Il flusso di lavoro deve essere abilitato prima di poter essere selezionato nell'interfaccia sopra.
:::

## Esempio

Qui viene presentata una dimostrazione utilizzando l'azione di creazione.

Supponiamo uno scenario di "Richiesta di Rimborso". Dopo che un dipendente ha inviato una richiesta di rimborso spese, dobbiamo eseguire una revisione automatica dell'importo e una revisione manuale per gli importi che superano il limite. Solo le richieste che superano la revisione vengono approvate e successivamente passate all'ufficio finanziario per l'elaborazione.

Innanzitutto, possiamo creare una collezione "Rimborso Spese" con i seguenti campi:

- Nome Progetto: Testo su Riga Singola
- Richiedente: Molti-a-Uno (Utente)
- Importo: Numero
- Stato: Selezione Singola ("Approvato", "Elaborato")

Successivamente, crei un flusso di lavoro di tipo "Evento Post-Azione" e configuri il modello della collezione nel trigger come la collezione "Rimborso Spese":

![Esempio_Configurazione trigger_Selezione collezione](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Dopo aver impostato il flusso di lavoro come abilitato, torneremo in seguito per configurare i nodi di elaborazione specifici del processo.

Quindi, creiamo un blocco tabella per la collezione "Rimborso Spese" sull'interfaccia, aggiungiamo un pulsante "Aggiungi" alla barra degli strumenti e configuriamo i campi del modulo corrispondenti. Nelle opzioni di configurazione del pulsante di azione "Invia" del modulo, apriamo la finestra di dialogo di configurazione "Associa flusso di lavoro", selezioniamo tutti i dati del modulo come contesto e il flusso di lavoro che abbiamo creato in precedenza:

![Esempio_Configurazione pulsante modulo_Associazione flusso di lavoro](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Una volta completata la configurazione del modulo, torniamo all'orchestrazione logica del flusso di lavoro. Ad esempio, se l'importo è superiore a 500, richiediamo una revisione manuale da parte di un amministratore; altrimenti, l'approvazione è diretta. Solo dopo l'approvazione viene creato un record di rimborso, che viene poi ulteriormente elaborato dal reparto finanziario (omesso).

![Esempio_Flusso di elaborazione](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Ignorando l'elaborazione successiva da parte del reparto finanziario, la configurazione del processo di richiesta di rimborso è ora completa. Quando un dipendente compila e invia una richiesta di rimborso, verrà attivato il flusso di lavoro corrispondente. Se l'importo della spesa è inferiore a 500, verrà creato automaticamente un record in attesa di ulteriore elaborazione da parte del reparto finanziario. Altrimenti, verrà esaminato da un supervisore e, dopo l'approvazione, verrà creato un record e consegnato al reparto finanziario.

Il processo in questo esempio può anche essere configurato su un normale pulsante "Invia". Può decidere se creare prima un record e poi eseguire i processi successivi, in base allo scenario aziendale specifico.

## Chiamata Esterna

L'attivazione degli eventi post-azione non è limitata alle operazioni dell'interfaccia utente; può anche essere attivata tramite chiamate API HTTP.

:::info{title="Nota"}
Quando attiva un evento post-azione tramite una chiamata API HTTP, deve anche prestare attenzione allo stato di abilitazione del flusso di lavoro e alla corrispondenza della configurazione della collezione, altrimenti la chiamata potrebbe non avere successo o potrebbe verificarsi un errore.
:::

Per i flussi di lavoro associati localmente a un pulsante di azione, può richiamarli in questo modo (utilizzando come esempio il pulsante di creazione della collezione `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Dove il parametro URL `triggerWorkflows` è la chiave del flusso di lavoro, con più flussi di lavoro separati da virgole. Questa chiave può essere ottenuta passando il mouse sul nome del flusso di lavoro nella parte superiore della tela del flusso di lavoro:

![Flusso di lavoro_Chiave_Metodo di visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo il successo della chiamata di cui sopra, verrà attivato l'evento post-azione della collezione `posts` corrispondente.

:::info{title="Nota"}
Poiché anche le chiamate esterne devono basarsi sull'identità dell'utente, quando si effettua una chiamata tramite API HTTP, proprio come le richieste inviate dall'interfaccia normale, è necessario fornire le informazioni di autenticazione, inclusi l'header di richiesta `Authorization` o il parametro `token` (il token ottenuto al login) e l'header di richiesta `X-Role` (il nome del ruolo corrente dell'utente).
:::

Se necessita di attivare un evento per dati di relazione uno-a-uno in questa azione (uno-a-molti non è ancora supportato), può utilizzare `!` nel parametro per specificare i dati di attivazione del campo di relazione:

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

Dopo il successo della chiamata di cui sopra, verrà attivato l'evento post-azione della collezione `categories` corrispondente.

:::info{title="Nota"}
Se l'evento è configurato in modalità globale, non è necessario utilizzare il parametro URL `triggerWorkflows` per specificare il flusso di lavoro corrispondente. Sarà sufficiente richiamare l'azione della collezione corrispondente per attivarlo.
:::

## Domande Frequenti

### Differenza rispetto all'Evento Pre-Azione

*   Evento Pre-Azione: Si attiva prima dell'esecuzione di un'operazione (come aggiunta, aggiornamento, ecc.). Prima dell'esecuzione dell'operazione, i dati richiesti possono essere convalidati o elaborati nel flusso di lavoro. Se il flusso di lavoro viene terminato (la richiesta viene intercettata), l'operazione (aggiunta, aggiornamento, ecc.) non verrà eseguita.
*   Evento Post-Azione: Si attiva dopo il successo di un'operazione dell'utente. A questo punto, i dati sono stati inviati con successo e salvati nel database, e i processi correlati possono continuare ad essere elaborati in base al risultato positivo.

Come mostrato nella figura seguente:

![Ordine di esecuzione dell'azione](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Differenza rispetto all'Evento della Collezione

Gli eventi post-azione e gli eventi della collezione presentano delle somiglianze, in quanto entrambi sono processi attivati dopo modifiche ai dati. Tuttavia, i loro livelli di implementazione sono diversi: gli eventi post-azione operano a livello API, mentre gli eventi della collezione riguardano le modifiche ai dati all'interno della collezione stessa.

Gli eventi della collezione sono più vicini allo strato sottostante del sistema. In alcuni casi, una modifica ai dati causata da un evento può attivare un altro evento, creando una reazione a catena. In particolare, quando i dati in alcune collezioni associate cambiano anche durante l'operazione della collezione corrente, possono essere attivati anche gli eventi relativi alla collezione associata.

L'attivazione degli eventi della collezione non include informazioni relative all'utente. Al contrario, gli eventi post-azione sono più vicini all'utente finale e sono il risultato delle sue azioni. Il contesto del flusso di lavoro includerà anche informazioni relative all'utente, rendendoli adatti per la gestione dei processi legati alle operazioni dell'utente. Nella futura progettazione di NocoBase, potrebbero essere estesi ulteriori eventi post-azione utilizzabili per l'attivazione, quindi **è più consigliabile utilizzare gli eventi post-azione** per gestire i processi in cui le modifiche ai dati sono causate dalle azioni dell'utente.

Un'altra differenza è che gli eventi post-azione possono essere associati localmente a specifici pulsanti di modulo. Se ci sono più moduli, l'invio di alcuni moduli può attivare l'evento mentre altri no. Gli eventi della collezione, d'altra parte, riguardano le modifiche ai dati dell'intera collezione e non possono essere associati localmente.