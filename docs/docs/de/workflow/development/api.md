---
title: "API-Referenz"
description: "API-Referenz für die Workflow-Erweiterung: Workflow Model, Knotenausführungskontext, Trigger-API, Variablenübergabe."
keywords: "Workflow,API-Referenz,Workflow Model,Knotenkontext,Trigger-API,NocoBase"
---

# API-Referenz

## Serverseitig

Die im serverseitigen Paket verfügbaren APIs sind im folgenden Code dargestellt:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Klasse des Workflow-Plugins.

Zur Laufzeit der Anwendung können Sie an jeder Stelle, an der Sie Zugriff auf die Anwendungsinstanz `app` haben, mit `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` die Instanz des Workflow-Plugins abrufen (im Folgenden als `plugin` bezeichnet).

#### `registerTrigger()`

Erweitert und registriert einen neuen Trigger-Typ.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameter**

| Parameter | Typ                         | Beschreibung               |
| --------- | --------------------------- | -------------------------- |
| `type`    | `string`                    | Bezeichner des Trigger-Typs |
| `trigger` | `typeof Trigger \| Trigger` | Trigger-Typ oder -Instanz  |

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

Erweitert und registriert einen neuen Knoten-Typ.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameter**

| Parameter     | Typ                                 | Beschreibung                  |
| ------------- | ----------------------------------- | ----------------------------- |
| `type`        | `string`                            | Bezeichner des Instruction-Typs |
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

Löst einen bestimmten Workflow aus. Wird hauptsächlich in benutzerdefinierten Triggern verwendet, um den entsprechenden Workflow auszulösen, wenn ein bestimmtes benutzerdefiniertes Ereignis erkannt wird.

**Signatur**

`trigger(workflow: Workflow, context: any)`

**Parameter**
| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Das auszulösende Workflow-Objekt |
| `context` | `object` | Beim Auslösen bereitgestellte Kontextdaten |

:::info{title=Hinweis}
`context` ist derzeit ein Pflichtfeld. Wird es nicht angegeben, wird der Workflow nicht ausgelöst.
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

Setzt einen wartenden Workflow mit einem bestimmten Knoten-Job fort.

- Nur Workflows im Wartezustand (`EXECUTION_STATUS.STARTED`) können fortgesetzt werden.
- Nur Knoten-Jobs im Status „ausstehend" (`JOB_STATUS.PENDING`) können fortgesetzt werden.

**Signatur**

`resume(job: JobModel)`

**Parameter**

| Parameter | Typ        | Beschreibung              |
| --------- | ---------- | ------------------------- |
| `job`     | `JobModel` | Das aktualisierte Job-Objekt |

:::info{title=Hinweis}
Das übergebene Job-Objekt ist in der Regel ein aktualisiertes Objekt, dessen `status` üblicherweise auf einen anderen Wert als `JOB_STATUS.PENDING` gesetzt wurde, da es andernfalls weiterhin im Wartezustand verbleibt.
:::

**Beispiel**

Siehe [Quellcode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) für Details.

### `Trigger`

Die Basisklasse für Trigger, die zum Erweitern benutzerdefinierter Trigger-Typen verwendet wird.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Parameter     | Typ                                                         | Beschreibung                                     |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor                                      |
| `on?`         | `(workflow: WorkflowModel): void`                           | Event-Handler nach Aktivieren eines Workflows    |
| `off?`        | `(workflow: WorkflowModel): void`                           | Event-Handler nach Deaktivieren eines Workflows  |

`on`/`off` werden zum Registrieren bzw. Deregistrieren von Event-Listenern beim Aktivieren/Deaktivieren eines Workflows verwendet. Der übergebene Parameter ist die dem Trigger zugehörige Workflow-Instanz, die entsprechend der Konfiguration verarbeitet werden kann. Manche Trigger-Typen, die bereits global lauschende Ereignisse besitzen, müssen diese beiden Methoden nicht implementieren. Beispielsweise können Sie in einem zeitgesteuerten Trigger den Timer in `on` registrieren und in `off` wieder abmelden.

### `Instruction`

