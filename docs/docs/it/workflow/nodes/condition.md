:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Condizione

## Introduzione

Simile all'istruzione `if` nei linguaggi di programmazione, questo nodo determina la direzione successiva del **flusso di lavoro** in base al risultato della condizione configurata.

## Creazione del Nodo

Il nodo Condizione offre due modalità: "Continua se vero" e "Biforca su vero/falso". È necessario selezionare una di queste modalità al momento della creazione del nodo; non sarà possibile modificarla in seguito nella configurazione del nodo.

![Selezione della Modalità Condizione](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Nella modalità "Continua se vero", quando il risultato della condizione è "vero", il **flusso di lavoro** continuerà a eseguire i nodi successivi. In caso contrario, il **flusso di lavoro** terminerà ed uscirà anticipatamente con uno stato di fallimento.

!["Continua se vero" modalità](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Questa modalità è adatta per scenari in cui il **flusso di lavoro** non deve proseguire se la condizione non è soddisfatta. Ad esempio, un pulsante di invio di un modulo per un ordine è associato a un "Evento prima dell'azione". Se la disponibilità del prodotto nell'ordine è insufficiente, il processo di creazione dell'ordine non dovrebbe continuare, ma fallire e terminare.

Nella modalità "Biforca su vero/falso", il nodo Condizione genererà due rami successivi nel **flusso di lavoro**, corrispondenti ai risultati "vero" e "falso" della condizione. Ogni ramo può essere configurato con i propri nodi successivi. Dopo che uno dei rami ha completato la sua esecuzione, si ricongiungerà automaticamente al ramo padre del nodo Condizione per continuare l'esecuzione dei nodi successivi.

!["Biforca su vero/falso" modalità](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Questa modalità è ideale per scenari in cui è necessario eseguire azioni diverse a seconda che la condizione sia soddisfatta o meno. Ad esempio, verificare se un dato esiste: se non esiste, crearlo; se esiste, aggiornarlo.

## Configurazione del Nodo

### Motore di Calcolo

Attualmente, sono supportati tre motori:

-   **Base**: Ottiene un risultato logico tramite semplici calcoli binari e raggruppamenti "AND" / "OR".
-   **Math.js**: Calcola espressioni supportate dal motore [Math.js](https://mathjs.org/) per ottenere un risultato logico.
-   **Formula.js**: Calcola espressioni supportate dal motore [Formula.js](https://formulajs.info/) per ottenere un risultato logico.

In tutti e tre i tipi di calcolo, le variabili dal contesto del **flusso di lavoro** possono essere utilizzate come parametri.