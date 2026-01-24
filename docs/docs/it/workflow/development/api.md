:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Riferimento API

## Lato server

Le API disponibili nella struttura del pacchetto lato server sono mostrate nel seguente codice:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Classe del plugin per i flussi di lavoro.

Di solito, durante l'esecuzione dell'applicazione, può richiamare `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` ovunque sia possibile ottenere l'istanza dell'applicazione `app` per recuperare l'istanza del plugin del flusso di lavoro (di seguito denominata `plugin`).

#### `registerTrigger()`

Estende e registra un nuovo tipo di trigger.

**Firma**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parametri**

| Parametro | Tipo                        | Descrizione                        |
| --------- | --------------------------- | ---------------------------------- |
| `type`    | `string`                    | Identificatore del tipo di trigger |
| `trigger` | `typeof Trigger \| Trigger` | Tipo o istanza del trigger         |

**Esempio**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Estende e registra un nuovo tipo di nodo.

**Firma**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parametri**

| Parametro   | Tipo                                | Descrizione                     |
| ----------- | ----------------------------------- | ------------------------------- |
| `type`      | `string`                            | Identificatore del tipo di istruzione |
| `instruction` | `typeof Instruction \| Instruction` | Tipo o istanza dell'istruzione |

**Esempio**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Attiva un flusso di lavoro specifico. Utilizzato principalmente nei trigger personalizzati per avviare il flusso di lavoro corrispondente quando viene rilevato un evento personalizzato specifico.

**Firma**

`trigger(workflow: Workflow, context: any)`

**Parametri**

| Parametro  | Tipo          | Descrizione                           |
| ---------- | ------------- | ------------------------------------- |
| `workflow` | `WorkflowModel` | L'oggetto del flusso di lavoro da attivare |
| `context`  | `object`      | Dati di contesto forniti al momento dell'attivazione |

:::info{title=Suggerimento}
Attualmente `context` è un campo obbligatorio. Se non viene fornito, il flusso di lavoro non verrà attivato.
:::

**Esempio**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Riprende l'esecuzione di un flusso di lavoro in attesa con un compito di nodo specifico.

- Solo i flussi di lavoro nello stato di attesa (`EXECUTION_STATUS.STARTED`) possono essere ripresi.
- Solo i compiti di nodo nello stato di sospensione (`JOB_STATUS.PENDING`) possono essere ripresi.

**Firma**

`resume(job: JobModel)`

**Parametri**

| Parametro | Tipo       | Descrizione                   |
| --------- | ---------- | ----------------------------- |
| `job`     | `JobModel` | L'oggetto del compito aggiornato |

:::info{title=Suggerimento}
L'oggetto del compito passato è generalmente un oggetto aggiornato, e il suo `status` viene di solito aggiornato a un valore diverso da `JOB_STATUS.PENDING`, altrimenti continuerà ad essere in attesa.
:::

**Esempio**

