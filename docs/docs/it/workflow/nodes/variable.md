---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Variabile

## Introduzione

È possibile dichiarare variabili all'interno di un **flusso di lavoro** o assegnare valori a variabili già dichiarate. Questa funzionalità è tipicamente utilizzata per archiviare dati temporanei all'interno del flusso.

## Creare un nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") all'interno del flusso per aggiungere un nodo "**Variabile**":

![Add Variable Node](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Configurare il nodo

### Modalità

Il nodo **Variabile** è simile alle variabili nella programmazione: deve essere dichiarato prima di poter essere utilizzato e di potergli assegnare un valore. Pertanto, quando crea un nodo **Variabile**, deve selezionarne la modalità. Sono disponibili due modalità:

![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Dichiarare una nuova variabile: Crea una nuova variabile.
- Assegnare a una variabile esistente: Assegna un valore a una variabile che è stata dichiarata in precedenza nel **flusso di lavoro**, il che equivale a modificarne il valore.

Quando il nodo che sta creando è il primo nodo **Variabile** nel **flusso di lavoro**, può selezionare solo la modalità di dichiarazione, poiché non ci sono ancora variabili disponibili per l'assegnazione.

Quando sceglie di assegnare un valore a una variabile dichiarata, deve anche selezionare la variabile di destinazione, ovvero il nodo in cui la variabile è stata dichiarata:

![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Valore

Il valore di una variabile può essere di qualsiasi tipo. Può essere una costante, come una stringa, un numero, un valore booleano o una data, oppure può essere un'altra variabile del **flusso di lavoro**.

Nella modalità di dichiarazione, impostare il valore della variabile equivale ad assegnarle un valore iniziale.

![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Nella modalità di assegnazione, impostare il valore della variabile equivale a modificare il valore della variabile di destinazione dichiarata con un nuovo valore. Gli utilizzi successivi recupereranno questo nuovo valore.

![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Utilizzare il valore della variabile

Nei nodi successivi al nodo **Variabile**, può utilizzare il valore della variabile selezionando la variabile dichiarata dal gruppo "**Variabili del nodo**". Ad esempio, in un nodo di query, utilizzi il valore della variabile come condizione di query:

![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Esempio

Uno scenario più utile per il nodo **Variabile** è all'interno dei rami, dove i nuovi valori vengono calcolati o uniti con i valori precedenti (simile a `reduce`/`concat` nella programmazione) e poi utilizzati dopo la chiusura del ramo. Di seguito è riportato un esempio di come utilizzare un ramo di ciclo e un nodo **Variabile** per concatenare una stringa di destinatari.

Innanzitutto, crei un **flusso di lavoro** attivato da una **collezione** che si attiva quando i dati della **collezione** "**Articoli**" vengono aggiornati, e precarichi i dati di associazione "**Autore**" correlati (per ottenere i destinatari):

![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Successivamente, crei un nodo **Variabile** per archiviare la stringa dei destinatari:

![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Poi, crei un nodo di ramo di ciclo per iterare gli autori dell'articolo e concatenare le loro informazioni di destinatario nella variabile dei destinatari:

![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

All'interno del ramo di ciclo, crei prima un nodo di calcolo per concatenare l'autore corrente con la stringa degli autori già archiviata:

![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Dopo il nodo di calcolo, crei un altro nodo **Variabile**. Selezioni la modalità di assegnazione, scelga il nodo **Variabile** dei destinatari come obiettivo di assegnazione e selezioni il risultato del nodo di calcolo come valore:

![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

In questo modo, dopo la chiusura del ramo di ciclo, la variabile dei destinatari archivierà la stringa dei destinatari di tutti gli autori dell'articolo. Successivamente, dopo il ciclo, può utilizzare un nodo di richiesta HTTP per richiamare un'API di invio e-mail, passando il valore della variabile dei destinatari come parametro del destinatario all'API:

![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

A questo punto, una semplice funzionalità di invio e-mail di massa è stata implementata utilizzando un ciclo e un nodo **Variabile**.