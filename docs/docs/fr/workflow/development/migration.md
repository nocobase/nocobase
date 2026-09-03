---
title: "Guide de migration v1 vers v2"
description: "Développement d'extensions de flux de travail : guide de migration du code côté client de v1 vers v2."
keywords: "flux de travail,migration,v1,v2,NocoBase"
---

# Guide de migration côté client v1 vers v2

Ce guide décrit comment migrer le code côté client d'un **plugin** d'extension de **flux de travail** de v1 vers v2. Le changement principal dans le client v2 est le remplacement des interfaces de configuration déclaratives basées sur les schémas Formily par une approche Loader + composants React/antd purs.

## Vue d'ensemble

### Principaux changements

1. **Changement des chemins d'import** : `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, classe de base du **plugin** `@nocobase/client` → `@nocobase/client-v2`
2. **Changement du modèle d'interface de configuration** : Des objets schéma Formily (`fieldset`) aux composants React chargés en différé via Loader (`FieldsetLoader`)
3. **Suppression des propriétés `scope`/`components`** : Il n'est plus nécessaire d'injecter des objets scope ou des composants dans le schéma ; importez-les et utilisez-les directement dans les composants React

### Correspondance des chemins d'import

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Règles générales

### Modèle Loader

v2 utilise des propriétés typées `LoaderOf` pour remplacer le `fieldset` et les autres objets schéma Formily de v1. Un Loader est essentiellement une fonction qui retourne `Promise<{ default: ComponentType }>`, permettant le découpage du code et le chargement différé via `import()` dynamique :

```ts
// v1: Objet schéma Formily
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointant vers un composant React
FieldsetLoader = () => import('./MyConfig');
```

Si vous devez pointer vers un export nommé (plutôt que l'export par défaut), utilisez `.then()` pour effectuer le remappage :

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Syntaxe des composants de configuration

Le composant chargé par un Loader est un composant fonction React standard qui utilise les `Form.Item` d'antd pour construire les formulaires. Les chemins des champs utilisent systématiquement le format de tableau imbriqué `['config', 'fieldName']` :

```tsx
// v1: Schéma Formily
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

// v2: Composant React
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

## Migration des déclencheurs

### Table de correspondance des propriétés

| Propriété v1 | Propriété v2 | Description |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulaire de configuration du déclencheur |
| `presetFieldset` | `PresetFieldsetLoader` | Formulaire prédéfini lors de la création |
| `triggerFieldset` | `TriggerFieldsetLoader` | Formulaire de saisie pour l'exécution manuelle |
| `scope` | Supprimé | Plus nécessaire ; importez directement dans le composant |
| `components` | Supprimé | Plus nécessaire ; importez directement dans le composant |
| `view` | Supprimé | |
| — | `validate(config)` | Nouveau ; validation de la configuration |
| — | `createDefaultConfig()` | Nouveau ; fournit les valeurs de configuration par défaut |

### Exemple de migration

**Syntaxe v1 :**

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

**Syntaxe v2 :**

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

### Enregistrement du plugin

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

## Migration des nœuds

### Table de correspondance des propriétés

| Propriété v1 | Propriété v2 | Description |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulaire du tiroir de configuration du nœud |
| `presetFieldset` | `PresetFieldsetLoader` | Formulaire prédéfini lors de la création |
| `Component` | `ComponentLoader` | Rendu personnalisé du nœud sur le canevas |
| `scope` | Supprimé | Plus nécessaire ; importez directement dans le composant |
| `components` | Supprimé | Plus nécessaire ; importez directement dans le composant |
| `view` | Supprimé | |
| — | `createDefaultConfig()` | Nouveau ; fournit les valeurs de configuration par défaut |

### Exemple de migration

**Syntaxe v1 :**

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

**Syntaxe v2 :**

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

## Autres remarques

### Parties inchangées

Les propriétés et méthodes suivantes ont essentiellement les mêmes signatures en v1 et v2, et peuvent être conservées telles quelles lors de la migration :

- `useVariables(node/config, options)` — Fournit les options de variables
- `useScopeVariables(node, options)` — Fournit les variables à portée de branche
- `isAvailable(ctx)` — Vérification de la disponibilité du nœud (le `NodeAvailableContext` de v2 ajoute une nouvelle propriété `engine`)

### Nouvelles propriétés en v2

- `getCreateModelMenuItem` — Définit la configuration pour la création d'éléments de menu de sous-modèle pour les nœuds/déclencheurs sur le canevas v2
- `useTempAssociationSource` — Fournit les informations de source de données d'association temporaire
- `validate(config)` — Validation de la configuration du déclencheur (déclencheurs uniquement)
- `branching` — Déclare si le nœud est un nœud de branchement (nœuds uniquement)
- `end` — Déclare si le nœud est un nœud terminal (nœuds uniquement)
- `testable` — Déclare si le nœud prend en charge les exécutions de test (nœuds uniquement)

### Cohérence sémantique des valeurs

Lors de la migration, assurez-vous que les valeurs de formulaire produites par les composants v2 sont cohérentes avec celles de v1, en particulier la structure du payload lors de l'exécution manuelle. Par exemple, si le formulaire d'exécution manuelle en v1 stocke un objet d'enregistrement complet, la version v2 doit conserver la même structure de valeurs plutôt que de stocker uniquement la clé primaire.