Die Basisklasse für Instruction-Typen, die zum Erweitern benutzerdefinierter Instruction-Typen verwendet wird.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Parameter     | Typ                                                             | Beschreibung                                                                       |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor                                                                        |
| `run`         | `Runner`                                                        | Ausführungslogik beim erstmaligen Eintreten in den Knoten                          |
| `resume?`     | `Runner`                                                        | Ausführungslogik beim Wiedereintreten in den Knoten nach einer Unterbrechung       |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Stellt den lokalen Variableninhalt für den vom entsprechenden Knoten erzeugten Branch bereit |

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

Für `getScope` können Sie sich an der [Implementierung des Loop-Knotens](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83) orientieren, die dazu dient, lokalen Variableninhalt für Branches bereitzustellen.

### `EXECUTION_STATUS`

Eine Konstantentabelle für Workflow-Ausführungsplanstatus, die zur Identifizierung des aktuellen Status des entsprechenden Ausführungsplans verwendet wird.

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| Konstante                       | Bedeutung                                       |
| ------------------------------- | ----------------------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | In der Warteschlange                            |
| `EXECUTION_STATUS.STARTED`      | Gestartet                                       |
| `EXECUTION_STATUS.RESOLVED`     | Erfolgreich abgeschlossen                       |
| `EXECUTION_STATUS.FAILED`       | Fehlgeschlagen                                  |
| `EXECUTION_STATUS.ERROR`        | Fehler                                          |
| `EXECUTION_STATUS.ABORTED`      | Abgebrochen                                     |
| `EXECUTION_STATUS.CANCELED`     | Storniert                                       |
| `EXECUTION_STATUS.REJECTED`     | Abgelehnt                                       |
| `EXECUTION_STATUS.RETRY_NEEDED` | Nicht erfolgreich ausgeführt, Wiederholung nötig |

Mit Ausnahme der ersten drei stehen alle übrigen für einen Fehlerzustand, können aber zur Beschreibung unterschiedlicher Fehlerursachen verwendet werden.

### `JOB_STATUS`

Eine Konstantentabelle für Workflow-Knoten-Job-Status, die zur Identifizierung des aktuellen Status des entsprechenden Knoten-Jobs verwendet wird. Der vom Knoten erzeugte Status beeinflusst auch den Status des gesamten Ausführungsplans.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Konstante                  | Bedeutung                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | Ausstehend: Die Ausführung hat diesen Knoten erreicht, aber die Instruction erfordert ein Anhalten und Warten |
| `JOB_STATUS.RESOLVED`     | Erfolgreich abgeschlossen                                                                              |
| `JOB_STATUS.FAILED`       | Fehlgeschlagen: Die Ausführung dieses Knotens hat die konfigurierten Bedingungen nicht erfüllt         |
| `JOB_STATUS.ERROR`        | Fehler: Bei der Ausführung dieses Knotens ist ein nicht behandelter Fehler aufgetreten                 |
| `JOB_STATUS.ABORTED`      | Beendet: Die Ausführung dieses Knotens wurde nach dem Wartezustand durch andere Logik beendet          |
| `JOB_STATUS.CANCELED`     | Storniert: Die Ausführung dieses Knotens wurde nach dem Wartezustand manuell storniert                 |
| `JOB_STATUS.REJECTED`     | Abgelehnt: Die Fortsetzung dieses Knotens wurde nach dem Wartezustand manuell abgelehnt               |
| `JOB_STATUS.RETRY_NEEDED` | Nicht erfolgreich ausgeführt, Wiederholung nötig                                                       |

## Clientseitig

Die im clientseitigen Paket verfügbaren APIs sind im folgenden Code dargestellt:

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Klasse des Workflow-Client-Plugins. Wird üblicherweise über `this.app.pm.get('workflow')` abgerufen.

#### `registerTrigger()`

Registriert das Konfigurationspanel für einen Trigger-Typ.

**Signatur**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Trigger-Typs, übereinstimmend mit dem serverseitig registrierten Bezeichner |
| `trigger` | `typeof Trigger \| Trigger` | Trigger-Typ oder -Instanz |

#### `registerInstruction()`

Registriert das Konfigurationspanel für einen Knoten-Typ.

**Signatur**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner des Knoten-Typs, übereinstimmend mit dem serverseitig registrierten Bezeichner |
| `instruction` | `typeof Instruction \| Instruction` | Knoten-Typ oder -Instanz |

