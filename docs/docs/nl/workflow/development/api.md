:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API Referentie

## Serverkant

De API's die u kunt gebruiken in de serverkant pakketstructuur, ziet u in de onderstaande code:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

De klasse voor de **workflow** **plugin**.

Gewoonlijk, tijdens de runtime van de applicatie, kunt u overal waar u de applicatie-instantie `app` kunt verkrijgen, `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` aanroepen om de **workflow** **plugin**-instantie te verkrijgen (hierna aangeduid als `plugin`).

#### `registerTrigger()`

Hiermee breidt u de functionaliteit uit en registreert u een nieuw triggertype.

**Handtekening**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameters**

| Parameter | Type | Beschrijving |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | Identificatie voor het triggertype |
| `trigger` | `typeof Trigger \| Trigger` | Triggertype of -instantie |

**Voorbeeld**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // activeer workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // luister naar een gebeurtenis om de workflow te activeren
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // verwijder de listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // verkrijg de workflow plugin-instantie
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registreer de trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Hiermee breidt u de functionaliteit uit en registreert u een nieuw knooppunttype.

**Handtekening**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameters**

| Parameter | Type | Beschrijving |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | Identificatie voor het instructietype |
| `instruction` | `typeof Instruction \| Instruction` | Instructietype of -instantie |

**Voorbeeld**

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
    // verkrijg de workflow plugin-instantie
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registreer de instructie
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Activeert een specifieke **workflow**. Dit wordt voornamelijk gebruikt in aangepaste triggers om de corresponderende **workflow** te activeren wanneer een specifieke aangepaste gebeurtenis wordt gedetecteerd.

**Handtekening**

`trigger(workflow: Workflow, context: any)`

**Parameters**
| Parameter | Type | Beschrijving |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Het **workflow**-object dat moet worden geactiveerd |
| `context` | `object` | Contextdata die wordt meegegeven bij het activeren |

:::info{title=Tip}
`context` is momenteel een verplicht item. Als u dit niet opgeeft, wordt de **workflow** niet geactiveerd.
:::

