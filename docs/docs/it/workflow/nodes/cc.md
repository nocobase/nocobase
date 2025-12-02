---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Copia Carbone <Badge>v1.8.2+</Badge>

## Introduzione

Il nodo Copia Carbone (CC) serve a inviare specifici contenuti contestuali del processo di esecuzione di un **flusso di lavoro** a utenti designati, affinché ne prendano visione e li consultino. Ad esempio, in un processo di approvazione o in altri flussi, le informazioni rilevanti possono essere inviate in copia conoscenza ad altri partecipanti, permettendo loro di rimanere aggiornati sull'avanzamento del lavoro.

È possibile configurare più nodi Copia Carbone all'interno di un **flusso di lavoro**. Quando l'esecuzione del **flusso di lavoro** raggiunge uno di questi nodi, le informazioni pertinenti verranno inviate ai destinatari specificati.

Il contenuto inviato in copia conoscenza sarà visualizzato nel menu "CC per me" del Centro Attività, dove gli utenti potranno consultare tutti i contenuti a loro destinati. Il sistema segnalerà anche gli elementi non letti e gli utenti potranno contrassegnarli manualmente come letti dopo averli visualizzati.

## Creare un Nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") all'interno del flusso per aggiungere un nodo "Copia Carbone":

![Aggiungi Copia Carbone](https://static-docs.nocobase.com/20250710222842.png)

## Configurazione del Nodo

![Configurazione del Nodo](https://static-docs.nocobase.com/20250710224041.png)

Nell'interfaccia di configurazione del nodo, può impostare i seguenti parametri:

### Destinatari

I destinatari sono la **collezione** di utenti a cui è indirizzata la copia conoscenza, e possono essere uno o più utenti. La fonte può essere un valore statico selezionato da un elenco di utenti, un valore dinamico specificato da una variabile, oppure il risultato di una query sulla **collezione** di utenti.

![Configurazione Destinatari](https://static-docs.nocobase.com/20250710224421.png)

### Interfaccia Utente

I destinatari devono visualizzare il contenuto in copia conoscenza nel menu "CC per me" del Centro Attività. Può configurare i risultati del trigger e di qualsiasi nodo nel contesto del **flusso di lavoro** come blocchi di contenuto.

![Interfaccia Utente](https://static-docs.nocobase.com/20250710225400.png)

### Titolo Attività

Il titolo dell'attività è quello visualizzato nel Centro Attività. Può utilizzare variabili dal contesto del **flusso di lavoro** per generare dinamicamente il titolo.

![Titolo Attività](https://static-docs.nocobase.com/20250710225603.png)

## Centro Attività

Gli utenti possono visualizzare e gestire tutti i contenuti a loro inviati in copia conoscenza nel Centro Attività, filtrandoli e consultandoli in base allo stato di lettura.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Dopo la visualizzazione, può contrassegnare l'elemento come letto, e il numero di elementi non letti diminuirà di conseguenza.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)