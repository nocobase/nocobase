:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Plugin

In NocoBase, il **plugin client** è il modo principale per estendere e personalizzare le funzionalità frontend. Ereditando la classe base `Plugin` fornita da `@nocobase/client`, gli sviluppatori possono registrare logiche, aggiungere componenti di pagina, estendere menu o integrare funzionalità di terze parti nelle diverse fasi del ciclo di vita.

## Struttura della classe Plugin

Ecco la struttura di un plugin client di base:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Eseguito dopo l'aggiunta del plugin
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Eseguito prima del caricamento del plugin
    console.log('Before plugin load');
  }

  async load() {
    // Eseguito al caricamento del plugin, registra route, componenti UI, ecc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Descrizione del ciclo di vita

Ogni plugin attraversa le seguenti fasi del ciclo di vita in sequenza quando il browser viene aggiornato o l'applicazione viene inizializzata:

| Metodo del ciclo di vita | Momento di esecuzione | Descrizione |
|--------------------------|-----------------------|-------------|
| **afterAdd()**           | Eseguito immediatamente dopo che il plugin è stato aggiunto al gestore dei plugin. | L'istanza del plugin è già stata creata, ma non tutti i plugin hanno completato l'inizializzazione. È adatto per inizializzazioni leggere, come la lettura della configurazione o il binding di eventi di base. |
| **beforeLoad()**         | Eseguito prima del metodo `load()` di tutti i plugin. | Può accedere a tutte le istanze dei plugin abilitati (`this.app.pm.get()`). È adatto per logiche di preparazione che dipendono da altri plugin. |
| **load()**               | Eseguito al caricamento del plugin. | Questo metodo viene eseguito dopo che tutti i `beforeLoad()` dei plugin sono stati completati. È adatto per registrare route frontend, componenti UI e altre logiche centrali. |

## Ordine di esecuzione

Ogni volta che il browser viene aggiornato, i metodi vengono eseguiti nell'ordine `afterAdd()` → `beforeLoad()` → `load()`.

## Contesto del Plugin e FlowEngine

A partire da NocoBase 2.0, le API di estensione lato client sono principalmente concentrate in **FlowEngine**. Nella classe del plugin, può ottenere l'istanza del motore tramite `this.engine`.

```ts
// Accede al contesto del motore nel metodo load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Per maggiori dettagli, consulti:
- [FlowEngine](/flow-engine)
- [Contesto](./context.md)