Per i dettagli, consulti il [codice sorgente](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Classe base per i trigger, utilizzata per estendere i tipi di trigger personalizzati.

| Parametro     | Tipo                                                        | Descrizione                                 |
| ------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Costruttore                                 |
| `on?`         | `(workflow: WorkflowModel): void`                           | Gestore eventi dopo l'attivazione di un flusso di lavoro |
| `off?`        | `(workflow: WorkflowModel): void`                           | Gestore eventi dopo la disattivazione di un flusso di lavoro |

`on`/`off` vengono utilizzati per registrare/deregistrare i listener di eventi quando un flusso di lavoro viene attivato/disattivato. Il parametro passato è l'istanza del flusso di lavoro corrispondente al trigger, che può essere elaborata in base alla configurazione. Alcuni tipi di trigger che hanno già listener di eventi globali potrebbero non aver bisogno di implementare questi due metodi. Ad esempio, in un trigger temporizzato, può registrare un timer in `on` e deregistrarlo in `off`.

### `Instruction`

Classe base per i tipi di istruzione, utilizzata per estendere i tipi di istruzione personalizzati.

| Parametro   | Tipo                                                            | Descrizione                                                        |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Costruttore                                                        |
| `run`       | `Runner`                                                        | Logica di esecuzione per il primo ingresso nel nodo                |
| `resume?`   | `Runner`                                                        | Logica di esecuzione per l'ingresso nel nodo dopo la ripresa da un'interruzione |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Fornisce il contenuto delle variabili locali per il ramo generato dal nodo corrispondente |

**Tipi correlati**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

Per `getScope`, può fare riferimento all'[implementazione del nodo di ciclo](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), che viene utilizzata per fornire il contenuto delle variabili locali per i rami.

### `EXECUTION_STATUS`

Una tabella di costanti per gli stati del piano di esecuzione del flusso di lavoro, utilizzata per identificare lo stato attuale del piano di esecuzione corrispondente.

| Nome costante                   | Significato                        |
| ------------------------------- | ---------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | In coda                            |
| `EXECUTION_STATUS.STARTED`      | Avviato                            |
| `EXECUTION_STATUS.RESOLVED`     | Completato con successo            |
| `EXECUTION_STATUS.FAILED`       | Fallito                            |
| `EXECUTION_STATUS.ERROR`        | Errore di esecuzione               |
| `EXECUTION_STATUS.ABORTED`      | Interrotto                         |
| `EXECUTION_STATUS.CANCELED`     | Annullato                          |
| `EXECUTION_STATUS.REJECTED`     | Rifiutato                          |
| `EXECUTION_STATUS.RETRY_NEEDED` | Esecuzione non riuscita, riprovare |

Ad eccezione dei primi tre, tutti gli altri rappresentano uno stato di fallimento, ma possono essere utilizzati per descrivere diverse cause di fallimento.

### `JOB_STATUS`

Una tabella di costanti per gli stati dei compiti dei nodi del flusso di lavoro, utilizzata per identificare lo stato attuale del compito del nodo corrispondente. Lo stato generato dal nodo influisce anche sullo stato dell'intero piano di esecuzione.

| Nome costante             | Significato                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | In sospeso: L'esecuzione ha raggiunto questo nodo, ma l'istruzione richiede di sospendere e attendere |
| `JOB_STATUS.RESOLVED`     | Completato con successo                                                  |
| `JOB_STATUS.FAILED`       | Fallito: L'esecuzione di questo nodo non ha soddisfatto le condizioni configurate |
| `JOB_STATUS.ERROR`        | Errore: Si è verificato un errore non gestito durante l'esecuzione di questo nodo |
| `JOB_STATUS.ABORTED`      | Interrotto: L'esecuzione di questo nodo è stata terminata da altra logica dopo essere stata in stato di sospensione |
| `JOB_STATUS.CANCELED`     | Annullato: L'esecuzione di questo nodo è stata annullata manualmente dopo essere stata in stato di sospensione |
| `JOB_STATUS.REJECTED`     | Rifiutato: La continuazione di questo nodo è stata rifiutata manualmente dopo essere stata in stato di sospensione |
| `JOB_STATUS.RETRY_NEEDED` | Esecuzione non riuscita, riprovare                                       |

## Lato client

Le API disponibili nella struttura del pacchetto lato client sono mostrate nel seguente codice:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registra il pannello di configurazione corrispondente al tipo di trigger.

**Firma**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parametri**

| Parametro | Tipo                        | Descrizione                                                     |
| --------- | --------------------------- | --------------------------------------------------------------- |
| `type`    | `string`                    | Identificatore del tipo di trigger, coerente con l'identificatore utilizzato per la registrazione |
| `trigger` | `typeof Trigger \| Trigger` | Tipo o istanza del trigger                                      |

#### `registerInstruction()`

Registra il pannello di configurazione corrispondente al tipo di nodo.

**Firma**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parametri**

| Parametro   | Tipo                                | Descrizione                                                     |
| ----------- | ----------------------------------- | --------------------------------------------------------------- |
| `type`      | `string`                            | Identificatore del tipo di nodo, coerente con l'identificatore utilizzato per la registrazione |
| `instruction` | `typeof Instruction \| Instruction` | Tipo o istanza dell'istruzione                                  |

#### `registerInstructionGroup()`

Registra un gruppo di tipi di nodo. NocoBase fornisce 4 gruppi di tipi di nodo predefiniti:

*   `'control'`: Controllo
*   `'collection'`: Operazioni sulle [collezione](#)
*   `'manual'`: Elaborazione manuale
*   `'extended'`: Altre estensioni

Se ha bisogno di estendere altri gruppi, può utilizzare questo metodo per registrarli.

**Firma**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parametri**

| Parametro | Tipo                | Descrizione                                                     |
| --------- | ------------------- | --------------------------------------------------------------- |
| `type`    | `string`            | Identificatore del gruppo di nodi, coerente con l'identificatore utilizzato per la registrazione |
| `group`   | `{ label: string }` | Informazioni sul gruppo, attualmente include solo il titolo     |

**Esempio**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Classe base per i trigger, utilizzata per estendere i tipi di trigger personalizzati.

| Parametro       | Tipo                                                             | Descrizione                                                                 |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `title`         | `string`                                                         | Nome del tipo di trigger                                                    |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Collezione di elementi di configurazione del trigger                        |
| `scope?`        | `{ [key: string]: any }`                                         | Collezione di oggetti che potrebbero essere utilizzati nello Schema degli elementi di configurazione |
| `components?`   | `{ [key: string]: React.FC }`                                    | Collezione di componenti che potrebbero essere utilizzati nello Schema degli elementi di configurazione |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Accessore del valore per i dati di contesto del trigger                    |

- Se `useVariables` non è impostato, significa che questo tipo di trigger non fornisce una funzione di recupero del valore e i dati di contesto del trigger non possono essere selezionati nei nodi del [flusso di lavoro](#).

### `Instruction`

Classe base per le istruzioni, utilizzata per estendere i tipi di nodo personalizzati.

| Parametro          | Tipo                                                    | Descrizione                                                                                                |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `group`            | `string`                                                | Identificatore del gruppo di tipi di nodo, opzioni attualmente disponibili: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`         | `Record<string, ISchema>`                               | Collezione di elementi di configurazione del nodo                                                          |
| `scope?`           | `Record<string, Function>`                              | Collezione di oggetti che potrebbero essere utilizzati nello Schema degli elementi di configurazione       |
| `components?`      | `Record<string, React.FC>`                              | Collezione di componenti che potrebbero essere utilizzati nello Schema degli elementi di configurazione   |
| `Component?`       | `React.FC`                                              | Componente di rendering personalizzato per il nodo                                                         |
| `useVariables?`    | `(node, options: UseVariableOptions) => VariableOption` | Metodo per il nodo per fornire opzioni di variabili del nodo                                               |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Metodo per il nodo per fornire opzioni di variabili locali del ramo                                        |
| `useInitializers?` | `(node) => SchemaInitializerItemType`                   | Metodo per il nodo per fornire opzioni di inizializzatori                                                  |
| `isAvailable?`     | `(ctx: NodeAvailableContext) => boolean`                | Metodo per determinare se il nodo è disponibile                                                            |

**Tipi correlati**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Se `useVariables` non è impostato, significa che questo tipo di nodo non fornisce una funzione di recupero del valore e i dati risultanti di questo tipo di nodo non possono essere selezionati nei nodi del flusso di lavoro. Se il valore del risultato è singolo (non selezionabile), può restituire un contenuto statico che esprime le informazioni corrispondenti (veda: [codice sorgente del nodo di calcolo](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Se è necessario che sia selezionabile (ad esempio, una proprietà di un oggetto), può personalizzare l'output del componente di selezione corrispondente (veda: [codice sorgente del nodo di creazione dati](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` è un componente di rendering personalizzato per il nodo. Quando il rendering predefinito del nodo non è sufficiente, può essere completamente sovrascritto e utilizzato per un rendering personalizzato della vista del nodo. Ad esempio, se ha bisogno di fornire più pulsanti di azione o altre interazioni per il nodo iniziale di un tipo di ramo, dovrà utilizzare questo metodo (veda: [codice sorgente del ramo parallelo](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` viene utilizzato per fornire un metodo per l'inizializzazione dei blocchi. Ad esempio, in un nodo manuale, può inizializzare i blocchi utente correlati in base ai nodi a monte. Se questo metodo viene fornito, sarà disponibile durante l'inizializzazione dei blocchi nella configurazione dell'interfaccia del nodo manuale (veda: [codice sorgente del nodo di creazione dati](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` viene utilizzato principalmente per determinare se un nodo può essere utilizzato (aggiunto) nell'ambiente corrente. L'ambiente corrente include il [flusso di lavoro](#) attuale, i nodi a monte e l'indice del ramo corrente.