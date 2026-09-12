---
title: "v1 zu v2 Migrationsanleitung"
description: "Workflow-Erweiterungsentwicklung: Anleitung zur Migration von clientseitigem Code von v1 zu v2."
keywords: "Workflow,Migration,v1,v2,NocoBase"
---

# v1 zu v2 clientseitige Migrationsanleitung

Diese Anleitung beschreibt, wie der clientseitige Code eines Workflow-Erweiterungs-Plugins von v1 zu v2 migriert wird. Die zentrale Veränderung im v2-Client besteht darin, dass deklarative Konfigurationsoberflächen auf Basis von Formily Schema durch einen Loader- und reinen React/antd-Komponentenansatz ersetzt werden.

## Überblick

### Wesentliche Änderungen

1. **Änderung der Importpfade**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, Plugin-Basisklasse `@nocobase/client` → `@nocobase/client-v2`
2. **Änderung des Konfigurationsoberflächen-Musters**: Von Formily-Schema-Objekten (`fieldset`) zu per Loader lazy-geladenen React-Komponenten (`FieldsetLoader`)
3. **`scope`/`components`-Eigenschaften entfernt**: Es ist nicht mehr notwendig, Scope-Objekte oder Komponenten in das Schema zu injizieren; sie werden einfach direkt in React-Komponenten importiert und verwendet

### Importpfad-Zuordnung

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Allgemeine Regeln

### Loader-Muster

v2 verwendet Eigenschaften vom Typ `LoaderOf`, um die `fieldset`- und andere Formily-Schema-Objekte aus v1 zu ersetzen. Ein Loader ist im Wesentlichen eine Funktion, die `Promise<{ default: ComponentType }>` zurückgibt und damit Code-Splitting und Lazy-Loading über dynamisches `import()` ermöglicht:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

Wenn Sie auf einen benannten Export (anstelle des Standard-Exports) verweisen müssen, verwenden Sie `.then()` zur Umleitung:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Syntax der Konfigurationskomponente

Die durch einen Loader geladene Komponente ist eine standardmäßige React-Funktionskomponente, die antd's `Form.Item` zum Aufbau von Formularen verwendet. Feldpfade verwenden durchgehend das verschachtelte Array-Format `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Trigger-Migration

### Eigenschafts-Zuordnungstabelle

| v1-Eigenschaft | v2-Eigenschaft | Beschreibung |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Konfigurationsformular des Triggers |
| `presetFieldset` | `PresetFieldsetLoader` | Voreinstellungsformular bei der Erstellung |
| `triggerFieldset` | `TriggerFieldsetLoader` | Eingabeformular für die manuelle Ausführung |
| `scope` | Entfernt | Nicht mehr benötigt; direkt in der Komponente importieren |
| `components` | Entfernt | Nicht mehr benötigt; direkt in der Komponente importieren |
| `view` | Entfernt | |
| — | `validate(config)` | Neu; Validierung der Konfiguration |
| — | `createDefaultConfig()` | Neu; liefert Standard-Konfigurationswerte |

### Migrationsbeispiel

**v1-Syntax:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**v2-Syntax:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

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

### Plugin-Registrierung

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Knoten-Migration

### Eigenschafts-Zuordnungstabelle

| v1-Eigenschaft | v2-Eigenschaft | Beschreibung |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formular in der Knoten-Konfigurationsschublade |
| `presetFieldset` | `PresetFieldsetLoader` | Voreinstellungsformular bei der Erstellung |
| `Component` | `ComponentLoader` | Benutzerdefiniertes Knoten-Rendering auf der Arbeitsfläche |
| `scope` | Entfernt | Nicht mehr benötigt; direkt in der Komponente importieren |
| `components` | Entfernt | Nicht mehr benötigt; direkt in der Komponente importieren |
| `view` | Entfernt | |
| — | `createDefaultConfig()` | Neu; liefert Standard-Konfigurationswerte |

### Migrationsbeispiel

**v1-Syntax:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**v2-Syntax:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Weitere Hinweise

### Unveränderte Teile

Die folgenden Eigenschaften und Methoden haben in v1 und v2 im Wesentlichen die gleichen Signaturen und können bei der Migration unverändert beibehalten werden:

- `useVariables(node/config, options)` — Stellt Variablenoptionen bereit
- `useScopeVariables(node, options)` — Stellt branchspezifische Variablen bereit
- `isAvailable(ctx)` — Verfügbarkeitsprüfung des Knotens (der v2-`NodeAvailableContext` fügt eine neue `engine`-Eigenschaft hinzu)

### Neue Eigenschaften in v2

- `getCreateModelMenuItem` — Definiert die Konfiguration zum Erstellen von Untermodell-Menüeinträgen für Knoten/Trigger auf der v2-Arbeitsfläche
- `useTempAssociationSource` — Stellt Informationen zur temporären Assoziationsdatenquelle bereit
- `validate(config)` — Validierung der Trigger-Konfiguration (nur Trigger)
- `branching` — Deklariert, ob der Knoten ein Verzweigungsknoten ist (nur Knoten)
- `end` — Deklariert, ob der Knoten ein Endknoten ist (nur Knoten)
- `testable` — Deklariert, ob der Knoten Testläufe unterstützt (nur Knoten)

### Wertsemantische Konsistenz

Stellen Sie bei der Migration sicher, dass die von v2-Komponenten erzeugten Formularwerte mit denen aus v1 konsistent sind, insbesondere die Payload-Struktur bei der manuellen Ausführung. Wenn beispielsweise das v1-Formular für die manuelle Ausführung ein vollständiges Datensatzobjekt speichert, muss die v2-Version die gleiche Wertstruktur beibehalten, anstatt nur den Primärschlüssel zu speichern.
