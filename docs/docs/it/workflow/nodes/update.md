:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Aggiorna Dati

Utilizzato per aggiornare i dati in una collezione che soddisfano condizioni specifiche.

Le sezioni relative alla collezione e all'assegnazione dei campi sono identiche a quelle del nodo "Crea record". La differenza principale del nodo "Aggiorna dati" è l'aggiunta di condizioni di filtro e la necessità di selezionare una modalità di aggiornamento. Inoltre, il risultato del nodo "Aggiorna dati" restituisce il numero di righe aggiornate con successo. Questo dato è visibile solo nella cronologia di esecuzione e non può essere utilizzato come variabile nei nodi successivi.

## Creare un Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Aggiorna dati":

![Aggiorna Dati_Aggiungi](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Configurazione del Nodo

![Nodo Aggiorna_Configurazione Nodo](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Collezione

Selezioni la collezione in cui devono essere aggiornati i dati.

### Modalità di Aggiornamento

Esistono due modalità di aggiornamento:

*   **Aggiornamento in blocco**: Non attiva gli eventi della collezione per ogni record aggiornato. Offre prestazioni migliori ed è adatto per operazioni di aggiornamento di grandi volumi di dati.
*   **Aggiornamento uno per uno**: Attiva gli eventi della collezione per ogni record aggiornato. Tuttavia, potrebbe causare problemi di prestazioni con grandi volumi di dati e dovrebbe essere utilizzato con cautela.

La scelta dipende solitamente dai dati target per l'aggiornamento e dalla necessità di attivare altri eventi del flusso di lavoro. Se sta aggiornando un singolo record basato sulla chiave primaria, si consiglia l'aggiornamento uno per uno. Se sta aggiornando più record basati su condizioni, si consiglia l'aggiornamento in blocco.

### Condizioni di Filtro

Simili alle condizioni di filtro in una normale query di collezione, può utilizzare le variabili di contesto del flusso di lavoro.

### Valori dei Campi

Simile all'assegnazione dei campi nel nodo "Crea record", può utilizzare le variabili di contesto del flusso di lavoro o inserire manualmente valori statici.

Nota: I dati aggiornati dal nodo "Aggiorna dati" in un flusso di lavoro non gestiscono automaticamente i dati di "Ultima modifica di". Deve configurare il valore di questo campo autonomamente, a seconda delle necessità.

## Esempio

Ad esempio, quando viene creato un nuovo "Articolo", è necessario aggiornare automaticamente il campo "Conteggio Articoli" nella collezione "Categoria Articoli". Questo può essere realizzato utilizzando il nodo "Aggiorna dati":

![Nodo Aggiorna_Esempio_Configurazione Nodo](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Dopo l'attivazione del flusso di lavoro, il campo "Conteggio Articoli" della collezione "Categoria Articoli" verrà automaticamente aggiornato al conteggio attuale degli articoli + 1.