---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Script JavaScript

## Introduzione

Il nodo Script JavaScript Le permette di eseguire uno script JavaScript personalizzato lato server all'interno di un flusso di lavoro. Lo script può utilizzare variabili provenienti dai nodi precedenti del flusso come parametri e il suo valore di ritorno può essere fornito ai nodi successivi.

Lo script viene eseguito in un thread di lavoro sul server dell'applicazione NocoBase e supporta la maggior parte delle funzionalità di Node.js. Tuttavia, esistono alcune differenze rispetto all'ambiente di esecuzione nativo. Per maggiori dettagli, consulti l' [Elenco delle funzionalità](#特性列表).

## Creare un nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configurazione del nodo

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametri

Utilizzati per passare variabili o valori statici dal contesto del flusso di lavoro allo script, affinché possano essere usati dalla logica del codice. `name` è il nome del parametro, che diventa il nome della variabile una volta passato allo script. `value` è il valore del parametro, che può essere una variabile o una costante.

### Contenuto dello script

Il contenuto dello script può essere considerato una funzione. Può scrivere qualsiasi codice JavaScript supportato nell'ambiente Node.js e utilizzare l'istruzione `return` per restituire un valore come risultato dell'esecuzione del nodo, che potrà essere usato come variabile dai nodi successivi.

Dopo aver scritto il codice, può cliccare sul pulsante di test sotto l'editor per aprire una finestra di dialogo di esecuzione di test, dove potrà inserire valori statici nei parametri per un'esecuzione simulata. Dopo l'esecuzione, potrà visualizzare il valore di ritorno e il contenuto dell'output (log) nella finestra di dialogo.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Impostazione del timeout

L'unità è in millisecondi. Un valore di `0` indica che non è impostato alcun timeout.

### Continua in caso di errore

Se selezionato, i nodi successivi verranno comunque eseguiti anche se lo script incontra un errore o va in timeout.

:::info{title="Nota"}
Se lo script va in errore, non avrà un valore di ritorno e il risultato del nodo verrà popolato con il messaggio di errore. Se i nodi successivi utilizzano la variabile di risultato del nodo script, è necessario gestirla con cautela.
:::

## Elenco delle funzionalità

### Versione di Node.js

Corrisponde alla versione di Node.js in esecuzione nell'applicazione principale.

### Supporto moduli

I moduli possono essere utilizzati nello script con alcune limitazioni, in modo coerente con CommonJS, usando la direttiva `require()` per importarli.

Supporta i moduli nativi di Node.js e i moduli installati in `node_modules` (incluse le dipendenze già utilizzate da NocoBase). I moduli da rendere disponibili al codice devono essere dichiarati nella variabile d'ambiente dell'applicazione `WORKFLOW_SCRIPT_MODULES`, con più nomi di pacchetto separati da virgole, ad esempio:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Nota"}
I moduli non dichiarati nella variabile d'ambiente `WORKFLOW_SCRIPT_MODULES` **non possono** essere utilizzati nello script, anche se sono nativi di Node.js o già installati in `node_modules`. Questa politica può essere utilizzata a livello operativo per controllare l'elenco dei moduli disponibili agli utenti, evitando che gli script abbiano permessi eccessivi in alcuni scenari.
:::

In un ambiente non distribuito da sorgente, se un modulo non è installato in `node_modules`, può installare manualmente il pacchetto richiesto nella directory `storage`. Ad esempio, per utilizzare il pacchetto `exceljs`, può eseguire i seguenti passaggi:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Quindi aggiunga il percorso relativo (o assoluto) del pacchetto, basato sulla CWD (current working directory) dell'applicazione, alla variabile d'ambiente `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Potrà quindi utilizzare il pacchetto `exceljs` nel Suo script:

```js
const ExcelJS = require('exceljs');
// ...
```

### Variabili globali

**Non supporta** variabili globali come `global`, `process`, `__dirname` e `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parametri di input

I parametri configurati nel nodo diventano variabili globali all'interno dello script e possono essere utilizzati direttamente. I parametri passati allo script supportano solo tipi di base, come `boolean`, `number`, `string`, `object` e array. Un oggetto `Date` verrà convertito in una stringa in formato ISO quando passato. Altri tipi complessi, come le istanze di classi personalizzate, non possono essere passati direttamente.

### Valore di ritorno

L'istruzione `return` può essere utilizzata per restituire tipi di dati di base (con le stesse regole dei parametri) al nodo come risultato. Se l'istruzione `return` non viene richiamata nel codice, l'esecuzione del nodo non avrà alcun valore di ritorno.

```js
return 123;
```

### Output (Log)

**Supporta** l'uso di `console` per l'output dei log.

```js
console.log('hello world!');
```

Quando il flusso di lavoro viene eseguito, l'output del nodo script viene registrato anche nel file di log del flusso di lavoro corrispondente.

### Asincrono

**Supporta** l'uso di `async` per definire funzioni asincrone e `await` per richiamarle. **Supporta** l'uso dell'oggetto globale `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timer

Per utilizzare metodi come `setTimeout`, `setInterval` o `setImmediate`, è necessario importarli dal pacchetto `timers` di Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```