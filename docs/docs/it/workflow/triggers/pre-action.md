---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Evento Pre-Azione

## Introduzione

Il plugin Evento Pre-Azione offre un meccanismo di intercettazione per le operazioni, che può essere attivato dopo l'invio di una richiesta per un'operazione di creazione, aggiornamento o eliminazione, ma prima che venga elaborata.

Se un nodo "Termina flusso di lavoro" viene eseguito nel flusso di lavoro attivato, o se qualsiasi altro nodo non riesce a essere eseguito (a causa di un errore o di altre situazioni di mancato completamento), l'operazione del modulo verrà intercettata. In caso contrario, l'operazione prevista verrà eseguita normalmente.

Utilizzando il nodo "Messaggio di risposta" in combinazione, è possibile configurare un messaggio di risposta da restituire al client, fornendo indicazioni appropriate. Gli eventi pre-azione possono essere impiegati per la validazione aziendale o controlli logici, al fine di approvare o intercettare le richieste di operazioni di creazione, aggiornamento ed eliminazione inviate dal client.

## Configurazione del Trigger

### Creare un Trigger

Quando crea un flusso di lavoro, selezioni il tipo "Evento Pre-Azione":

![Creare un Evento Pre-Azione](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Selezionare la collezione

Nel trigger di un flusso di lavoro di intercettazione, la prima cosa da configurare è la collezione corrispondente all'operazione:

![Configurazione Evento di Intercettazione_Collezione](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Successivamente, selezioni la modalità di intercettazione. Può scegliere di intercettare solo il pulsante di operazione legato a questo flusso di lavoro, oppure di intercettare tutte le operazioni selezionate per questa collezione (indipendentemente dal modulo di origine e senza la necessità di legare il flusso di lavoro corrispondente):

### Modalità di Intercettazione

![Configurazione Evento di Intercettazione_Modalità di Intercettazione](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Attualmente, i tipi di operazione supportati sono "Creazione", "Aggiornamento" ed "Eliminazione". È possibile selezionare contemporaneamente più tipi di operazione.

## Configurazione dell'Operazione

Se nella configurazione del trigger è stata selezionata la modalità "Attiva intercettazione solo quando viene inviato un modulo legato a questo flusso di lavoro", dovrà tornare all'interfaccia del modulo e legare questo flusso di lavoro al pulsante di operazione corrispondente:

![Aggiungi Ordine_Lega Flusso di Lavoro](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Nella configurazione del legame del flusso di lavoro, selezioni il flusso di lavoro corrispondente. Di solito, il contesto predefinito per i dati di attivazione, "Interi dati del modulo", è sufficiente:

![Selezionare il Flusso di Lavoro da Legare](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Nota}
I pulsanti che possono essere legati a un Evento Pre-Azione attualmente supportano solo i pulsanti "Invia" (o "Salva"), "Aggiorna dati" ed "Elimina" nei moduli di creazione o aggiornamento. Il pulsante "Attiva flusso di lavoro" non è supportato (può essere legato solo a un "Evento Post-Azione").
:::

## Condizioni per l'Intercettazione

In un "Evento Pre-Azione", ci sono due condizioni che causeranno l'intercettazione dell'operazione corrispondente:

1. Il flusso di lavoro esegue qualsiasi nodo "Termina flusso di lavoro". Similmente alle istruzioni precedenti, quando i dati che hanno attivato il flusso di lavoro non soddisfano le condizioni preimpostate in un nodo "Condizione", il flusso entrerà nel ramo "No" ed eseguirà il nodo "Termina flusso di lavoro". A questo punto, il flusso di lavoro terminerà e l'operazione richiesta verrà intercettata.
2. Qualsiasi nodo nel flusso di lavoro non riesce a essere eseguito, inclusi errori di esecuzione del nodo o altre situazioni eccezionali. In questo caso, il flusso di lavoro terminerà con uno stato corrispondente e anche l'operazione richiesta verrà intercettata. Ad esempio, se il flusso di lavoro chiama dati esterni tramite una "Richiesta HTTP" e la richiesta fallisce, il flusso di lavoro terminerà con uno stato di fallimento e, allo stesso tempo, intercetterà la richiesta di operazione corrispondente.

Una volta soddisfatte le condizioni di intercettazione, l'operazione corrispondente non verrà più eseguita. Ad esempio, se l'invio di un ordine viene intercettato, i dati dell'ordine corrispondente non verranno creati.

## Parametri Correlati per l'Operazione Corrispondente

In un flusso di lavoro di tipo "Evento Pre-Azione", per le diverse operazioni, il trigger contiene dati differenti che possono essere utilizzati come variabili nel flusso di lavoro:

| Tipo di Operazione \\ Variabile | "Operatore" | "Identificatore ruolo operatore" | Parametro operazione: "ID" | Parametro operazione: "Oggetto dati inviato" |
| ------------------------------- | ----------- | -------------------------------- | -------------------------- | -------------------------------------------- |
| Crea una registrazione          | ✓           | ✓                                | -                          | ✓                                            |
| Aggiorna una registrazione      | ✓           | ✓                                | ✓                          | ✓                                            |
| Elimina una o più registrazioni | ✓           | ✓                                | ✓                          | -                                            |

:::info{title=Nota}
La variabile "Dati del trigger / Parametri dell'operazione / Oggetto dati inviato" in un Evento Pre-Azione non rappresenta i dati effettivi presenti nel database, ma piuttosto i parametri correlati all'invio dell'operazione. Se necessita dei dati effettivi dal database, dovrà recuperarli tramite un nodo "Interroga dati" all'interno del flusso di lavoro.

Inoltre, per un'operazione di eliminazione, l'"ID" nei parametri dell'operazione è un valore singolo quando si mira a una singola registrazione, ma è un array quando si mira a più registrazioni.
:::

## Output del Messaggio di Risposta

Dopo aver configurato il trigger, può personalizzare la logica di valutazione pertinente nel flusso di lavoro. Tipicamente, utilizzerà la modalità di ramificazione del nodo "Condizione" per decidere se "Terminare il flusso di lavoro" e restituire un "Messaggio di risposta" preimpostato, basandosi sui risultati delle condizioni aziendali specifiche:

![Configurazione Flusso di Lavoro di Intercettazione](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

A questo punto, la configurazione del flusso di lavoro corrispondente è completa. Ora può provare a inviare dati che non soddisfano le condizioni configurate nel nodo "Condizione" del flusso di lavoro per attivare la logica di intercettazione del trigger. A quel punto, vedrà il messaggio di risposta restituito:

![Messaggio di Risposta di Errore](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Stato del Messaggio di Risposta

Se il nodo "Termina flusso di lavoro" è configurato per uscire con uno stato di "Successo", la richiesta dell'operazione verrà comunque intercettata quando questo nodo viene eseguito, ma il messaggio di risposta restituito verrà visualizzato con uno stato di "Successo" (anziché "Errore"):

![Messaggio di Risposta con Stato di Successo](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Esempio

Combinando le istruzioni di base sopra, prendiamo come esempio uno scenario di "Invio Ordine". Supponiamo di dover verificare la disponibilità di magazzino di tutti i prodotti selezionati dall'utente al momento dell'invio di un ordine. Se la disponibilità di magazzino di un qualsiasi prodotto selezionato è insufficiente, l'invio dell'ordine viene intercettato e viene restituito un messaggio di avviso corrispondente. Il flusso di lavoro eseguirà un ciclo per controllare ogni prodotto finché la disponibilità di magazzino per tutti i prodotti non sarà sufficiente; a quel punto, procederà e creerà i dati dell'ordine per l'utente.

Gli altri passaggi sono gli stessi delle istruzioni. Tuttavia, poiché un ordine coinvolge più prodotti, oltre ad aggiungere una relazione molti-a-molti "Ordine" <-- M:1 -- "Dettaglio Ordine" -- 1:M --> "Prodotto" nel modello dati, è necessario aggiungere anche un nodo "Ciclo" nel flusso di lavoro "Evento Pre-Azione" per verificare iterativamente se la disponibilità di magazzino di ogni prodotto è sufficiente:

![Esempio_Flusso di Lavoro di Controllo a Ciclo](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

L'oggetto per il ciclo è selezionato come l'array "Dettaglio Ordine" dai dati dell'ordine inviato:

![Esempio_Configurazione Oggetto Ciclo](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Il nodo di condizione all'interno del ciclo viene utilizzato per determinare se la disponibilità di magazzino dell'oggetto prodotto corrente nel ciclo è sufficiente:

![Esempio_Condizione nel Ciclo](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Altre configurazioni sono le stesse dell'utilizzo di base. Quando l'ordine viene finalmente inviato, se un qualsiasi prodotto ha una disponibilità di magazzino insufficiente, l'invio dell'ordine verrà intercettato e verrà restituito un messaggio di avviso corrispondente. Durante i test, provi a inviare un ordine con più prodotti, dove uno ha disponibilità insufficiente e un altro ha disponibilità sufficiente. Potrà vedere il messaggio di risposta restituito:

![Esempio_Messaggio di Risposta dopo l'Invio](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Come può vedere, il messaggio di risposta non indica che il primo prodotto, "iPhone 15 pro", è esaurito, ma solo che il secondo prodotto, "iPhone 14 pro", lo è. Questo perché nel ciclo, il primo prodotto ha disponibilità di magazzino sufficiente, quindi non viene intercettato, mentre il secondo prodotto ha disponibilità insufficiente, il che intercetta l'invio dell'ordine.

## Chiamata Esterna

L'Evento Pre-Azione stesso è iniettato durante la fase di elaborazione della richiesta, quindi supporta anche l'attivazione tramite chiamate API HTTP.

Per i flussi di lavoro legati localmente a un pulsante di operazione, può chiamarli in questo modo (usando come esempio il pulsante di creazione della collezione `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Il parametro URL `triggerWorkflows` è la chiave del flusso di lavoro; più chiavi di flusso di lavoro sono separate da virgole. Questa chiave può essere ottenuta passando il mouse sopra il nome del flusso di lavoro nella parte superiore della tela del flusso di lavoro:

![Flusso di Lavoro_Chiave_Metodo di Visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo che la chiamata di cui sopra è stata effettuata, verrà attivato l'Evento Pre-Azione per la collezione `posts` corrispondente. Una volta completata l'elaborazione sincrona del flusso di lavoro corrispondente, i dati verranno creati e restituiti normalmente.

Se il flusso di lavoro configurato raggiunge un "nodo di fine", la logica è la stessa di un'operazione dell'interfaccia: la richiesta verrà intercettata e non verranno creati dati. Se lo stato del nodo di fine è configurato come fallito, il codice di stato della risposta restituito sarà `400`; se ha successo, sarà `200`.

Se un nodo "Messaggio di risposta" è configurato anche prima del nodo di fine, il messaggio generato verrà restituito anche nel risultato della risposta. La struttura in caso di errore è:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

La struttura del messaggio quando il "nodo di fine" è configurato per il successo è:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Nota}
Poiché è possibile aggiungere più nodi "Messaggio di risposta" in un flusso di lavoro, la struttura dei dati del messaggio restituito è un array.
:::

Se l'Evento Pre-Azione è configurato in modalità globale, non è necessario utilizzare il parametro URL `triggerWorkflows` per specificare il flusso di lavoro corrispondente quando si chiama l'API HTTP. È sufficiente chiamare direttamente l'operazione della collezione corrispondente per attivarlo.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Nota"}
Quando si attiva un evento pre-azione tramite una chiamata API HTTP, è necessario prestare attenzione anche allo stato di abilitazione del flusso di lavoro e alla corrispondenza della configurazione della collezione, altrimenti la chiamata potrebbe non avere successo o potrebbe verificarsi un errore.
:::