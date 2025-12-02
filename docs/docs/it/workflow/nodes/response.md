---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Risposta HTTP

## Introduzione

Questo nodo è supportato solo nei flussi di lavoro Webhook in modalità sincrona e viene utilizzato per restituire una risposta a un sistema di terze parti. Ad esempio, durante l'elaborazione di un callback di pagamento, se il processo aziendale presenta un risultato inatteso (come un errore o un fallimento), Lei può utilizzare il nodo di risposta per restituire una risposta di errore al sistema di terze parti, in modo che alcuni sistemi di terze parti possano riprovare in seguito in base allo stato.

Inoltre, l'esecuzione del nodo di risposta terminerà l'esecuzione del flusso di lavoro e i nodi successivi non verranno più eseguiti. Se non viene configurato alcun nodo di risposta nell'intero flusso di lavoro, il sistema risponderà automaticamente in base allo stato di esecuzione del flusso: restituendo `200` per un'esecuzione riuscita e `500` per un'esecuzione fallita.

## Creazione di un nodo di risposta

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Risposta":

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Configurazione della risposta

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Nel corpo della risposta, Lei può utilizzare le variabili dal contesto del flusso di lavoro.