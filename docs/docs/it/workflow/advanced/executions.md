:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Piano di Esecuzione (Cronologia)

Ogni volta che un flusso di lavoro viene attivato, viene creato un piano di esecuzione corrispondente per tracciare il processo di esecuzione di tale attività. Ogni piano di esecuzione ha un valore di stato che indica lo stato di esecuzione corrente, visualizzabile nell'elenco e nei dettagli della cronologia di esecuzione:

![Stato del Piano di Esecuzione](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Quando tutti i nodi nel ramo principale del flusso di lavoro vengono eseguiti fino alla fine del processo con lo stato "Completato", l'intero piano di esecuzione termina con lo stato "Completato". Quando un nodo nel ramo principale del flusso di lavoro ha uno stato finale come "Fallito", "Errore", "Annullato" o "Rifiutato", l'intero piano di esecuzione verrà **terminato prematuramente** con lo stato corrispondente. Quando un nodo nel ramo principale del flusso di lavoro ha lo stato "In attesa", l'intero piano di esecuzione verrà messo in pausa, ma continuerà a mostrare lo stato "In esecuzione", fino a quando il nodo in attesa non viene ripristinato. I diversi tipi di nodo gestiscono lo stato di attesa in modo diverso. Ad esempio, un nodo manuale deve attendere l'elaborazione manuale, mentre un nodo di ritardo deve attendere che trascorra il tempo specificato prima di continuare.

Gli stati di un piano di esecuzione sono i seguenti:

| Stato     | Stato corrispondente dell'ultimo nodo eseguito nel flusso principale | Significato