---
title: "API-Referenz"
description: "API-Referenz für die Workflow-Erweiterung: Workflow Model, Ausführungs-Context der Nodes, Trigger-API, Variablenübergabe."
keywords: "Workflow,API-Referenz,Workflow Model,Node Context,Trigger API,NocoBase"
---

:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# API-Referenz

## Server

Die im Server-Paket verfügbare API sieht wie folgt aus:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Die Klasse des Workflow-Plugins.

In der Regel können Sie an einer beliebigen Stelle, an der Sie zur Laufzeit der Anwendung Zugriff auf die Anwendungsinstanz `app` haben, mit `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` die Instanz des Workflow-Plugins abrufen (im Folgenden mit `plugin` bezeichnet).

#### `registerTrigger()`

Registriert einen neuen Triggertyp.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Triggertyps |
| `trigger` | `typeof Trigger \| Trigger` | Triggertyp oder -instanz |

**Beispiel**

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

Registriert einen neuen Node-Typ.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Instruction-Typs |
| `instruction` | `typeof Instruction \| Instruction` | Instruction-Typ oder -Instanz |

**Beispiel**

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

Löst einen bestimmten Workflow aus. Wird hauptsächlich in benutzerdefinierten Triggern verwendet, um beim Eintreten eines bestimmten Events den entsprechenden Workflow zu starten.

**Signatur**

`trigger(workflow: Workflow, context: any)`

**Parameter**
| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Auszulösender Workflow |
| `context` | `object` | Beim Auslösen bereitgestellte Kontextdaten |

:::info{title=Tipp}
`context` ist derzeit erforderlich; ohne Angabe wird der Workflow nicht ausgelöst.
:::

**Beispiel**

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

Setzt einen pausierten Workflow mit einer bestimmten Node-Aufgabe fort.

- Nur Workflows im Wartezustand (`EXECUTION_STATUS.STARTED`) können fortgesetzt werden.
- Nur Node-Tasks im Wartezustand (`JOB_STATUS.PENDING`) können fortgesetzt werden.

**Signatur**

`resume(job: JobModel)`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `job` | `JobModel` | Aktualisiertes Task-Objekt |

:::info{title=Tipp}
Das übergebene Task-Objekt sollte aktualisiert sein und üblicherweise `status` auf einen anderen Wert als `JOB_STATUS.PENDING` gesetzt haben, sonst bleibt es im Wartezustand.
:::

**Beispiel**

