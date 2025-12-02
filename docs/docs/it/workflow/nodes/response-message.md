---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Messaggio di risposta

## Introduzione

Il nodo Messaggio di risposta consente di inviare messaggi personalizzati dal flusso di lavoro al client che ha avviato l'azione, in specifici tipi di flussi di lavoro.

:::info{title=Nota}
Attualmente, è supportato l'uso nei flussi di lavoro di tipo "Evento prima dell'azione" e "Evento azione personalizzata" in modalità sincrona.
:::

## Creazione di un nodo

Nei tipi di flussi di lavoro supportati, Lei può aggiungere un nodo "Messaggio di risposta" in qualsiasi punto del flusso di lavoro. Clicchi sul pulsante più ("+") nel flusso di lavoro per aggiungere un nodo "Messaggio di risposta":

![Aggiunta di un nodo](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Il messaggio di risposta esiste come array durante l'intero processo di richiesta. Ogni volta che un nodo Messaggio di risposta viene eseguito nel flusso di lavoro, il nuovo contenuto del messaggio viene aggiunto all'array. Quando il server invia la risposta, tutti i messaggi vengono inviati al client contemporaneamente.

## Configurazione del nodo

Il contenuto del messaggio è una stringa modello in cui è possibile inserire variabili. Lei può organizzare liberamente il contenuto di questo modello nella configurazione del nodo:

![Configurazione del nodo](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Quando il flusso di lavoro esegue questo nodo, il modello verrà analizzato per generare il contenuto del messaggio. Nella configurazione sopra, la variabile "Variabile locale / Cicla tutti i prodotti / Oggetto ciclo / Prodotto / Titolo" verrà sostituita con un valore specifico nel flusso di lavoro effettivo, ad esempio:

```
Il prodotto "iPhone 14 pro" è esaurito
```

![Contenuto del messaggio](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Configurazione del flusso di lavoro

Lo stato del messaggio di risposta dipende dall'esito (successo o fallimento) dell'esecuzione del flusso di lavoro. Il fallimento dell'esecuzione di qualsiasi nodo causerà il fallimento dell'intero flusso di lavoro. In tal caso, il contenuto del messaggio verrà restituito al client con uno stato di fallimento e visualizzato.

Se Lei ha bisogno di definire attivamente uno stato di fallimento nel flusso di lavoro, può utilizzare un "Nodo di fine" e configurarlo con uno stato di fallimento. Quando questo nodo viene eseguito, il flusso di lavoro uscirà con uno stato di fallimento e il messaggio verrà restituito al client con tale stato.

Se l'intero flusso di lavoro non produce uno stato di fallimento ed esegue con successo fino alla fine, il contenuto del messaggio verrà restituito al client con uno stato di successo.

:::info{title=Nota}
Se nel flusso di lavoro sono definiti più nodi Messaggio di risposta, i nodi eseguiti aggiungeranno il contenuto del messaggio a un array. Quando infine verranno restituiti al client, tutti i contenuti dei messaggi verranno inviati e visualizzati insieme.
:::

## Casi d'uso

### Flusso di lavoro "Evento prima dell'azione"

L'utilizzo di un messaggio di risposta in un flusso di lavoro "Evento prima dell'azione" consente di inviare un feedback corrispondente al client dopo la fine del flusso di lavoro. Per maggiori dettagli, si prega di fare riferimento a [Evento prima dell'azione](../triggers/pre-action.md).

### Flusso di lavoro "Evento azione personalizzata"

L'utilizzo di un messaggio di risposta in un "Evento azione personalizzata" in modalità sincrona consente di inviare un feedback corrispondente al client dopo la fine del flusso di lavoro. Per maggiori dettagli, si prega di fare riferimento a [Evento azione personalizzata](../triggers/custom-action.md).