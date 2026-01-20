:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# API-referens

## Serversidan

De API:er som är tillgängliga i serverpaketstrukturen visas i följande kod:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Klassen för arbetsflödes-plugin.

Vanligtvis, under applikationens körtid, kan ni anropa `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` var som helst där ni kan få applikationsinstansen `app` för att hämta instansen av arbetsflödes-pluginen (nedan kallad `plugin`).

#### `registerTrigger()`

Utökar och registrerar en ny typ av utlösare.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parametrar**

| Parameter | Typ | Beskrivning |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | Identifierare för utlösartyp |
| `trigger` | `typeof Trigger \| Trigger` | Utlösartyp eller instans |

**Exempel**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // utlös arbetsflödet
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // lyssna på en händelse för att utlösa arbetsflödet
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // ta bort lyssnare
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // hämta instans av arbetsflödes-plugin
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registrera utlösare
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Utökar och registrerar en ny nodtyp.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parametrar**

| Parameter | Typ | Beskrivning |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | Identifierare för instruktionstyp |
| `instruction` | `typeof Instruction \| Instruction` | Instruktionstyp eller instans |

**Exempel**

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
    // hämta instans av arbetsflödes-plugin
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registrera instruktion
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Utlöser ett specifikt arbetsflöde. Används främst i anpassade utlösare för att utlösa det motsvarande arbetsflödet när en specifik anpassad händelse upptäcks.

**Signatur**

`trigger(workflow: Workflow, context: any)`

**Parametrar**
| Parameter | Typ | Beskrivning |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Arbetsflödesobjektet som ska utlösas |
| `context` | `object` | Kontextdata som tillhandahålls vid utlösning |

:::info{title=Tips}
`context` är för närvarande ett obligatoriskt fält. Om det inte tillhandahålls kommer arbetsflödet inte att utlösas.
:::

