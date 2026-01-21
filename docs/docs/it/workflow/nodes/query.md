:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Query Dati

Questo nodo le permette di interrogare e recuperare record di dati da una collezione, basandosi su condizioni specifiche.

Può configurarlo per interrogare un singolo record o più record. Il risultato della query può essere utilizzato come variabile nei nodi successivi. Quando si interrogano più record, il risultato è un array. Se il risultato della query è vuoto, può scegliere se continuare l'esecuzione dei nodi successivi.

## Creare un Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Query Dati":

![Aggiungere il nodo Query Dati](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Configurazione del Nodo

![Configurazione del nodo Query](https://static-docs.nocobase.com/20240520131324.png)

### Collezione

Selezioni la collezione da cui interrogare i dati.

### Tipo di Risultato

Il tipo di risultato è suddiviso in "Singolo Record" e "Record Multipli":

-   Singolo Record: Il risultato è un oggetto, che rappresenta solo il primo record corrispondente, oppure `null`.
-   Record Multipli: Il risultato sarà un array contenente i record che soddisfano le condizioni. Se nessun record corrisponde, sarà un array vuoto. Può elaborarli uno per uno utilizzando un nodo di Loop.

### Condizioni di Filtro

Simili alle condizioni di filtro in una normale query di collezione, può utilizzare le variabili di contesto del flusso di lavoro.

### Ordinamento

Quando interroga uno o più record, può utilizzare le regole di ordinamento per controllare il risultato desiderato. Ad esempio, per interrogare il record più recente, può ordinare per il campo "Data di Creazione" in ordine decrescente.

### Paginazione

Quando il set di risultati potrebbe essere molto grande, può utilizzare la paginazione per controllare il numero di risultati della query. Ad esempio, per interrogare gli ultimi 10 record, può ordinare per il campo "Data di Creazione" in ordine decrescente e poi impostare la paginazione a 1 pagina con 10 record.

### Gestione dei Risultati Vuoti

Nella modalità a singolo record, se nessun dato soddisfa le condizioni, il risultato della query sarà `null`. Nella modalità a record multipli, sarà un array vuoto (`[]`). Può scegliere se selezionare "Esci dal flusso di lavoro quando il risultato della query è vuoto". Se selezionato e il risultato della query è vuoto, i nodi successivi non verranno eseguiti e il flusso di lavoro terminerà anticipatamente con uno stato di fallimento.