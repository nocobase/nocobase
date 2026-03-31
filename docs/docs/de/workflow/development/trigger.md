:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Trigger-Typen erweitern

Jeder Workflow benötigt einen spezifischen Trigger. Dieser dient als Startpunkt für die Ausführung des Prozesses.

Ein Trigger-Typ repräsentiert in der Regel ein spezifisches Systemereignis. Während des Lebenszyklus einer Anwendung kann jeder Teil, der abonnierbare Ereignisse bereitstellt, zur Definition eines Trigger-Typs verwendet werden. Beispiele hierfür sind der Empfang von Anfragen, Operationen an Daten-Sammlungen oder geplante Aufgaben.

Trigger-Typen werden anhand eines String-Identifikators in der Trigger-Tabelle des Plugins registriert. Das Workflow-Plugin enthält bereits mehrere integrierte Trigger:

- ``'collection'``: Wird durch Operationen an Daten-Sammlungen ausgelöst;
- ``'schedule'``: Wird durch geplante Aufgaben ausgelöst;
- ``'action'``: Wird durch Ereignisse nach einer Aktion ausgelöst;

Erweiterte Trigger-Typen müssen einen eindeutigen Identifikator besitzen. Die Implementierung für das Abonnieren und Abbestellen des Triggers wird serverseitig registriert, während die Implementierung für die Konfigurationsoberfläche clientseitig erfolgt.

## Serverseitig

Jeder Trigger muss von der Basisklasse `Trigger` erben und die Methoden `on` und `off` implementieren. Diese dienen dazu, spezifische Umgebungsereignisse zu abonnieren bzw. das Abonnement aufzuheben. Innerhalb der `on`-Methode müssen Sie in der spezifischen Event-Callback-Funktion `this.workflow.trigger()` aufrufen, um das Ereignis letztendlich auszulösen. Die `off`-Methode sollte die notwendigen Bereinigungsarbeiten für die Abmeldung übernehmen.

`this.workflow` ist die Workflow-Plugin-Instanz, die dem Konstruktor der Basisklasse `Trigger` übergeben wird.

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

Anschließend registrieren Sie in dem Plugin, das den Workflow erweitert, die Trigger-Instanz bei der Workflow-Engine:

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

Nachdem der Server gestartet und geladen wurde, kann der Trigger vom Typ `'interval'` hinzugefügt und ausgeführt werden.

## Clientseitig

Der clientseitige Teil stellt hauptsächlich eine Konfigurationsoberfläche bereit, die auf den für den Trigger-Typ erforderlichen Konfigurationselementen basiert. Jeder Trigger-Typ muss seine entsprechende Typkonfiguration ebenfalls beim Workflow-Plugin registrieren.

Definieren Sie beispielsweise für den oben genannten Trigger mit zeitgesteuerter Ausführung das erforderliche Konfigurationselement für das Intervall (`interval`) im Formular der Konfigurationsoberfläche:

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

Anschließend registrieren Sie diesen Trigger-Typ innerhalb des erweiterten Plugins bei der Workflow-Plugin-Instanz:

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

Danach wird der neue Trigger-Typ in der Workflow-Konfigurationsoberfläche sichtbar sein.

:::info{title=Hinweis}
Der clientseitig registrierte Identifikator des Trigger-Typs muss mit dem serverseitigen übereinstimmen, da es sonst zu Fehlern kommt.
:::

Weitere Details zur Definition von Trigger-Typen finden Sie im Abschnitt [Workflow API Referenz](./api#pluginregisterTrigger).