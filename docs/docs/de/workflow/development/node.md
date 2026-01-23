:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Knotentypen erweitern

Der Typ eines Knotens ist im Wesentlichen eine Anweisungslogik. Verschiedene Anweisungen repräsentieren unterschiedliche Operationen, die im Workflow ausgeführt werden.

Ähnlich wie bei Triggern gliedert sich die Erweiterung von Knotentypen in zwei Teile: serverseitig und clientseitig. Der Server muss die Logik für die registrierte Anweisung implementieren, während der Client die Oberflächenkonfiguration für die Parameter des Knotens bereitstellen muss, in dem sich die Anweisung befindet.

## Serverseitig

### Die einfachste Knoten-Anweisung

Der Kerninhalt einer Anweisung ist eine Funktion, das heißt, die `run`-Methode in der Anweisungsklasse muss implementiert werden, um die Logik der Anweisung auszuführen. Innerhalb der Funktion können beliebige erforderliche Operationen ausgeführt werden, wie z. B. Datenbankoperationen, Dateivorgänge oder das Aufrufen von Drittanbieter-APIs.

Alle Anweisungen müssen von der Basisklasse `Instruction` abgeleitet werden. Die einfachste Anweisung erfordert lediglich die Implementierung einer `run`-Funktion:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Und registrieren Sie diese Anweisung im Workflow-Plugin:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

Der Statuswert (`status`) im Rückgabeobjekt der Anweisung ist obligatorisch und muss ein Wert aus der Konstante `JOB_STATUS` sein. Dieser Wert bestimmt den weiteren Verlauf der Verarbeitung für diesen Knoten im Workflow. Normalerweise wird `JOB_STATUS.RESOVLED` verwendet, was bedeutet, dass der Knoten erfolgreich ausgeführt wurde und die Ausführung mit den nachfolgenden Knoten fortgesetzt wird. Wenn ein Ergebniswert vorab gespeichert werden muss, können Sie auch die Methode `processor.saveJob` aufrufen und deren Rückgabeobjekt zurückgeben. Der Executor generiert basierend auf diesem Objekt einen Ausführungsergebnisdatensatz.

### Knoten-Ergebniswert

Wenn ein spezifisches Ausführungsergebnis vorliegt, insbesondere Daten, die für nachfolgende Knoten vorbereitet werden, kann dieses über die `result`-Eigenschaft zurückgegeben und im Job-Objekt des Knotens gespeichert werden:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Dabei ist `node.config` die Konfigurationseinstellung des Knotens, die beliebige erforderliche Werte enthalten kann. Sie wird als Feld vom Typ `JSON` im entsprechenden Knotendatensatz in der Datenbank gespeichert.

### Fehlerbehandlung von Anweisungen

Wenn während der Ausführung Ausnahmen auftreten können, können Sie diese vorab abfangen und einen Fehlerstatus zurückgeben:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Wenn vorhersehbare Ausnahmen nicht abgefangen werden, fängt die Workflow-Engine diese automatisch ab und gibt einen Fehlerstatus zurück, um zu verhindern, dass nicht abgefangene Ausnahmen zum Absturz des Programms führen.

### Asynchrone Knoten

Wenn eine Ablaufsteuerung oder asynchrone (zeitaufwändige) I/O-Operationen erforderlich sind, kann die `run`-Methode ein Objekt mit dem Status `JOB_STATUS.PENDING` zurückgeben. Dies weist den Executor an, zu warten (anzuhalten), bis eine externe asynchrone Operation abgeschlossen ist, und anschließend die Workflow-Engine zur Fortsetzung der Ausführung zu benachrichtigen. Wird in der `run`-Funktion ein Statuswert für das Anhalten zurückgegeben, muss die Anweisung die `resume`-Methode implementieren, da sonst die Workflow-Ausführung nicht fortgesetzt werden kann:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Dabei bezieht sich `paymentService` auf einen Zahlungsdienst. Im Callback des Dienstes wird der Workflow ausgelöst, um die Ausführung des entsprechenden Jobs fortzusetzen, wobei der aktuelle Prozess zunächst beendet wird. Anschließend erstellt die Workflow-Engine einen neuen Prozessor und übergibt ihn an die `resume`-Methode des Knotens, um den zuvor angehaltenen Knoten weiter auszuführen.

:::info{title=Hinweis}
Die hier erwähnte „asynchrone Operation“ bezieht sich nicht auf `async`-Funktionen in JavaScript, sondern auf Operationen, die bei der Interaktion mit externen Systemen keine sofortige Rückmeldung geben, wie z. B. ein Zahlungsdienst, der auf eine weitere Benachrichtigung warten muss, um das Ergebnis zu erfahren.
:::

### Knoten-Ergebnisstatus

