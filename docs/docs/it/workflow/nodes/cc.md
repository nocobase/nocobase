---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/workflow/nodes/cc).
:::

# Copia conoscenza <Badge>v1.8.2+</Badge>

## Introduzione

Il nodo Copia conoscenza viene utilizzato per inviare determinati contenuti contestuali del processo di esecuzione del **flusso di lavoro** a utenti specificati, affinché possano prenderne visione e consultarli. Ad esempio, in un'approvazione o in altri processi, le informazioni rilevanti possono essere inviate in copia conoscenza ad altri partecipanti, in modo che possano rimanere informati sull'avanzamento del lavoro.

È possibile impostare più nodi Copia conoscenza in un **flusso di lavoro**, in modo che, quando l'esecuzione del **flusso di lavoro** raggiunge tale nodo, le informazioni pertinenti vengano inviate ai destinatari specificati.

Il contenuto della copia conoscenza verrà visualizzato nel menu "CC per me" del Centro attività, dove gli utenti possono visualizzare tutti i contenuti inviati loro in copia. Inoltre, il sistema segnalerà i contenuti non ancora visualizzati in base allo stato "non letto"; dopo la visualizzazione, l'utente può contrassegnarli attivamente come letti.

## Creare un nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") nel flusso per aggiungere il nodo "Copia conoscenza":

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Configurazione del nodo

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Nell'interfaccia di configurazione del nodo, è possibile impostare i seguenti parametri:

### Destinatari

I destinatari sono la **collezione** di utenti target della copia conoscenza, che può essere composta da uno o più utenti. La fonte selezionata può essere un valore statico scelto dall'elenco utenti, un valore dinamico specificato da una variabile o il risultato di una query sulla tabella degli utenti.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Interfaccia utente

I destinatari devono visualizzare il contenuto della copia conoscenza nel menu "CC per me" del Centro attività. È possibile configurare i risultati del trigger e di qualsiasi nodo nel contesto del processo come blocchi di contenuto.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Scheda attività <Badge>2.0+</Badge>

Può essere utilizzata per configurare le schede delle attività nell'elenco "CC per me" del Centro attività.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Nella scheda è possibile configurare liberamente i campi di business che si desidera visualizzare (ad eccezione dei campi di associazione).

Una volta creata l'attività di copia conoscenza del **flusso di lavoro**, la scheda attività personalizzata sarà visibile nell'elenco del Centro attività:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Titolo attività

Il titolo dell'attività è il titolo visualizzato nel Centro attività; è possibile utilizzare le variabili nel contesto del processo per generare dinamicamente il titolo.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Centro attività

Gli utenti possono visualizzare e gestire tutti i contenuti inviati loro in copia conoscenza nel Centro attività, filtrandoli e visualizzandoli in base allo stato di lettura.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Dopo la visualizzazione, è possibile contrassegnare l'elemento come letto e il numero di elementi non letti diminuirà di conseguenza.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)