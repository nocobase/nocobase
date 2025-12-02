:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Eliminare dati

Questo nodo le permette di eliminare dati da una collezione che soddisfano determinate condizioni.

L'utilizzo di base del nodo di eliminazione è simile a quello del nodo di aggiornamento. Tuttavia, il nodo di eliminazione non richiede l'assegnazione di valori ai campi; deve solo selezionare la collezione e le condizioni di filtro. Il risultato del nodo di eliminazione restituisce il numero di righe eliminate con successo, visibile solo nella cronologia di esecuzione e non utilizzabile come variabile nei nodi successivi.

:::info{title=Nota}
Attualmente, il nodo di eliminazione non supporta l'eliminazione riga per riga; esegue eliminazioni in blocco. Di conseguenza, non attiverà altri eventi per ogni singola eliminazione di dati.
:::

## Creare il nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Eliminare dati":

![Creare il nodo di eliminazione dati](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Configurazione del nodo

![Nodo di eliminazione_Configurazione del nodo](https://static-docs.nocobase.com/580600c2b1ef4e01dfa48b23539648e.png)

### Collezione

Selezioni la collezione dalla quale eliminare i dati.

### Condizioni di filtro

Simili alle condizioni di filtro per una normale query di collezione, può utilizzare le variabili di contesto del flusso di lavoro.

## Esempio

Ad esempio, per pulire periodicamente i dati storici degli ordini annullati e non validi, può utilizzare il nodo di eliminazione:

![Nodo di eliminazione_Esempio_Configurazione del nodo](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Il flusso di lavoro verrà attivato periodicamente ed eseguirà l'eliminazione di tutti i dati storici degli ordini annullati e non validi.