#### `registerInstructionGroup()`

Registriert eine Knoten-Typ-Gruppe. NocoBase stellt standardmäßig 4 Knoten-Typ-Gruppen bereit:

* `'control'`: Ablaufsteuerung
* `'collection'`: Datenoperationen
* `'manual'`: Manuelle Verarbeitung
* `'extended'`: Weitere Erweiterungen

Wenn Sie weitere Gruppen benötigen, können Sie diese Methode verwenden, um sie zu registrieren.

**Signatur**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameter**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `type` | `string` | Bezeichner der Knoten-Gruppe |
| `group` | `{ label: string }` | Gruppeninformationen, enthält derzeit nur den Titel |

**Beispiel**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Bestimmt, ob ein Workflow im synchronen Modus läuft.

**Signatur**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Die Basisklasse für Trigger, die zum Erweitern benutzerdefinierter Trigger-Typen verwendet wird.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `title` | `string` | Name des Trigger-Typs |
| `description?` | `string` | Beschreibung des Trigger-Typs |
| `PresetFieldsetLoader?` | `LoaderOf` | Voreinstellungsformular beim Erstellen (Lazy-Loading) |
| `FieldsetLoader?` | `LoaderOf` | Vollständiges Trigger-Konfigurationsformular (Lazy-Loading) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Eingabeformular für manuelle Ausführung (Lazy-Loading) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Konfigurationsvalidierung; gibt `true` zurück, wenn die Konfiguration gültig ist |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Stellt Standard-Konfigurationswerte bereit |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Variablenoptionen für Trigger-Kontextdaten |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Menüeinträge zum Erstellen von Untermodellen auf der Canvas |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Stellt eine temporäre Assoziationsdatenquelle bereit |

**Zugehörige Typen**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Wenn `useVariables` nicht gesetzt ist, bietet dieser Trigger-Typ keine Wertabruffunktion an, und die Kontextdaten des Triggers können in den Workflow-Knoten nicht ausgewählt werden.

### `Instruction`

Die Basisklasse für Instructions, die zum Erweitern benutzerdefinierter Knoten-Typen verwendet wird.

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `title` | `string` | Name des Knoten-Typs |
| `type` | `string` | Bezeichner des Knoten-Typs |
| `group` | `string` | Bezeichner der Knoten-Typ-Gruppe, Optionen: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Beschreibung des Knoten-Typs |
| `icon?` | `JSX.Element` | Knoten-Symbol |
| `FieldsetLoader?` | `LoaderOf` | Knoten-Konfigurations-Drawer-Formular (Lazy-Loading) |
| `PresetFieldsetLoader?` | `LoaderOf` | Voreinstellungsformular beim Erstellen (Lazy-Loading) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Benutzerdefiniertes Knoten-Rendering auf der Canvas (Lazy-Loading), verwendet für Branch-Knoten und andere Fälle, die spezielles Rendering erfordern |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Deklariert, ob der Knoten ein Branch-Knoten ist |
| `end?` | `boolean \| ((node) => boolean)` | Deklariert, ob der Knoten ein Endknoten ist |
| `testable?` | `boolean` | Deklariert, ob der Knoten Testläufe unterstützt |
| `createDefaultConfig?` | `() => object` | Stellt Standard-Konfigurationswerte bereit |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Methode, mit der der Knoten Variablenoptionen bereitstellt |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Methode, mit der der Knoten Branch-bezogene Variablenoptionen bereitstellt |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Methode zur Bestimmung, ob der Knoten verfügbar ist |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Menüeinträge zum Erstellen von Untermodellen auf der Canvas |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Stellt eine temporäre Assoziationsdatenquelle bereit |

