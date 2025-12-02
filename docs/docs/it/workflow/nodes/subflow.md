---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Richiamare un flusso di lavoro

## Introduzione

Permette di richiamare altri flussi di lavoro all'interno di un flusso di lavoro. È possibile utilizzare le variabili del flusso di lavoro corrente come input per il sotto-flusso di lavoro e l'output del sotto-flusso di lavoro come variabili nel flusso di lavoro corrente per l'uso nei nodi successivi.

Il processo di richiamo di un flusso di lavoro è illustrato nella figura seguente:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Richiamando i flussi di lavoro, può riutilizzare logiche di processo comuni, come l'invio di email, SMS, ecc., oppure suddividere un flusso di lavoro complesso in più sotto-flussi di lavoro per una gestione e manutenzione più semplici.

In sostanza, un flusso di lavoro non distingue se un processo sia un sotto-flusso di lavoro. Qualsiasi flusso di lavoro può essere richiamato come sotto-flusso di lavoro da altri flussi di lavoro, e può anche richiamare altri flussi di lavoro. Tutti i flussi di lavoro sono uguali; esiste solo la relazione di richiamo e di essere richiamato.

Allo stesso modo, l'utilizzo del richiamo di un flusso di lavoro avviene in due posizioni:

1.  Nel flusso di lavoro principale: Come richiamante, richiama altri flussi di lavoro tramite il nodo "Richiama flusso di lavoro".
2.  Nel sotto-flusso di lavoro: Come parte richiamata, salva le variabili che devono essere prodotte dal flusso di lavoro corrente tramite il nodo "Output del flusso di lavoro", che possono essere utilizzate dai nodi successivi nel flusso di lavoro che lo ha richiamato.

## Creare il nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso di lavoro per aggiungere un nodo "Richiama flusso di lavoro":

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Configurare il nodo

### Selezionare il flusso di lavoro

Selezioni il flusso di lavoro da richiamare. Può utilizzare la barra di ricerca per una ricerca rapida:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Suggerimento}
*   I flussi di lavoro disabilitati possono essere richiamati anche come sotto-flussi di lavoro.
*   Quando il flusso di lavoro corrente è in modalità sincrona, può richiamare solo sotto-flussi di lavoro che sono anch'essi in modalità sincrona.
:::

### Configurare le variabili del trigger del flusso di lavoro

Dopo aver selezionato un flusso di lavoro, deve anche configurare le variabili del trigger come dati di input per attivare il sotto-flusso di lavoro. Può selezionare direttamente dati statici o scegliere variabili dal flusso di lavoro corrente:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Diversi tipi di trigger richiedono variabili diverse, che possono essere configurate nel modulo secondo necessità.

## Nodo di output del flusso di lavoro

Faccia riferimento al contenuto del nodo [Output del flusso di lavoro](./output.md) per configurare le variabili di output del sotto-flusso di lavoro.

## Utilizzo dell'output del flusso di lavoro

Tornando al flusso di lavoro principale, negli altri nodi sotto il nodo "Richiama flusso di lavoro", quando desidera utilizzare il valore di output del sotto-flusso di lavoro, può selezionare il risultato del nodo "Richiama flusso di lavoro". Se il sotto-flusso di lavoro produce un valore semplice, come una stringa, un numero, un valore booleano, una data (la data è una stringa in formato UTC), ecc., può essere utilizzato direttamente; se si tratta di un oggetto complesso (come un oggetto da una collezione), è necessario prima mapparlo tramite un nodo di analisi JSON prima di poter utilizzare le sue proprietà; altrimenti, può essere utilizzato solo come oggetto intero.

Se il sotto-flusso di lavoro non ha un nodo di output del flusso di lavoro configurato, o se non ha un valore di output, allora quando utilizza il risultato del nodo "Richiama flusso di lavoro" nel flusso di lavoro principale, otterrà solo un valore nullo (`null`).