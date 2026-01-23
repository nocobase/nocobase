---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Richiesta HTTP

## Introduzione

Quando ha bisogno di interagire con un altro sistema web, può utilizzare il nodo Richiesta HTTP. Durante l'esecuzione, questo nodo invia una richiesta HTTP all'indirizzo specificato in base alla sua configurazione. Può trasportare dati in formato JSON o `application/x-www-form-urlencoded` per completare l'interazione con sistemi esterni.

Se ha familiarità con strumenti per l'invio di richieste come Postman, potrà padroneggiare rapidamente l'uso del nodo Richiesta HTTP. A differenza di questi strumenti, tutti i parametri nel nodo Richiesta HTTP possono utilizzare variabili di contesto dal flusso di lavoro corrente, consentendo un'integrazione organica con i processi aziendali del sistema.

## Installazione

Plugin integrato, non richiede installazione.

## Creazione di un nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Richiesta HTTP":

![Richiesta HTTP_Aggiungi](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Configurazione del nodo

![Nodo Richiesta HTTP_Configurazione](https://static-docs.nocobase.com/2fcb29af66b892fa704add252e2974a52.png)

### Metodo di richiesta

Metodi di richiesta HTTP opzionali: `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.

### URL della richiesta

L'URL del servizio HTTP, che deve includere la parte del protocollo (`http://` o `https://`). Si raccomanda l'uso di `https://`.

### Formato dei dati della richiesta

Questo è il `Content-Type` nell'intestazione della richiesta. Per i formati supportati, consulti la sezione "[Corpo della richiesta](#corpo-della-richiesta)".

### Configurazione dell'intestazione della richiesta

Coppie chiave-valore per la sezione Header della richiesta. I valori possono utilizzare variabili dal contesto del flusso di lavoro.

:::info{title=Suggerimento}
L'intestazione della richiesta `Content-Type` è già configurata tramite il formato dei dati della richiesta. Non è necessario compilarla qui e qualsiasi sovrascrittura sarà inefficace.
:::

### Parametri della richiesta

Coppie chiave-valore per la sezione query della richiesta. I valori possono utilizzare variabili dal contesto del flusso di lavoro.

### Corpo della richiesta

La parte Body della richiesta. Sono supportati diversi formati a seconda del `Content-Type` selezionato.

#### `application/json`

Supporta testo in formato JSON standard. Può inserire variabili dal contesto del flusso di lavoro utilizzando il pulsante variabile nell'angolo in alto a destra dell'editor di testo.

:::info{title=Suggerimento}
Le variabili devono essere utilizzate all'interno di una stringa JSON, ad esempio: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Formato coppia chiave-valore. I valori possono utilizzare variabili dal contesto del flusso di lavoro. Quando sono incluse variabili, verranno analizzate come un modello di stringa e concatenate nel valore finale della stringa.

#### `application/xml`

Supporta testo in formato XML standard. Può inserire variabili dal contesto del flusso di lavoro utilizzando il pulsante variabile nell'angolo in alto a destra dell'editor di testo.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Supporta coppie chiave-valore per i dati del modulo. I file possono essere caricati quando il tipo di dati è impostato su un oggetto file. I file possono essere selezionati solo tramite variabili da oggetti file esistenti nel contesto, come i risultati di una query su una collezione di file o dati correlati da una collezione di file associata.

:::info{title=Suggerimento}
Quando seleziona i dati del file, si assicuri che la variabile corrisponda a un singolo oggetto file, non a un elenco di file (in una query di relazione uno-a-molti o molti-a-molti, il valore del campo di relazione sarà un array).
:::

### Impostazioni di timeout

Quando una richiesta non risponde per un lungo periodo, l'impostazione di timeout può essere utilizzata per annullarne l'esecuzione. Se la richiesta va in timeout, il flusso di lavoro corrente verrà terminato prematuramente con uno stato di errore.

### Ignora errori

Il nodo di richiesta considera gli stati con codici di stato HTTP standard compresi tra `200` e `299` (inclusi) come successi, e tutti gli altri come errori. Se l'opzione "Ignora richieste fallite e continua il flusso di lavoro" è selezionata, i nodi successivi nel flusso di lavoro continueranno a essere eseguiti anche se la richiesta fallisce.

## Utilizzo del risultato della risposta

Il risultato della risposta di una richiesta HTTP può essere analizzato dal nodo [Analisi JSON](./json-query.md) per essere utilizzato nei nodi successivi.

Dalla versione `v1.0.0-alpha.16`, tre parti del risultato della risposta del nodo di richiesta possono essere utilizzate come variabili separate:

*   Codice di stato della risposta
*   Intestazioni della risposta
*   Dati della risposta

![Nodo Richiesta HTTP_Utilizzo del risultato della risposta](https://static-docs.nocobase.com/20240529110610.png)

Il codice di stato della risposta è solitamente un codice di stato HTTP standard in formato numerico, come `200`, `403`, ecc. (come fornito dal provider del servizio).

Le intestazioni della risposta sono in formato JSON. Sia le intestazioni che i dati della risposta in formato JSON devono comunque essere analizzati utilizzando un nodo JSON prima di poter essere utilizzati.

## Esempio

Ad esempio, possiamo utilizzare il nodo di richiesta per connetterci a una piattaforma cloud per inviare SMS di notifica. La configurazione per un'API SMS cloud potrebbe essere simile alla seguente (dovrà consultare la documentazione specifica dell'API per adattare i parametri):

![Nodo Richiesta HTTP_Configurazione](https://static-docs.nocobase.com/20240515124004.png)

Quando il flusso di lavoro attiva questo nodo, chiamerà l'API SMS con il contenuto configurato. Se la richiesta ha successo, un SMS verrà inviato tramite il servizio SMS cloud.