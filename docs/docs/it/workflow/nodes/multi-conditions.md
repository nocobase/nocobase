:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Multi-condizioni <Badge>v2.0.0+</Badge>

## Introduzione

Simile alle istruzioni `switch / case` o `if / else if` nei linguaggi di programmazione. Il sistema valuta le condizioni configurate in sequenza. Una volta che una condizione è soddisfatta, il flusso di lavoro esegue il ramo corrispondente e salta i controlli delle condizioni successive. Se nessuna condizione è soddisfatta, viene eseguito il ramo "Altrimenti".

## Creazione del Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Multi-condizioni":

![Crea Nodo Multi-condizioni](https://static-docs.nocobase.com/20251123222134.png)

## Gestione dei Rami

### Rami Predefiniti

Dopo la creazione, il nodo include due rami per impostazione predefinita:

1.  **Ramo Condizione**: Per configurare condizioni di valutazione specifiche.
2.  **Ramo Altrimenti**: Viene attivato quando nessun ramo condizione è soddisfatto; non richiede configurazione di condizioni.

Clicchi sul pulsante "Aggiungi ramo" sotto il nodo per aggiungere altri rami condizione.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Aggiungere un Ramo

Dopo aver cliccato su "Aggiungi ramo", il nuovo ramo viene aggiunto prima del ramo "Altrimenti".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Eliminare un Ramo

Quando esistono più rami condizione, clicchi sull'icona del cestino a destra di un ramo per eliminarlo. Se rimane un solo ramo condizione, non potrà essere eliminato.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Nota}
L'eliminazione di un ramo comporterà anche l'eliminazione di tutti i nodi al suo interno; proceda con cautela.

Il ramo "Altrimenti" è un ramo integrato e non può essere eliminato.
:::

## Configurazione del Nodo

### Configurazione delle Condizioni

Clicchi sul nome della condizione nella parte superiore di un ramo per modificare i dettagli specifici della condizione:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Etichetta della Condizione

Supporta etichette personalizzate. Una volta compilata, verrà visualizzata come nome della condizione nel diagramma di flusso. Se non configurata (o lasciata vuota), verrà visualizzata per impostazione predefinita come "Condizione 1", "Condizione 2", ecc., in sequenza.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Motore di Calcolo

Attualmente supporta tre motori:

-   **Base**: Utilizza semplici confronti logici (ad esempio, uguale a, contiene, ecc.) e combinazioni "E"/"O" per determinare i risultati.
-   **Math.js**: Supporta il calcolo di espressioni utilizzando la sintassi [Math.js](https://mathjs.org/).
-   **Formula.js**: Supporta il calcolo di espressioni utilizzando la sintassi [Formula.js](https://formulajs.info/) (simile alle formule di Excel).

Tutte e tre le modalità supportano l'utilizzo di variabili di contesto del flusso di lavoro come parametri.

### Quando Nessuna Condizione è Soddisfatta

Nel pannello di configurazione del nodo, può impostare l'azione successiva quando nessuna condizione è soddisfatta:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Termina il flusso di lavoro con errore (Predefinito)**: Contrassegna lo stato del flusso di lavoro come fallito e termina il processo.
*   **Continua a eseguire i nodi successivi**: Dopo che il nodo corrente ha terminato, continua a eseguire i nodi successivi nel flusso di lavoro.

:::info{title=Nota}
Indipendentemente dal metodo di gestione scelto, quando nessuna condizione è soddisfatta, il flusso entrerà prima nel ramo "Altrimenti" per eseguire i nodi al suo interno.
:::

## Cronologia di Esecuzione

Nella cronologia di esecuzione del flusso di lavoro, il nodo Multi-condizioni identifica il risultato di ciascuna condizione utilizzando colori diversi:

-   **Verde**: Condizione soddisfatta; è entrato in questo ramo.
-   **Rosso**: Condizione non soddisfatta (o errore di calcolo); questo ramo è stato saltato.
-   **Blu**: Valutazione non eseguita (saltata perché una condizione precedente era già stata soddisfatta).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Se un errore di configurazione causa un'eccezione di calcolo, oltre a essere visualizzato in rosso, passando il mouse sul nome della condizione verranno mostrate informazioni specifiche sull'errore:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Quando si verifica un'eccezione nel calcolo di una condizione, il nodo Multi-condizioni terminerà con lo stato "Errore" e non continuerà a eseguire i nodi successivi.