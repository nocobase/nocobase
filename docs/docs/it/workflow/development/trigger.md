:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Estendere i tipi di trigger

Ogni flusso di lavoro deve essere configurato con un trigger specifico, che funge da punto di ingresso per l'avvio dell'esecuzione del processo.

Un tipo di trigger rappresenta solitamente un evento specifico dell'ambiente di sistema. Durante il ciclo di vita dell'applicazione, qualsiasi componente che offra eventi sottoscrivibili può essere utilizzato per definire un tipo di trigger. Ad esempio, la ricezione di richieste, le operazioni sulle collezioni, le attività pianificate, ecc.

I tipi di trigger vengono registrati nella tabella dei trigger del plugin basandosi su un identificatore stringa. Il plugin Flusso di lavoro include diversi trigger predefiniti:

- `'collection'` : Attivato da operazioni sulle collezioni;
- `'schedule'` : Attivato da attività pianificate;
- `'action'` : Attivato da eventi post-azione;

I tipi di trigger estesi devono garantire che i loro identificatori siano unici. L'implementazione per la sottoscrizione/annullamento della sottoscrizione del trigger viene registrata lato server, mentre l'implementazione per l'interfaccia di configurazione viene registrata lato client.

## Lato server

Qualsiasi trigger deve ereditare dalla classe base `Trigger` e implementare i metodi `on`/`off`, che vengono utilizzati rispettivamente per sottoscrivere e annullare la sottoscrizione a specifici eventi ambientali. Nel metodo `on`, deve chiamare `this.workflow.trigger()` all'interno della funzione di callback dell'evento specifico per attivare infine l'evento. Nel metodo `off`, deve eseguire il lavoro di pulizia pertinente per l'annullamento della sottoscrizione.

`this.workflow` è l'istanza del plugin del flusso di lavoro passata al costruttore della classe base `Trigger`.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Successivamente, nel plugin che estende il flusso di lavoro, registri l'istanza del trigger con il motore del flusso di lavoro:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Dopo l'avvio e il caricamento del server, il trigger di tipo `'interval'` potrà essere aggiunto ed eseguito.

## Lato client

La parte lato client fornisce principalmente un'interfaccia di configurazione basata sugli elementi di configurazione richiesti dal tipo di trigger. Ogni tipo di trigger deve anche registrare la sua configurazione di tipo corrispondente con il plugin Flusso di lavoro.

Ad esempio, per il trigger di esecuzione pianificata menzionato sopra, definisca l'elemento di configurazione del tempo di intervallo (`interval`) richiesto nel modulo dell'interfaccia di configurazione:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Quindi, registri questo tipo di trigger con l'istanza del plugin del flusso di lavoro all'interno del plugin esteso:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Dopodiché, il nuovo tipo di trigger sarà visibile nell'interfaccia di configurazione del flusso di lavoro.

:::info{title=Nota}
L'identificatore del tipo di trigger registrato lato client deve essere coerente con quello lato server, altrimenti si verificheranno errori.
:::

Per altri dettagli sulla definizione dei tipi di trigger, La invitiamo a consultare la sezione [Riferimento API del Flusso di lavoro](./api#pluginregisterTrigger).