Der Ausführungsstatus eines Knotens beeinflusst den Erfolg oder Misserfolg des gesamten Workflows. Normalerweise führt das Scheitern eines Knotens ohne Verzweigungen direkt zum Scheitern des gesamten Workflows. Das gängigste Szenario ist, dass ein Knoten bei erfolgreicher Ausführung zum nächsten Knoten in der Knotentabelle übergeht, bis keine weiteren Knoten mehr folgen, woraufhin der gesamte Workflow erfolgreich abgeschlossen wird.

Wenn ein Knoten während der Ausführung einen fehlgeschlagenen Ausführungsstatus zurückgibt, verarbeitet die Engine dies je nach den folgenden zwei Situationen unterschiedlich:

1.  Befindet sich der Knoten, der einen Fehlerstatus zurückgibt, im Haupt-Workflow, d.h. nicht innerhalb eines von einem vorgelagerten Knoten geöffneten Verzweigungs-Workflows, wird der gesamte Haupt-Workflow als fehlgeschlagen bewertet und der Prozess beendet.

2.  Befindet sich der Knoten, der einen Fehlerstatus zurückgibt, innerhalb eines Verzweigungs-Workflows, wird die Verantwortung für die Bestimmung des nächsten Workflow-Status an den Knoten übergeben, der die Verzweigung geöffnet hat. Die interne Logik dieses Knotens entscheidet über den Status des nachfolgenden Workflows, und diese Entscheidung wird rekursiv auf den Haupt-Workflow übertragen.

Letztendlich wird der nächste Status des gesamten Workflows an den Knoten des Haupt-Workflows bestimmt. Wenn ein Knoten im Haupt-Workflow einen Fehler zurückgibt, endet der gesamte Workflow mit einem Fehlerstatus.

Wenn ein Knoten nach der Ausführung den Status „angehalten“ zurückgibt, wird der gesamte Ausführungsprozess vorübergehend unterbrochen und angehalten, um auf ein vom entsprechenden Knoten definiertes Ereignis zu warten, das die Fortsetzung der Workflow-Ausführung auslöst. Beispielsweise pausiert der manuelle Knoten nach der Ausführung mit dem Status „angehalten“ an diesem Knoten und wartet auf eine manuelle Intervention, um zu entscheiden, ob er genehmigt wird. Wenn der manuell eingegebene Status „genehmigt“ ist, werden die nachfolgenden Workflow-Knoten fortgesetzt; andernfalls wird er gemäß der zuvor beschriebenen Fehlerlogik behandelt.

Weitere Informationen zu den Rückgabestatus von Anweisungen finden Sie im Abschnitt Workflow-API-Referenz.

### Vorzeitiger Abbruch

In einigen speziellen Workflows kann es erforderlich sein, den Workflow direkt innerhalb eines Knotens zu beenden. Sie können `null` zurückgeben, um den aktuellen Workflow zu verlassen, und nachfolgende Knoten werden nicht ausgeführt.

Diese Situation ist bei Knoten zur Ablaufsteuerung häufig anzutreffen, wie z. B. beim parallelen Verzweigungsknoten ([Code-Referenz](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)). Hier wird der Workflow des aktuellen Knotens beendet, aber für jede Unterverzweigung werden neue Workflows gestartet und weiter ausgeführt.

:::warn{title=Warnung}
Die Planung von Verzweigungs-Workflows mit erweiterten Knoten ist komplex und erfordert eine sorgfältige Handhabung sowie umfassende Tests.
:::

### Weitere Informationen

Die Definitionen der verschiedenen Parameter zur Definition von Knotentypen finden Sie im Abschnitt Workflow-API-Referenz.

## Clientseitig

Ähnlich wie bei Triggern muss das Konfigurationsformular für eine Anweisung (Knotentyp) clientseitig implementiert werden.

### Die einfachste Knoten-Anweisung

Alle Anweisungen müssen von der Basisklasse `Instruction` abgeleitet werden. Die zugehörigen Eigenschaften und Methoden dienen der Konfiguration und Nutzung des Knotens.

Wenn wir beispielsweise eine Konfigurationsoberfläche für den oben serverseitig definierten Knotentyp „Zufallszahlzeichenkette“ (`randomString`) bereitstellen müssen, der eine Konfigurationseinstellung `digit` für die Anzahl der Ziffern der Zufallszahl enthält, würden wir in dem Konfigurationsformular ein numerisches Eingabefeld verwenden, um Benutzereingaben zu empfangen.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Hinweis}
Die clientseitig registrierte Knotentyp-Kennung muss mit der serverseitigen übereinstimmen, da es sonst zu Fehlern kommt.
:::

### Knotenergebnisse als Variablen bereitstellen