Siehe [Quellcode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Basis-Triggerklasse zum Erweitern um eigene Triggertypen.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor |
| `on?` | `(workflow: WorkflowModel): void` | Event-Handler nach Aktivieren des Workflows |
| `off?` | `(workflow: WorkflowModel): void` | Event-Handler nach Deaktivieren des Workflows |

`on`/`off` registrieren bzw. deregistrieren Event-Listener beim Aktivieren/Deaktivieren des Workflows; der übergebene Parameter ist die Workflow-Instanz, sodass Sie sie entsprechend der Konfiguration verarbeiten können. Triggertypen, die bereits global lauschen, müssen diese Methoden nicht implementieren. Beispielsweise können Sie in einem Cron-Trigger den Timer in `on` registrieren und in `off` wieder abmelden.

### `Instruction`

Basisklasse für Instructions zum Erweitern um eigene Node-Typen.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor |
| `run` | `Runner` | Logik beim erstmaligen Eintreten in den Node |
| `resume?` | `Runner` | Logik beim Wiedereintreten in den Node nach Unterbrechung |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Liefert lokale Variablen für den Branch des Nodes |

**Zugehörige Typen**

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

`getScope` lässt sich anhand der [Implementierung des Loop-Nodes](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83) nachvollziehen und wird genutzt, um den Branch lokale Variablen bereitzustellen.

### `EXECUTION_STATUS`

Konstanten für den Status eines Ausführungsplans eines Workflows.

| Konstante | Bedeutung |
| --- | --- |
| `EXECUTION_STATUS.QUEUEING` | In der Warteschlange |
| `EXECUTION_STATUS.STARTED` | In Ausführung |
| `EXECUTION_STATUS.RESOLVED` | Erfolgreich abgeschlossen |
| `EXECUTION_STATUS.FAILED` | Fehlgeschlagen |
| `EXECUTION_STATUS.ERROR` | Ausführungsfehler |
| `EXECUTION_STATUS.ABORTED` | Abgebrochen |
| `EXECUTION_STATUS.CANCELED` | Gecancelt |
| `EXECUTION_STATUS.REJECTED` | Abgelehnt |
| `EXECUTION_STATUS.RETRY_NEEDED` | Nicht erfolgreich, Retry nötig |

Außer den ersten drei stehen alle anderen Werte für Fehlerzustände, sie unterscheiden sich aber im Grund des Fehlschlags.

### `JOB_STATUS`

Konstanten für den Status eines Node-Tasks im Workflow.

| Konstante | Bedeutung |
| --- | --- |
| `JOB_STATUS.PENDING` | Wartend: Node erreicht, aber durch Instruction zum Warten angehalten |
| `JOB_STATUS.RESOLVED` | Erfolgreich abgeschlossen |
| `JOB_STATUS.FAILED` | Fehlgeschlagen: Bedingungen nicht erfüllt |
| `JOB_STATUS.ERROR` | Fehler: nicht abgefangener Fehler bei der Ausführung |
| `JOB_STATUS.ABORTED` | Beendet: Node nach Wartezustand durch andere Logik beendet |
| `JOB_STATUS.CANCELED` | Abgebrochen: Node nach Wartezustand manuell abgebrochen |
| `JOB_STATUS.REJECTED` | Abgelehnt: Node nach Wartezustand manuell abgelehnt |
| `JOB_STATUS.RETRY_NEEDED` | Nicht erfolgreich, Retry nötig |

## Client

Die im Client-Paket verfügbare API sieht wie folgt aus:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registriert das Konfigurationspanel für einen Triggertyp.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Triggertyps, identisch mit dem bei der Registrierung verwendeten |
| `trigger` | `typeof Trigger \| Trigger` | Triggertyp oder -instanz |

#### `registerInstruction()`

Registriert das Konfigurationspanel für einen Node-Typ.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Node-Typs, identisch mit dem bei der Registrierung verwendeten |
| `instruction` | `typeof Instruction \| Instruction` | Node-Typ oder -Instanz |

#### `registerInstructionGroup()`

Registriert eine Node-Gruppe. NocoBase liefert standardmäßig vier Node-Gruppen:

* `'control'`: Ablaufsteuerung
* `'collection'`: Datenoperationen
* `'manual'`: Manuelle Verarbeitung
* `'extended'`: Weitere Erweiterungen

Wenn Sie eine andere Gruppe hinzufügen möchten, verwenden Sie diese Methode.

**Signatur**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner der Node-Gruppe, identisch mit dem bei der Registrierung verwendeten |
| `group` | `{ label: string }` | Gruppeninformationen, enthält derzeit nur den Titel |

**Beispiel**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Basis-Triggerklasse zum Erweitern um eigene Triggertypen.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `title` | `string` | Name des Triggertyps |
| `fieldset` | `{ [key: string]: ISchema }` | Konfigurationsoptionen des Triggers |
| `scope?` | `{ [key: string]: any }` | Im Konfigurations-Schema verwendete Objekte |
| `components?` | `{ [key: string]: React.FC }` | Im Konfigurations-Schema verwendete Komponenten |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Wertzugriff für die Trigger-Kontextdaten |

- Wenn `useVariables` nicht gesetzt ist, bietet dieser Triggertyp keine Wertentnahme an, und seine Kontextdaten können in den Workflow-Nodes nicht ausgewählt werden.

### `Instruction`

Basisklasse für Instructions zum Erweitern um eigene Node-Typen.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `group` | `string` | Bezeichner der Node-Gruppe, derzeit auswählbar: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | Konfigurationsoptionen des Nodes |
| `scope?` | `Record<string, Function>` | Im Konfigurations-Schema verwendete Objekte |
| `components?` | `Record<string, React.FC>` | Im Konfigurations-Schema verwendete Komponenten |
| `Component?` | `React.FC` | Eigene Render-Komponente des Nodes |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Methode, die die Variablenoptionen des Nodes liefert |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Methode, die die lokalen Variablen des Branches liefert |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Methode, die Initialisierungsoptionen des Nodes liefert |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Bedingung, ob der Node verfügbar ist |

**Zugehörige Typen**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Wenn `useVariables` nicht gesetzt ist, bietet dieser Node-Typ keine Wertentnahme an, und seine Ergebnisdaten können in Workflow-Nodes nicht ausgewählt werden. Wenn der Wert eindeutig ist (nicht auswählbar), reicht ein statischer Inhalt zur Beschreibung der Information (Beispiel: [Quellcode des Calculation-Nodes](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Falls auswählbar (z. B. eine Eigenschaft eines Objekts), kann eine eigene Auswahl-Komponente bereitgestellt werden (Beispiel: [Quellcode des Create-Nodes](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` ist die eigene Render-Komponente des Nodes; verwenden Sie sie, wenn das Standard-Rendering nicht ausreicht und Sie es vollständig ersetzen möchten. Etwa wenn ein Branch-Start-Node zusätzliche Action-Buttons oder andere Interaktionen anbieten soll (Beispiel: [Parallel-Branch Quellcode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` liefert Methoden zur Initialisierung von Blocks, beispielsweise um in einem Manual-Node abhängig vom Upstream-Node entsprechende Benutzer-Blocks zu initialisieren. Wenn definiert, sind diese in der Konfiguration des Manual-Nodes verfügbar (Beispiel: [Quellcode des Create-Nodes](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` entscheidet, ob der Node in der aktuellen Umgebung (aktueller Workflow, Upstream-Nodes, aktueller Branch-Index usw.) verfügbar ist (hinzugefügt werden kann).
