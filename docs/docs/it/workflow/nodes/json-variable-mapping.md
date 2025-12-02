---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Mappatura Variabili JSON

> v1.6.0

## Introduzione

Utilizzato per mappare strutture JSON complesse dai risultati dei nodi a monte in variabili, da utilizzare nei nodi successivi. Ad esempio, dopo aver mappato i risultati dei nodi di azione SQL e di richiesta HTTP, è possibile utilizzare i loro valori di proprietà nei nodi successivi.

:::info{title=Suggerimento}
A differenza del nodo di Calcolo JSON, il nodo di Mappatura Variabili JSON non supporta espressioni personalizzate e non si basa su un motore di terze parti. È utilizzato solo per mappare i valori delle proprietà in una struttura JSON, ma è più semplice da usare.
:::

## Creazione del Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ('+') nel flusso per aggiungere un nodo 'Mappatura Variabili JSON':

![Creazione del Nodo](https://static-docs.nocobase.com/20250113173635.png)

## Configurazione del Nodo

### Fonte Dati

La fonte dati può essere il risultato di un nodo a monte o un oggetto dati nel contesto del processo. Di solito è un oggetto dati non strutturato, come il risultato di un nodo SQL o di un nodo di richiesta HTTP.

![Fonte Dati](https://static-docs.nocobase.com/20250113173720.png)

### Inserire Dati di Esempio

Incolli i dati di esempio e clicchi sul pulsante di analisi per generare automaticamente un elenco di variabili:

![Inserire Dati di Esempio](https://static-docs.nocobase.com/20250113182327.png)

Se ci sono variabili nell'elenco generato automaticamente che non le servono, può cliccare sul pulsante di eliminazione per rimuoverle.

:::info{title=Suggerimento}
I dati di esempio non sono il risultato finale dell'esecuzione; sono utilizzati solo per aiutare a generare l'elenco delle variabili.
:::

### Il Percorso Include l'Indice dell'Array

Se non selezionato, il contenuto dell'array verrà mappato secondo il metodo predefinito di gestione delle variabili dei flussi di lavoro NocoBase. Ad esempio, inserendo il seguente esempio:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Nelle variabili generate, `b.c` rappresenterà l'array `[2, 3]`.

Se questa opzione è selezionata, il percorso della variabile includerà l'indice dell'array, ad esempio, `b.0.c` e `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Quando si includono gli indici dell'array, è necessario assicurarsi che gli indici dell'array nei dati di input siano coerenti; altrimenti si verificherà un errore di analisi.

## Utilizzo nei Nodi Successivi

Nella configurazione dei nodi successivi, può utilizzare le variabili generate dal nodo di Mappatura Variabili JSON:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Anche se la struttura JSON può essere complessa, dopo la mappatura è sufficiente selezionare la variabile per il percorso corrispondente.