**Voorbeeld**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // registreer gebeurtenis
    this.timer = setInterval(() => {
      // activeer workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Hervat de uitvoering van een wachtende **workflow** met een specifieke knooppunt-taak.

- Alleen **workflows** die zich in de wachtende status (`EXECUTION_STATUS.STARTED`) bevinden, kunnen worden hervat.
- Alleen knooppunt-taken die zich in de `JOB_STATUS.PENDING` status bevinden, kunnen worden hervat.

**Handtekening**

`resume(job: JobModel)`

**Parameters**

| Parameter | Type | Beschrijving |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | Het bijgewerkte taakobject |

:::info{title=Tip}
Het meegegeven taakobject is over het algemeen een bijgewerkt object, en de `status` wordt meestal bijgewerkt naar een waarde anders dan `JOB_STATUS.PENDING`, anders blijft het wachten.
:::

**Voorbeeld**

Zie de [broncode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) voor details.

### `Trigger`

De basisklasse voor triggers, gebruikt om aangepaste triggertypen uit te breiden.

| Parameter | Type | Uitleg |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor |
| `on?` | `(workflow: WorkflowModel): void` | Gebeurtenishandler na het inschakelen van een **workflow** |
| `off?` | `(workflow: WorkflowModel): void` | Gebeurtenishandler na het uitschakelen van een **workflow** |

`on`/`off` worden gebruikt om gebeurtenislisteners te registreren/deregistreren wanneer een **workflow** wordt ingeschakeld/uitgeschakeld. De meegegeven parameter is de **workflow**-instantie die overeenkomt met de trigger, die u kunt verwerken volgens de bijbehorende configuratie. Sommige triggertypen die al globaal naar gebeurtenissen luisteren, hoeven deze twee methoden mogelijk niet te implementeren. In een geplande trigger kunt u bijvoorbeeld een timer registreren in `on` en deze deregistreren in `off`.

### `Instruction`

De basisklasse voor instructietypen, gebruikt om aangepaste instructietypen uit te breiden.

| Parameter | Type | Uitleg |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor |
| `run` | `Runner` | Uitvoeringslogica voor de eerste keer dat het knooppunt wordt betreden |
| `resume?` | `Runner` | Uitvoeringslogica voor het betreden van het knooppunt na het hervatten vanuit een onderbreking |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Biedt de lokale variabele-inhoud voor de tak die door het corresponderende knooppunt wordt gegenereerd |

**Gerelateerde typen**

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

Voor `getScope` kunt u verwijzen naar de [implementatie van het lus-knooppunt](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), dat wordt gebruikt om lokale variabele-inhoud voor takken te bieden.

### `EXECUTION_STATUS`

Een constantentabel voor de statussen van **workflow**-uitvoeringsplannen, gebruikt om de huidige status van het corresponderende uitvoeringsplan te identificeren.

| Constante naam | Betekenis |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | In de wachtrij |
| `EXECUTION_STATUS.STARTED` | Gestart |
| `EXECUTION_STATUS.RESOLVED` | Succesvol voltooid |
| `EXECUTION_STATUS.FAILED` | Mislukt |
| `EXECUTION_STATUS.ERROR` | Fout |
| `EXECUTION_STATUS.ABORTED` | Afgebroken |
| `EXECUTION_STATUS.CANCELED` | Geannuleerd |
| `EXECUTION_STATUS.REJECTED` | Geweigerd |
| `EXECUTION_STATUS.RETRY_NEEDED` | Niet succesvol uitgevoerd, opnieuw proberen nodig |

Behalve de eerste drie, vertegenwoordigen alle andere een mislukte status, maar kunnen ze worden gebruikt om verschillende redenen voor mislukking te beschrijven.

### `JOB_STATUS`

Een constantentabel voor de statussen van **workflow**-knooppunt-taken, gebruikt om de huidige status van de corresponderende knooppunt-taak te identificeren. De status die door het knooppunt wordt gegenereerd, beïnvloedt ook de status van het gehele uitvoeringsplan.

| Constante naam | Betekenis |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | Wachtend: Uitvoering heeft dit knooppunt bereikt, maar de instructie vereist dat het wordt opgeschort en wacht. |
| `JOB_STATUS.RESOLVED` | Succesvol voltooid |
| `JOB_STATUS.FAILED` | Mislukt: De uitvoering van dit knooppunt voldeed niet aan de geconfigureerde voorwaarden. |
| `JOB_STATUS.ERROR` | Fout: Er is een onverwerkte fout opgetreden tijdens de uitvoering van dit knooppunt. |
| `JOB_STATUS.ABORTED` | Afgebroken: De uitvoering van dit knooppunt is beëindigd door andere logica nadat het in een wachtende status verkeerde. |
| `JOB_STATUS.CANCELED` | Geannuleerd: De uitvoering van dit knooppunt is handmatig geannuleerd nadat het in een wachtende status verkeerde. |
| `JOB_STATUS.REJECTED` | Geweigerd: De voortzetting van dit knooppunt is handmatig geweigerd nadat het in een wachtende status verkeerde. |
| `JOB_STATUS.RETRY_NEEDED` | Niet succesvol uitgevoerd, opnieuw proberen nodig |

## Clientkant

De API's die u kunt gebruiken in de clientkant pakketstructuur, ziet u in de onderstaande code:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registreert het configuratiepaneel voor het triggertype.

**Handtekening**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameters**

| Parameter | Type | Uitleg |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | Identificatie voor het triggertype, consistent met de identificatie die voor registratie wordt gebruikt. |
| `trigger` | `typeof Trigger \| Trigger` | Triggertype of -instantie |

#### `registerInstruction()`

Registreert het configuratiepaneel voor het knooppunttype.

**Handtekening**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameters**

| Parameter | Type | Uitleg |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | Identificatie voor het knooppunttype, consistent met de identificatie die voor registratie wordt gebruikt. |
| `instruction` | `typeof Instruction \| Instruction` | Knooppunttype of -instantie |

#### `registerInstructionGroup()`

Registreert een knooppunttypegroep. NocoBase biedt standaard 4 knooppunttypegroepen:

* `'control'` (besturing)
* `'collection'` (**collectie**-bewerkingen)
* `'manual'` (handmatige verwerking)
* `'extended'` (overige uitbreidingen)

Als u andere groepen wilt uitbreiden, kunt u deze methode gebruiken om ze te registreren.

**Handtekening**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameters**

| Parameter | Type | Uitleg |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | Identificatie voor de knooppuntgroep, consistent met de identificatie die voor registratie wordt gebruikt. |
| `group` | `{ label: string }` | Groepsinformatie, bevat momenteel alleen de titel. |

**Voorbeeld**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

De basisklasse voor triggers, gebruikt om aangepaste triggertypen uit te breiden.

| Parameter | Type | Uitleg |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | Naam van het triggertype |
| `fieldset` | `{ [key: string]: ISchema }` | **Collectie** van triggerconfiguratie-items |
| `scope?` | `{ [key: string]: any }` | **Collectie** van objecten die mogelijk worden gebruikt in het configuratie-item Schema |
| `components?` | `{ [key: string]: React.FC }` | **Collectie** van componenten die mogelijk worden gebruikt in het configuratie-item Schema |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Waardetoegang voor triggercontextdata |

- Als `useVariables` niet is ingesteld, betekent dit dat dit type trigger geen functie voor waarde-opvraging biedt, en dat de contextdata van de trigger niet kan worden geselecteerd in de **workflow**-knooppunten.

### `Instruction`

De basisklasse voor instructies, gebruikt om aangepaste knooppunttypen uit te breiden.

| Parameter | Type | Uitleg |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | Identificatie voor de knooppunttypegroep, momenteel beschikbare opties: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | **Collectie** van knooppuntconfiguratie-items |
| `scope?` | `Record<string, Function>` | **Collectie** van objecten die mogelijk worden gebruikt in het configuratie-item Schema |
| `components?` | `Record<string, React.FC>` | **Collectie** van componenten die mogelijk worden gebruikt in het configuratie-item Schema |
| `Component?` | `React.FC` | Aangepaste rendercomponent voor het knooppunt |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Methode voor het knooppunt om variabele-opties voor knooppunten te bieden |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Methode voor het knooppunt om lokale variabele-opties voor takken te bieden |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Methode voor het knooppunt om initializer-opties te bieden |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Methode om te bepalen of het knooppunt beschikbaar is |

**Gerelateerde typen**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Als `useVariables` niet is ingesteld, betekent dit dat dit knooppunttype geen functie voor waarde-opvraging biedt, en dat de resultaatdata van dit type knooppunt niet kan worden geselecteerd in de **workflow**-knooppunten. Als de resultaatwaarde enkelvoudig is (niet selecteerbaar), kunt u statische inhoud retourneren die de corresponderende informatie uitdrukt (zie: [broncode van het rekenknooppunt](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Als het selecteerbaar moet zijn (bijvoorbeeld een eigenschap van een Object), kunt u de corresponderende selectiecomponent-uitvoer aanpassen (zie: [broncode van het knooppunt voor het aanmaken van data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` is een aangepaste rendercomponent voor het knooppunt. Wanneer de standaard weergave van het knooppunt niet volstaat, kunt u deze volledig overschrijven en gebruiken voor aangepaste knooppuntweergave. Als u bijvoorbeeld meer actieknoppen of andere interacties wilt bieden voor het startknooppunt van een taktype, dan moet u deze methode gebruiken (zie: [broncode van de parallelle tak](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` wordt gebruikt om een methode te bieden voor het initialiseren van blokken. In een handmatig knooppunt kunt u bijvoorbeeld gerelateerde gebruikersblokken initialiseren op basis van upstream-knooppunten. Als deze methode wordt geboden, is deze beschikbaar bij het initialiseren van blokken in de interfaceconfiguratie van het handmatige knooppunt (zie: [broncode van het knooppunt voor het aanmaken van data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` wordt voornamelijk gebruikt om te bepalen of een knooppunt in de huidige omgeving kan worden gebruikt (toegevoegd). De huidige omgeving omvat de huidige **workflow**, upstream-knooppunten en de huidige takindex, enz.