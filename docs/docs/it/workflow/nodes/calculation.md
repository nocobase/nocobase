:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Calcolo

Il nodo Calcolo può valutare un'espressione e il risultato viene salvato nel risultato del nodo corrispondente per essere utilizzato dai nodi successivi. È uno strumento per calcolare, elaborare e trasformare i dati. In un certo senso, può sostituire la funzionalità dei linguaggi di programmazione di chiamare una funzione su un valore e assegnarlo a una variabile.

## Creazione del nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Calcolo":

![Nodo Calcolo_Aggiungi](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Configurazione del nodo

![Nodo Calcolo_Configurazione](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Motore di calcolo

Il motore di calcolo definisce la sintassi supportata dall'espressione. I motori di calcolo attualmente supportati sono [Math.js](https://mathjs.org/) e [Formula.js](https://formulajs.info/). Ogni motore include un gran numero di funzioni comuni e metodi per le operazioni sui dati. Per un utilizzo specifico, può consultare la loro documentazione ufficiale.

:::info{title=Suggerimento}
È importante notare che i diversi motori si distinguono per l'accesso agli indici degli array. Gli indici di Math.js partono da `1`, mentre quelli di Formula.js partono da `0`.
:::

Inoltre, se ha bisogno di una semplice concatenazione di stringhe, può utilizzare direttamente il "Modello di stringa". Questo motore sostituirà le variabili nell'espressione con i loro valori corrispondenti e quindi restituirà la stringa concatenata.

### Espressione

Un'espressione è una rappresentazione in stringa di una formula di calcolo, che può essere composta da variabili, costanti, operatori e funzioni supportate. Può utilizzare variabili dal contesto del flusso, come il risultato di un nodo precedente del nodo Calcolo, o variabili locali di un ciclo.

Se l'input dell'espressione non è conforme alla sintassi, verrà visualizzato un errore nella configurazione del nodo. Se una variabile non esiste o il tipo non corrisponde durante l'esecuzione, o se viene utilizzata una funzione inesistente, il nodo Calcolo terminerà prematuramente con uno stato di errore.

## Esempio

### Calcolare il prezzo totale dell'ordine

Un ordine può contenere più articoli, e ogni articolo ha un prezzo e una quantità diversi. Il prezzo totale dell'ordine deve essere la somma dei prodotti del prezzo e della quantità di tutti gli articoli. Dopo aver caricato l'elenco dei dettagli dell'ordine (un dataset con relazione uno-a-molti), può utilizzare un nodo Calcolo per calcolare il prezzo totale dell'ordine:

![Nodo Calcolo_Esempio_Configurazione](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Qui, la funzione `SUMPRODUCT` di Formula.js può calcolare la somma dei prodotti per due array della stessa lunghezza, ottenendo così il prezzo totale dell'ordine.