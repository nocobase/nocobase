---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Evento Azione Personalizzata

## Introduzione

NocoBase include azioni dati comuni predefinite (come creazione, lettura, aggiornamento, eliminazione, ecc.). Quando queste azioni non sono sufficienti per esigenze di business complesse, Lei può utilizzare gli eventi di azione personalizzata all'interno di un flusso di lavoro. Associando questo evento a un pulsante "Attiva flusso di lavoro" in un blocco di pagina, un flusso di lavoro di azione personalizzata verrà attivato al clic dell'utente.

## Creare un Flusso di Lavoro

Quando crea un flusso di lavoro, selezioni "Evento Azione Personalizzata":

![Crea flusso di lavoro "Evento azione personalizzata"](https://static-docs.nocobase.com/20240509091820.png)

## Configurazione del Trigger

### Tipo di Contesto

> v.1.6.0+

Il tipo di contesto determina a quali pulsanti di blocco il flusso di lavoro può essere associato:

*   **Nessun contesto**: Un evento globale che può essere associato ai pulsanti di azione nella Barra delle azioni e nei blocchi dati.
*   **Singolo record**: Può essere associato ai pulsanti di azione nei blocchi dati come righe di tabella, moduli e dettagli.
*   **Record multipli**: Può essere associato ai pulsanti per azioni multiple in una tabella.

![Configurazione del trigger_Tipo di contesto](https://static-docs.nocobase.com/20250215135808.png)

### Collezione

Quando il tipo di contesto è Singolo record o Record multipli, deve selezionare la collezione a cui associare il modello di dati:

![Configurazione del trigger_Seleziona collezione](https://static-docs.nocobase.com/20250215135919.png)

### Dati di Associazione da Utilizzare

Se ha bisogno di utilizzare i dati di associazione della riga di dati che attiva il flusso di lavoro, può selezionare qui i campi di associazione profondi:

![Configurazione del trigger_Seleziona dati di associazione da utilizzare](https://static-docs.nocobase.com/20250215135955.png)

Questi campi verranno automaticamente precaricati nel contesto del flusso di lavoro dopo l'attivazione dell'evento, rendendoli disponibili per l'uso nel flusso di lavoro.

## Configurazione dell'Azione

La configurazione dei pulsanti di azione in blocchi diversi varia a seconda del tipo di contesto configurato nel flusso di lavoro.

### Nessun Contesto

> v.1.6.0+

Nella Barra delle azioni e in altri blocchi dati, può aggiungere un pulsante "Attiva flusso di lavoro":

![Aggiungi pulsante azione al blocco_Barra delle azioni](https://static-docs.nocobase.com/20250215221738.png)

![Aggiungi pulsante azione al blocco_Calendario](https://static-docs.nocobase.com/20250215221942.png)

![Aggiungi pulsante azione al blocco_Diagramma di Gantt](https://static-docs.nocobase.com/20250215221810.png)

Dopo aver aggiunto il pulsante, associ il flusso di lavoro senza contesto creato in precedenza. Ecco un esempio che utilizza un pulsante nella Barra delle azioni:

![Associa flusso di lavoro al pulsante_Barra delle azioni](https://static-docs.nocobase.com/20250215222120.png)

![Seleziona flusso di lavoro da associare_Nessun contesto](https://static-docs.nocobase.com/20250215222234.png)

### Singolo Record

In qualsiasi blocco dati, un pulsante "Attiva flusso di lavoro" può essere aggiunto alla barra delle azioni per un singolo record, ad esempio in moduli, righe di tabella, dettagli, ecc.:

![Aggiungi pulsante azione al blocco_Modulo](https://static-docs.nocobase.com/20240509165428.png)

![Aggiungi pulsante azione al blocco_Riga della tabella](https://static-docs.nocobase.com/20240509165340.png)

![Aggiungi pulsante azione al blocco_Dettagli](https://static-docs.nocobase.com/20240509165545.png)

Dopo aver aggiunto il pulsante, associ il flusso di lavoro creato in precedenza:

![Associa flusso di lavoro al pulsante](https://static-docs.nocobase.com/20240509165631.png)

![Seleziona flusso di lavoro da associare](https://static-docs.nocobase.com/20240509165658.png)

Successivamente, cliccando su questo pulsante si attiverà l'evento di azione personalizzata:

![Risultato del clic sul pulsante](https://static-docs.nocobase.com/20240509170453.png)

### Record Multipli

> v.1.6.0+

Nella barra delle azioni di un blocco tabella, quando aggiunge un pulsante "Attiva flusso di lavoro", c'è un'opzione aggiuntiva per selezionare il tipo di contesto: "Nessun contesto" o "Record multipli":

![Aggiungi pulsante azione al blocco_Tabella](https://static-docs.nocobase.com/20250215222507.png)

Quando è selezionato "Nessun contesto", si tratta di un evento globale e può essere associato solo a flussi di lavoro senza contesto.

Quando è selezionato "Record multipli", può associare un flusso di lavoro di tipo record multipli, che può essere utilizzato per azioni in blocco dopo aver selezionato più record (attualmente supportato solo dalle tabelle). I flussi di lavoro disponibili sono limitati a quelli configurati per corrispondere alla collezione del blocco dati corrente:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Quando si clicca sul pulsante per attivare, alcune righe di dati nella tabella devono essere state selezionate; altrimenti, il flusso di lavoro non verrà attivato:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Esempio

Ad esempio, abbiamo una collezione "Campioni". Per i campioni con stato "Raccolto", dobbiamo fornire un'azione "Invia per ispezione". Questa azione verificherà prima le informazioni di base del campione, quindi genererà un "Record di ispezione" e infine cambierà lo stato del campione in "Inviato". Questa serie di processi non può essere completata con semplici clic sui pulsanti di creazione, lettura, aggiornamento, eliminazione, quindi un evento di azione personalizzata può essere utilizzato per implementarla.

Per prima cosa, crei una collezione "Campioni" e una collezione "Record di ispezione", e inserisca alcuni dati di test di base nella collezione Campioni:

![Esempio_Collezione Campioni](https://static-docs.nocobase.com/20240509172234.png)

Quindi, crei un flusso di lavoro "Evento Azione Personalizzata". Se ha bisogno di un feedback tempestivo dal processo operativo, può scegliere la modalità sincrona (in modalità sincrona, non può utilizzare nodi asincroni come l'elaborazione manuale):

![Esempio_Crea flusso di lavoro](https://static-docs.nocobase.com/20240509173106.png)

Nella configurazione del trigger, selezioni "Campioni" per la collezione:

![Esempio_Configurazione del trigger](https://static-docs.nocobase.com/20240509173148.png)

Organizzi la logica nel processo in base ai requisiti aziendali. Ad esempio, consenta l'invio per ispezione solo quando il parametro indicatore è maggiore di `90`; altrimenti, visualizzi un messaggio pertinente:

![Esempio_Arrangiamento della logica di business](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Suggerimento}
Il nodo "[Messaggio di risposta](../nodes/response-message.md)" può essere utilizzato negli eventi di azione personalizzata sincroni per restituire un messaggio di prompt al client. Non può essere utilizzato in modalità asincrona.
:::

Dopo aver configurato e abilitato il flusso di lavoro, torni all'interfaccia della tabella e aggiunga un pulsante "Attiva flusso di lavoro" nella colonna delle azioni della tabella:

![Esempio_Aggiungi pulsante azione](https://static-docs.nocobase.com/20240509174525.png)

Quindi, nel menu di configurazione del pulsante, scelga di associare un flusso di lavoro e apra il pop-up di configurazione:

![Esempio_Apri pop-up di associazione flusso di lavoro](https://static-docs.nocobase.com/20240509174633.png)

Aggiunga il flusso di lavoro abilitato in precedenza:

![Esempio_Seleziona flusso di lavoro](https://static-docs.nocobase.com/20240509174723.png)

Dopo aver inviato, modifichi il testo del pulsante con il nome dell'azione, come "Invia per ispezione". Il processo di configurazione è ora completo.

Per utilizzarlo, selezioni qualsiasi dato campione nella tabella e clicchi sul pulsante "Invia per ispezione" per attivare l'evento di azione personalizzata. Come da logica precedentemente organizzata, se il parametro indicatore del campione è inferiore a 90, verrà visualizzato il seguente prompt dopo il clic:

![Esempio_L'indicatore non soddisfa i criteri di invio](https://static-docs.nocobase.com/20240509175026.png)

Se il parametro indicatore è maggiore di 90, il processo verrà eseguito normalmente, generando un "Record di ispezione" e modificando lo stato del campione in "Inviato":

![Esempio_Invio riuscito](https://static-docs.nocobase.com/20240509175247.png)

A questo punto, un semplice evento di azione personalizzata è completo. Allo stesso modo, per le aziende con operazioni complesse come l'elaborazione degli ordini o l'invio di rapporti, gli eventi di azione personalizzata possono essere utilizzati per l'implementazione.

## Chiamata Esterna

L'attivazione degli eventi di azione personalizzata non è limitata alle azioni dell'interfaccia utente; può anche essere attivata tramite chiamate API HTTP. In particolare, gli eventi di azione personalizzata forniscono un nuovo tipo di azione per tutte le azioni della collezione per attivare i flussi di lavoro: `trigger`, che può essere chiamato utilizzando l'API di azione standard di NocoBase.

Un flusso di lavoro attivato da un pulsante, come nell'esempio, può essere chiamato in questo modo:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Poiché questa azione è per un singolo record, quando la chiama su dati esistenti, deve specificare l'ID della riga di dati, sostituendo la parte `<:id>` nell'URL.

Se viene chiamata per un modulo (ad esempio per la creazione o l'aggiornamento), può omettere l'ID per un modulo che crea nuovi dati, ma deve passare i dati inviati come contesto di esecuzione:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Per un modulo di aggiornamento, deve passare sia l'ID della riga di dati che i dati aggiornati:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Se vengono passati sia un ID che i dati, la riga di dati corrispondente all'ID verrà caricata per prima, quindi le proprietà dall'oggetto dati passato verranno utilizzate per sovrascrivere la riga di dati originale per ottenere il contesto dati di trigger finale.

:::warning{title="Attenzione"}
Se vengono passati dati di associazione, anch'essi verranno sovrascritti. Sia particolarmente cauto quando gestisce i dati in ingresso se è configurato il precaricamento di elementi di dati di associazione, per evitare sovrascritture inattese dei dati di associazione.
:::

Inoltre, il parametro URL `triggerWorkflows` è la chiave del flusso di lavoro; più chiavi di flusso di lavoro sono separate da virgole. Questa chiave può essere ottenuta passando il mouse sul nome del flusso di lavoro nella parte superiore della tela del flusso di lavoro:

![Flusso di lavoro_Chiave_Metodo di visualizzazione](https://static-docs.nocobase.com/20240426135108.png)

Dopo una chiamata riuscita, l'evento di azione personalizzata per la collezione `samples` corrispondente verrà attivato.

:::info{title=Suggerimento}
Poiché le chiamate esterne devono anche essere basate sull'identità dell'utente, quando si chiama tramite API HTTP, proprio come le richieste inviate dall'interfaccia normale, è necessario fornire le informazioni di autenticazione. Ciò include l'intestazione della richiesta `Authorization` o il parametro `token` (il token ottenuto al login) e l'intestazione della richiesta `X-Role` (il nome del ruolo corrente dell'utente).
:::

Se ha bisogno di attivare un evento per un dato di associazione uno-a-uno (uno-a-molti non è attualmente supportato) in questa azione, può usare `!` nel parametro per specificare i dati di trigger del campo di associazione:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Dopo una chiamata riuscita, l'evento di azione personalizzata per la collezione `categories` corrispondente verrà attivato.

:::info{title=Suggerimento}
Quando si attiva un evento di azione tramite una chiamata API HTTP, è necessario prestare attenzione anche allo stato abilitato del flusso di lavoro e alla corrispondenza della configurazione della collezione; altrimenti, la chiamata potrebbe non riuscire o potrebbe verificarsi un errore.
:::