**Exempel**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // registrera händelse
    this.timer = setInterval(() => {
      // utlös arbetsflödet
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Återupptar ett väntande arbetsflöde med en specifik noduppgift.

- Endast arbetsflöden i väntande tillstånd (`EXECUTION_STATUS.STARTED`) kan återupptas.
- Endast noduppgifter i väntande tillstånd (`JOB_STATUS.PENDING`) kan återupptas.

**Signatur**

`resume(job: JobModel)`

**Parametrar**

| Parameter | Typ | Beskrivning |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | Det uppdaterade uppgiftsobjektet |

:::info{title=Tips}
Det skickade uppgiftsobjektet är vanligtvis ett uppdaterat objekt, och dess `status` uppdateras vanligtvis till ett värde som inte är `JOB_STATUS.PENDING`, annars kommer det att fortsätta att vänta.
:::

**Exempel**

Se [källkoden](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) för mer information.

### `Trigger`

Basklass för utlösare, används för att utöka anpassade utlösartyper.

| Parameter | Typ | Beskrivning |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor |
| `on?` | `(workflow: WorkflowModel): void` | Händelsehanterare efter att ett arbetsflöde har aktiverats |
| `off?` | `(workflow: WorkflowModel): void` | Händelsehanterare efter att ett arbetsflöde har inaktiverats |

`on`/`off` används för att registrera/avregistrera händelselyssnare när ett arbetsflöde aktiveras/inaktiveras. Den skickade parametern är arbetsflödesinstansen som motsvarar utlösaren, och kan hanteras enligt den relevanta konfigurationen. Vissa utlösartyper som redan har globalt lyssnade händelser behöver inte implementera dessa två metoder. Till exempel, i en schemalagd utlösare kan ni registrera en timer i `on` och avregistrera den i `off`.

### `Instruction`

Basklass för instruktionstyper, används för att utöka anpassade instruktionstyper.

| Parameter | Typ | Beskrivning |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor |
| `run` | `Runner` | Exekveringslogik för första inträdet i noden |
| `resume?` | `Runner` | Exekveringslogik för inträde i noden efter återupptagande från ett avbrott |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Tillhandahåller lokalt variabelinnehåll för den gren som genereras av den motsvarande noden |

**Relaterade typer**

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

För `getScope` kan ni referera till [implementeringen av loopnoden](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), som används för att tillhandahålla lokalt variabelinnehåll för grenar.

### `EXECUTION_STATUS`

En konstanttabell för statusar för arbetsflödesexekveringsplaner, används för att identifiera den aktuella statusen för den motsvarande exekveringsplanen.

| Konstantnamn | Betydelse |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | I kö |
| `EXECUTION_STATUS.STARTED` | Påbörjad |
| `EXECUTION_STATUS.RESOLVED` | Slutförd |
| `EXECUTION_STATUS.FAILED` | Misslyckad |
| `EXECUTION_STATUS.ERROR` | Exekveringsfel |
| `EXECUTION_STATUS.ABORTED` | Avbruten |
| `EXECUTION_STATUS.CANCELED` | Annullerad |
| `EXECUTION_STATUS.REJECTED` | Avvisad |
| `EXECUTION_STATUS.RETRY_NEEDED` | Ej slutförd, kräver omförsök |

Förutom de tre första representerar alla andra ett misslyckat tillstånd, men kan användas för att beskriva olika orsaker till felet.

### `JOB_STATUS`

En konstanttabell för statusar för arbetsflödesnoduppgifter, används för att identifiera den aktuella statusen för den motsvarande noduppgiften. Statusen som genereras av noden påverkar också statusen för hela exekveringsplanen.

| Konstantnamn | Betydelse |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | Väntande: Exekveringen har nått denna nod, men instruktionen kräver att den pausas och väntar |
| `JOB_STATUS.RESOLVED` | Slutförd |
| `JOB_STATUS.FAILED` | Misslyckad: Exekveringen av denna nod uppfyllde inte de konfigurerade villkoren |
| `JOB_STATUS.ERROR` | Fel: Ett ohanterat fel uppstod under exekveringen av denna nod |
| `JOB_STATUS.ABORTED` | Avbruten: Exekveringen av denna nod avslutades av annan logik efter att ha varit i väntande tillstånd |
| `JOB_STATUS.CANCELED` | Annullerad: Exekveringen av denna nod avbröts manuellt efter att ha varit i väntande tillstånd |
| `JOB_STATUS.REJECTED` | Avvisad: Fortsättningen av denna nod avvisades manuellt efter att ha varit i väntande tillstånd |
| `JOB_STATUS.RETRY_NEEDED` | Ej slutförd, kräver omförsök |

## Klientsidan

De API:er som är tillgängliga i klientpaketstrukturen visas i följande kod:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registrerar konfigurationspanelen för utlösartypen.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parametrar**

| Parameter | Typ | Beskrivning |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | Identifierare för utlösartyp, konsekvent med den identifierare som används för registrering |
| `trigger` | `typeof Trigger \| Trigger` | Utlösartyp eller instans |

#### `registerInstruction()`

Registrerar konfigurationspanelen för nodtypen.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parametrar**

| Parameter | Typ | Beskrivning |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | Identifierare för nodtyp, konsekvent med den identifierare som används för registrering |
| `instruction` | `typeof Instruction \| Instruction` | Nodtyp eller instans |

#### `registerInstructionGroup()`

Registrerar en nodtypsgrupp. NocoBase tillhandahåller som standard 4 nodtypsgrupper:

* `'control'`: Kontroll
* `'collection'`: `samling`-operationer
* `'manual'`: Manuell hantering
* `'extended'` : Andra utökningar

Om ni behöver utöka med andra grupper kan ni använda denna metod för att registrera dem.

**Signatur**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parametrar**

| Parameter | Typ | Beskrivning |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | Identifierare för nodgrupp, konsekvent med den identifierare som används för registrering |
| `group` | `{ label: string }` | Gruppinformation, innehåller för närvarande endast titeln |

**Exempel**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Basklass för utlösare, används för att utöka anpassade utlösartyper.

| Parameter | Typ | Beskrivning |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | Namn på utlösartyp |
| `fieldset` | `{ [key: string]: ISchema }` | `samling` av utlösarkonfigurationsposter |
| `scope?` | `{ [key: string]: any }` | `samling` av objekt som kan användas i konfigurationspostens Schema |
| `components?` | `{ [key: string]: React.FC }` | `samling` av komponenter som kan användas i konfigurationspostens Schema |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Värdeåtkomst för utlösarens kontextdata |

- Om `useVariables` inte är inställt betyder det att denna typ av utlösare inte tillhandahåller en funktion för värdehämtning, och utlösarens kontextdata kan inte väljas i arbetsflödets noder.

### `Instruction`

Basklass för instruktioner, används för att utöka anpassade nodtyper.

| Parameter | Typ | Beskrivning |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | Identifierare för nodtypsgrupp, för närvarande tillgängliga alternativ: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | `samling` av nodkonfigurationsposter |
| `scope?` | `Record<string, Function>` | `samling` av objekt som kan användas i konfigurationspostens Schema |
| `components?` | `Record<string, React.FC>` | `samling` av komponenter som kan användas i konfigurationspostens Schema |
| `Component?` | `React.FC` | Anpassad renderingskomponent för noden |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Metod för noden att tillhandahålla nodvariabelalternativ |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Metod för noden att tillhandahålla lokala variabelalternativ för grenar |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Metod för noden att tillhandahålla initialiseringsalternativ |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Metod för att avgöra om noden är tillgänglig |

**Relaterade typer**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Om `useVariables` inte är inställt betyder det att denna nodtyp inte tillhandahåller en funktion för värdehämtning, och resultatdata från denna typ av nod kan inte väljas i arbetsflödets noder. Om resultatvärdet är singulärt (inte valbart), kan ni returnera statiskt innehåll som uttrycker den motsvarande informationen (se: [källkod för beräkningsnod](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Om det behöver vara valbart (t.ex. en egenskap i ett objekt), kan ni anpassa utdata från den motsvarande valkomponenten (se: [källkod för nod för att skapa data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` är en anpassad renderingskomponent för noden. När standardrendering av noden inte räcker till kan den helt åsidosättas för anpassad nodvyrendering. Om ni till exempel behöver tillhandahålla fler åtgärdsknappar eller andra interaktioner för startnoden av en grenstyp, måste ni använda denna metod (se: [källkod för parallell gren](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` används för att tillhandahålla en metod för att initialisera block. Till exempel, i en manuell nod kan ni initialisera relaterade användarblock baserat på uppströmsnoder. Om denna metod tillhandahålls, kommer den att vara tillgänglig vid initialisering av block i den manuella nodens gränssnittskonfiguration (se: [källkod för nod för att skapa data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` används främst för att avgöra om en nod kan användas (läggas till) i den aktuella miljön. Den aktuella miljön inkluderar det aktuella arbetsflödet, uppströmsnoder och det aktuella grenindexet.