**Zugehörige Typen**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Wenn `useVariables` nicht gesetzt ist, bietet dieser Knoten-Typ keine Wertabruffunktion an, und die Ergebnisdaten dieses Knoten-Typs können in den Workflow-Knoten nicht ausgewählt werden. Wenn der Ergebniswert einwertig ist (nicht auswählbar), können Sie statischen Inhalt zurückgeben, der die entsprechende Information ausdrückt (siehe: [Quellcode des Berechnungsknotens](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Wenn er auswählbar sein muss (z. B. eine Eigenschaft eines Objekts), können Sie die entsprechende Auswahlkomponente anpassen (siehe: [Quellcode des Datenabfrageknotens](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` ist eine benutzerdefinierte Rendering-Komponente für den Knoten. Wenn das Standard-Knoten-Rendering nicht ausreicht, kann es vollständig überschrieben werden, um eine benutzerdefinierte Knotenansicht zu rendern. Beispielsweise um zusätzliches Branch-Rendering für Branch-Typ-Knoten bereitzustellen (siehe: [Quellcode des Bedingungsknotens](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` wird hauptsächlich verwendet, um zu bestimmen, ob ein Knoten in der aktuellen Umgebung verwendet (hinzugefügt) werden kann. Die aktuelle Umgebung umfasst die Workflow-Plugin-Instanz, den aktuellen Workflow, vorgelagerte Knoten und den aktuellen Branch-Index.

### Variableneingabe-Komponenten

Der Workflow stellt eine Reihe von Variableneingabe-Komponenten bereit, mit denen Benutzer Workflow-Variablen in Knoten-/Trigger-Konfigurationsformularen auswählen können.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Variableneingabe, die das Auswählen einer Variable und das anschließende Weiterschreiben von Inhalten unterstützt. Geeignet für einzeilige Eingabeszenarien, die eine Mischung aus Variablenreferenzen und Freitext erfordern.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value?` | `string` | Variablenpfadwert, z. B. `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Callback bei Wertänderung |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variablenfilteroptionen (Typfilterung, Tiefe usw.) |
| `disabled?` | `boolean` | Ob deaktiviert |
| `placeholder?` | `string` | Platzhaltertext |

#### `WorkflowVariableTextArea`

Mehrzeiliger Textbereich, der das Einfügen von Variablenreferenzen an beliebiger Cursorposition unterstützt. Geeignet für Freitextszenarien wie HTTP-Body, Vorlagentexte usw.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value?` | `string` | Textwert (kann Variablenreferenzen enthalten) |
| `onChange?` | `(value: string) => void` | Callback bei Wertänderung |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variablenfilteroptionen |
| `delimiters?` | `readonly [string, string]` | Variablen-Trennzeichen, Standard ist `['{{', '}}']` |

Erbt weitere Props von antd `TextArea` (wie `autoSize`, `placeholder` usw.).

#### `WorkflowTypedVariableInput`

Typisierte Eingabe, die zwischen den Modi „Konstante" und „Variablenreferenz" umschaltet. Im Variablenmodus kann nur eine Variable ausgewählt werden; nach der Auswahl kann nicht weitergetippt werden. Im Konstantenmodus werden fünf Typen unterstützt: `string`, `number`, `boolean`, `date` und `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variablenfilteroptionen |

Erbt weitere Props von `TypedVariableInput` (ausgenommen intern verwendete `extraNodes`, `metaTree`, `namespaces`).

#### `WorkflowVariableWrapper`

Generischer Wrapper zum Austauschen verschiedener Eingabekomponenten in unterschiedlichen Kontexten. Wenn beispielsweise dasselbe Feld in der Trigger-Knotenkonfiguration und im Knotenkonfigurations-Drawer unterschiedliche Eingabemethoden erfordert, können Sie diese Komponente verwenden, um eine native Eingabe in eine Eingabe mit Variablenmodus-Umschaltung zu verpacken.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Aktueller Wert (Konstantenwert oder Variablenpfad-String) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Callback bei Wertänderung |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variablenfilteroptionen |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Rendert die native Eingabekomponente |
| `clearValue?` | `TValue \| null` | Anfangswert beim Zurückschalten vom Variablenmodus in den Konstantenmodus, Standard ist `null` |

### Collection-bezogene Komponenten

Der Workflow stellt außerdem eine Reihe von Collection-bezogenen Hilfskomponenten bereit:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Datenquellenbasierter Collection-Selektor (Kaskadierung)
- `AppendsSelect` — Selektor für das Vorladen von Assoziationsfeldern (Baumauswahl)
- `FieldsSelect` — Mehrfachselektor für Collection-Felder
- `SortFieldsInput` — Sortierfeld-Eingabe
- `PaginationFields` — Paginierungs-Parameter-Formularfelder
