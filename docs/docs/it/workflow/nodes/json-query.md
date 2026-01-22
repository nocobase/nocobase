---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Calcolo JSON

## Introduzione

Questo nodo le permette di calcolare o trasformare dati JSON complessi generati dai nodi a monte (upstream) utilizzando diversi motori di calcolo JSON. In questo modo, i dati vengono preparati per essere utilizzati dai nodi successivi. Ad esempio, può trasformare i risultati di operazioni SQL o richieste HTTP nei valori e nei formati di variabile desiderati, rendendoli pronti per l'uso.

## Creare un nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") all'interno del processo per aggiungere un nodo "**Calcolo JSON**":

![Creare un nodo](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Suggerimento}
Di solito, il nodo **Calcolo JSON** viene creato al di sotto di altri nodi dati per poterli analizzare.
:::

## Configurazione del nodo

### Motore di analisi

Il nodo **Calcolo JSON** supporta diverse sintassi tramite vari motori di analisi. Può scegliere quello che preferisce in base alle sue esigenze e alle caratteristiche di ciascun motore. Attualmente, sono supportati tre motori di analisi:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Selezione del motore](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Fonte dati

La **fonte dati** può essere il risultato di un nodo a monte o un oggetto dati nel contesto del **flusso di lavoro**. Di solito si tratta di un oggetto dati senza una struttura predefinita, come il risultato di un nodo SQL o di un nodo di richiesta HTTP.

![Fonte dati](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Suggerimento}
Di solito, gli oggetti dati dei nodi correlati alle **collezioni** sono già strutturati tramite le informazioni di configurazione della **collezione** e, in genere, non richiedono l'analisi tramite il nodo **Calcolo JSON**.
:::

### Espressione di analisi

Espressioni di analisi personalizzate basate sulle sue esigenze di analisi e sul motore di analisi scelto.

![Espressione di analisi](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Suggerimento}
I diversi motori offrono sintassi di analisi differenti. Per maggiori dettagli, la preghiamo di consultare la documentazione nei link.
:::

A partire dalla versione `v1.0.0-alpha.15`, le espressioni supportano le variabili. Le variabili vengono pre-analizzate prima dell'esecuzione del motore specifico, sostituendo i valori delle variabili con stringhe specifiche secondo le regole dei template di stringa, e concatenandole con altre stringhe statiche nell'espressione per formare l'espressione finale. Questa funzionalità è molto utile quando è necessario costruire espressioni dinamicamente, ad esempio quando alcuni contenuti JSON richiedono una chiave dinamica per l'analisi.

### Mappatura delle proprietà

Quando il risultato del calcolo è un oggetto (o un array di oggetti), può ulteriormente mappare le proprietà desiderate a variabili figlie tramite la mappatura delle proprietà, per utilizzarle nei nodi successivi.

![Mappatura delle proprietà](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Suggerimento}
Per un risultato che sia un oggetto (o un array di oggetti), se non viene eseguita la mappatura delle proprietà, l'intero oggetto (o array di oggetti) verrà salvato come singola variabile nel risultato del nodo, e i valori delle proprietà dell'oggetto non potranno essere utilizzati direttamente come variabili.
:::

## Esempio

Supponiamo che i dati da analizzare provengano da un nodo SQL precedente utilizzato per interrogare i dati, e che il suo risultato sia un insieme di dati sugli ordini:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Se dobbiamo analizzare e calcolare il prezzo totale dei due ordini presenti nei dati, e assemblarlo con l'ID dell'ordine corrispondente in un oggetto per aggiornare il prezzo totale dell'ordine, possiamo configurarlo come segue:

![Esempio - Configurazione analisi SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Selezioni il motore di analisi JSONata;
2. Selezioni il risultato del nodo SQL come **fonte dati**;
3. Utilizzi l'espressione JSONata `$[0].{"id": id, "total": products.(price * quantity)}` per l'analisi;
4. Selezioni la mappatura delle proprietà per mappare `id` e `total` a variabili figlie;

Il risultato finale dell'analisi è il seguente:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Successivamente, può iterare sull'array di ordini risultante per aggiornare il prezzo totale degli ordini.

![Aggiornare il prezzo totale dell'ordine corrispondente](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)