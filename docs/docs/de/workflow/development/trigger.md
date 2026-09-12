---
title: "Trigger-Typen erweitern"
description: "Trigger-Typen erweitern: Entwicklung benutzerdefinierter Trigger, Konfigurationsoberfläche, Trigger-Logik, API-Referenz."
keywords: "Workflow,Trigger erweitern,benutzerdefinierte Trigger,Trigger-Entwicklung,NocoBase"
---

# Trigger-Typen erweitern

Jeder Workflow muss mit einem bestimmten Trigger konfiguriert werden, der als Einstiegspunkt zum Starten der Prozessausführung dient.

Ein Trigger-Typ repräsentiert in der Regel ein spezifisches Systemumgebungsereignis. Während des Laufzeitlebenszyklus der Anwendung kann jeder Teil, der abonnierbare Ereignisse bereitstellt, zur Definition eines Trigger-Typs verwendet werden. Beispiele hierfür sind der Empfang von Anfragen, Operationen an Daten-Sammlungen, geplante Aufgaben usw.

Trigger-Typen werden anhand eines String-Identifikators in der Trigger-Tabelle des Plugins registriert. Das Workflow-Plugin enthält mehrere integrierte Trigger:

- `'collection'`: Wird durch Operationen an Daten-Sammlungen ausgelöst;
- `'schedule'`: Wird durch geplante Aufgaben ausgelöst;
- `'action'`: Wird durch Ereignisse nach einer Aktion ausgelöst;


Erweiterte Trigger-Typen müssen sicherstellen, dass ihre Identifikatoren eindeutig sind. Die Implementierung für das Abonnieren/Abbestellen des Triggers wird serverseitig registriert, und die Implementierung für die Konfigurationsoberfläche wird clientseitig registriert.

## Serverseitig

Jeder Trigger muss von der Basisklasse `Trigger` erben und die Methoden `on`/`off` implementieren, die zum Abonnieren bzw. Abbestellen spezifischer Umgebungsereignisse dienen. In der `on`-Methode müssen Sie innerhalb der spezifischen Event-Callback-Funktion `this.workflow.trigger()` aufrufen, um das Ereignis letztendlich auszulösen. In der `off`-Methode müssen Sie die entsprechenden Bereinigungsarbeiten für die Abmeldung durchführen.

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

Die Konfigurationsoberfläche des Triggers wird über einen Loader (Lazy-Loading-Funktion) definiert, der auf eine einfache React-Komponente verweist, die das Formular mit antd's `Form.Item` aufbaut.

### Der einfachste Trigger

Definieren Sie beispielsweise für den oben beschriebenen Intervall-Timer-Trigger das erforderliche Konfigurationselement für die Intervallzeit (`interval`) im Formular der Konfigurationsoberfläche:

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Hier ist `FieldsetLoader` eine Funktion, die `Promise<{ default: ComponentType }>` zurückgibt und Lazy Loading über dynamisches `import()` implementiert. Die Komponente, auf die sie verweist, ist eine standardmäßige React-Funktionskomponente:

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

Beachten Sie, dass der `name` des Formularfelds das verschachtelte Array-Format `['config', 'fieldName']` verwendet, was der standardmäßigen antd-Form-Konvention entspricht.

### Mehrere Konfigurationsoberflächen

Ein Trigger kann mehrere Konfigurationsoberflächen für verschiedene Szenarien bereitstellen:

- `PresetFieldsetLoader` — Voreinstellungsformular beim Erstellen eines Workflows (enthält normalerweise nur Pflichtfelder)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Vollständiges Trigger-Konfigurationsformular (wird im Konfigurations-Drawer angezeigt)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Eingabeformular für die manuelle Ausführung
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Wenn ein Loader auf einen benannten Export (statt auf den Standard-Export) in einer Datei verweisen soll, verwenden Sie `.then()` zur Umleitung:

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Trigger registrieren

Registrieren Sie den Trigger-Typ innerhalb des erweiterten Plugins bei der Workflow-Plugin-Instanz:

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Danach wird der neue Trigger-Typ in der Workflow-Konfigurationsoberfläche sichtbar sein.

:::info{title=Hinweis}
Der clientseitig registrierte Identifikator des Trigger-Typs muss mit dem serverseitigen übereinstimmen, da es sonst zu Fehlern kommt.
:::

Ein vollständiges Praxisbeispiel finden Sie unter: [CollectionTrigger-Quellcode](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Weitere Details zur Definition von Trigger-Typen finden Sie im Abschnitt [Workflow-API-Referenz](./api).

:::info{title=Hinweis}
Falls Sie zuvor den alten (v1) clientseitigen Code verwendet haben und auf die neue v2-Version migrieren möchten, lesen Sie den [v1-zu-v2-Migrationsleitfaden](./migration).
:::