Sie werden die `useVariables`-Methode im obigen Beispiel bemerken. Wenn Sie das Ergebnis eines Knotens (den `result`-Teil) als Variable für nachfolgende Knoten verwenden möchten, müssen Sie diese Methode in der geerbten Anweisungsklasse implementieren und ein Objekt zurückgeben, das dem Typ `VariableOption` entspricht. Dieses Objekt dient als strukturelle Beschreibung des Ausführungsergebnisses des Knotens und stellt eine Variablennamen-Zuordnung zur Auswahl und Verwendung in nachfolgenden Knoten bereit.

Der Typ `VariableOption` ist wie folgt definiert:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Der Kern ist die `value`-Eigenschaft, die den segmentierten Pfadwert des Variablennamens darstellt. `label` wird zur Anzeige in der Benutzeroberfläche verwendet, und `children` dient zur Darstellung einer mehrstufigen Variablenstruktur, die zum Einsatz kommt, wenn das Ergebnis des Knotens ein tief verschachteltes Objekt ist.

Eine verwendbare Variable wird intern im System als Pfad-Template-String dargestellt, der durch `.` getrennt ist, zum Beispiel `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Dabei repräsentiert `jobsMapByNodeKey` die Ergebnismenge aller Knoten (intern definiert, keine weitere Bearbeitung erforderlich), `2dw92cdf` ist der `key` des Knotens und `abc` ist eine benutzerdefinierte Eigenschaft im Ergebnisobjekt des Knotens.

Da das Ergebnis eines Knotens auch ein einfacher Wert sein kann, muss bei der Bereitstellung von Knotenvariablen die erste Ebene **zwingend** die Beschreibung des Knotens selbst sein:

```ts
{
  value: node.key,
  label: node.title,
}
```

Das heißt, die erste Ebene besteht aus dem `key` und dem Titel des Knotens. Zum Beispiel sind bei der Verwendung des Ergebnisses des Berechnungs-Knotens (siehe [Code-Referenz](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77)) die Optionen in der Benutzeroberfläche wie folgt:

![Ergebnis des Berechnungs-Knotens](https://static-docs.nocobase.com/20240514230014.png)

Wenn das Ergebnis des Knotens ein komplexes Objekt ist, können Sie `children` verwenden, um tiefere Eigenschaften zu beschreiben. Beispielsweise könnte eine benutzerdefinierte Anweisung die folgenden JSON-Daten zurückgeben:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Dann können Sie es über die `useVariables`-Methode wie folgt zurückgeben:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

Auf diese Weise können Sie in nachfolgenden Knoten die folgende Benutzeroberfläche verwenden, um die Variablen auszuwählen:

![Abgebildete Ergebnisvariablen](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Hinweis"}
Wenn eine Struktur im Ergebnis ein Array von tief verschachtelten Objekten ist, können Sie ebenfalls `children` verwenden, um den Pfad zu beschreiben, dürfen aber keine Array-Indizes angeben. Dies liegt daran, dass bei der Variablenverarbeitung in NocoBase Workflows die Pfadbeschreibung für ein Array von Objekten bei der Verwendung automatisch zu einem Array von tiefen Werten abgeflacht wird und Sie nicht über einen Index auf einen bestimmten Wert zugreifen können.
:::

### Knotenverfügbarkeit

Standardmäßig kann jeder Knoten einem Workflow hinzugefügt werden. In einigen Fällen ist ein Knoten jedoch in bestimmten Workflow-Typen oder Verzweigungen nicht anwendbar. In solchen Situationen können Sie die Verfügbarkeit des Knotens über `isAvailable` konfigurieren:

```ts
// Typdefinition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Workflow-Plugin-Instanz
  engine: WorkflowPlugin;
  // Workflow-Instanz
  workflow: object;
  // Vorgelagerter Knoten
  upstream: object;
  // Ist es ein Verzweigungsknoten (Verzweigungsnummer)?
  branchIndex: number;
};
```

Die Methode `isAvailable` gibt `true` zurück, wenn der Knoten verfügbar ist, und `false`, wenn er nicht verfügbar ist. Der `ctx`-Parameter enthält die Kontextinformationen des aktuellen Knotens, anhand derer dessen Verfügbarkeit beurteilt werden kann.

Wenn keine besonderen Anforderungen bestehen, müssen Sie die `isAvailable`-Methode nicht implementieren, da Knoten standardmäßig verfügbar sind. Das häufigste Szenario, das eine Konfiguration erfordert, ist, wenn ein Knoten eine zeitaufwändige Operation sein könnte und nicht für die Ausführung in einem synchronen Workflow geeignet ist. Sie können die `isAvailable`-Methode verwenden, um seine Nutzung einzuschränken. Zum Beispiel:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Weitere Informationen

Die Definitionen der verschiedenen Parameter zur Definition von Knotentypen finden Sie im Abschnitt Workflow-API-Referenz.