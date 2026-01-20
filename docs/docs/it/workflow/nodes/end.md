:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Termina flusso di lavoro

Quando questo nodo viene eseguito, termina immediatamente il flusso di lavoro corrente con lo stato configurato nel nodo. Lo si utilizza solitamente per il controllo del flusso basato su logiche specifiche, uscendo dal flusso di lavoro corrente quando determinate condizioni vengono soddisfatte e interrompendo l'esecuzione dei processi successivi. È analogo all'istruzione `return` nei linguaggi di programmazione, utilizzata per uscire dalla funzione corrente.

## Aggiungere un nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Termina flusso di lavoro":

![End Workflow_Add](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Configurazione del nodo

![End Workflow_Node Configuration](https://static-docs.nocobase.com/bb6a597f25e9afb72836a140fe0683e.png)

### Stato di conclusione

Lo stato di conclusione influenzerà lo stato finale del piano di esecuzione del flusso di lavoro. Può essere configurato come "Riuscito" o "Non riuscito". Quando l'esecuzione del flusso di lavoro raggiunge questo nodo, uscirà immediatamente con lo stato configurato.

:::info{title=Nota}
Quando utilizzato in un flusso di lavoro di tipo "Evento prima dell'azione", intercetterà la richiesta che ha avviato l'azione. Per maggiori dettagli, consulti [Utilizzo di "Evento prima dell'azione"](../triggers/pre-action).

Inoltre, oltre a intercettare la richiesta che ha avviato l'azione, la configurazione dello stato di conclusione influenzerà anche lo stato del feedback nel "messaggio di risposta" per questo tipo di flusso di lavoro.
:::