---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Output del Flusso di Lavoro

## Introduzione

Il nodo "Output del Flusso di Lavoro" viene utilizzato all'interno di un flusso di lavoro chiamato per definirne il valore di output. Quando un flusso di lavoro viene richiamato da un altro, il nodo "Output del Flusso di Lavoro" può essere impiegato per restituire un valore al chiamante.

## Creare il Nodo

Nel flusso di lavoro chiamato, aggiunga un nodo "Output del Flusso di Lavoro":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Configurare il Nodo

### Valore di Output

Inserisca o selezioni una variabile come valore di output. Il valore di output può essere di qualsiasi tipo: una costante (come una stringa, un numero, un valore booleano, una data o un JSON personalizzato) oppure un'altra variabile presente nel flusso di lavoro.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Suggerimento}
Se vengono aggiunti più nodi "Output del Flusso di Lavoro" a un flusso di lavoro chiamato, quando quest'ultimo viene richiamato, verrà restituito il valore dell'ultimo nodo "Output del Flusso di Lavoro" eseguito.
:::