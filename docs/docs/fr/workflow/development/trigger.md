---
title: "Étendre les types de déclencheurs"
description: "Étendre les types de déclencheurs : développement de déclencheurs personnalisés, interface de configuration, logique de déclenchement, référence de l'API."
keywords: "flux de travail,extension des déclencheurs,déclencheurs personnalisés,développement de déclencheurs,NocoBase"
---

# Étendre les types de déclencheurs

Chaque **flux de travail** doit être configuré avec un déclencheur spécifique, qui sert de point d'entrée pour démarrer l'exécution du processus.

Un type de déclencheur représente généralement un événement spécifique de l'environnement système. Pendant le cycle de vie d'exécution de l'application, toute partie offrant des événements auxquels on peut s'abonner peut être utilisée pour définir un type de déclencheur. Par exemple, la réception de requêtes, les opérations sur les **collections**, les tâches planifiées, etc.

Les types de déclencheurs sont enregistrés dans la table des déclencheurs du **plugin** à l'aide d'un identifiant de chaîne. Le **plugin** **flux de travail** intègre plusieurs déclencheurs :

- `'collection'` : Déclenché par les opérations sur les **collections** ;
- `'schedule'` : Déclenché par les tâches planifiées ;
- `'action'` : Déclenché par les événements post-action ;


Les types de déclencheurs étendus doivent avoir des identifiants uniques. L'implémentation pour l'abonnement/désabonnement du déclencheur est enregistrée côté serveur, et l'implémentation de l'interface de configuration est enregistrée côté client.

## Côté serveur

Tout déclencheur doit hériter de la classe de base `Trigger` et implémenter les méthodes `on`/`off`, qui servent respectivement à s'abonner et à se désabonner d'événements spécifiques de l'environnement. Dans la méthode `on`, vous devez appeler `this.workflow.trigger()` au sein de la fonction de rappel de l'événement spécifique pour finalement déclencher l'événement. Dans la méthode `off`, vous devez effectuer les tâches de nettoyage liées à la désinscription.

`this.workflow` est l'instance du **plugin** **flux de travail** transmise au constructeur de la classe de base `Trigger`.

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

Ensuite, dans le **plugin** qui étend le **flux de travail**, enregistrez l'instance du déclencheur auprès du moteur de **flux de travail** :

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

Une fois le serveur démarré et chargé, le déclencheur de type `'interval'` pourra être ajouté et exécuté.

## Côté client

La partie côté client fournit principalement une interface de configuration basée sur les éléments de configuration requis par le type de déclencheur. Chaque type de déclencheur doit également enregistrer sa configuration de type correspondante auprès du **plugin** **flux de travail**.

L'interface de configuration du déclencheur est définie via un Loader (fonction de chargement différé), qui pointe vers un composant React standard construisant le formulaire à l'aide des `Form.Item` d'antd.

### Le déclencheur le plus simple

Par exemple, pour le déclencheur de minuterie à intervalle décrit ci-dessus, définissez l'élément de configuration du temps d'intervalle (`interval`) requis dans le formulaire de l'interface de configuration :

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

Ici, `FieldsetLoader` est une fonction qui retourne `Promise<{ default: ComponentType }>`, implémentant le chargement différé via `import()` dynamique. Le composant vers lequel elle pointe est un composant fonction React standard :

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

Notez que le `name` du champ de formulaire utilise le format de tableau imbriqué `['config', 'fieldName']`, qui est la convention standard des formulaires antd.

### Interfaces de configuration multiples

Un déclencheur peut fournir plusieurs interfaces de configuration pour différents scénarios :

- `PresetFieldsetLoader` — Formulaire prédéfini lors de la création d'un **flux de travail** (contient généralement uniquement les champs obligatoires)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Formulaire complet de configuration du déclencheur (affiché dans le tiroir de configuration)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Formulaire de saisie pour l'exécution manuelle
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Lorsqu'un Loader doit pointer vers un export nommé (plutôt que l'export par défaut) d'un fichier, utilisez `.then()` pour effectuer le remappage :

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

### Enregistrer le déclencheur

Enregistrez le type de déclencheur auprès de l'instance du **plugin** **flux de travail** au sein du **plugin** étendu :

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

Après cela, le nouveau type de déclencheur sera visible dans l'interface de configuration du **flux de travail**.

:::info{title=Remarque}
L'identifiant du type de déclencheur enregistré côté client doit être identique à celui du côté serveur, sinon cela entraînera des erreurs.
:::

Pour un exemple complet en situation réelle, consultez : [Code source de CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Pour d'autres détails sur la définition des types de déclencheurs, veuillez consulter la section [Référence de l'API des flux de travail](./api).

:::info{title=Remarque}
Si vous utilisiez précédemment le code côté client hérité (v1) et souhaitez migrer vers la nouvelle version v2, consultez le [Guide de migration v1 vers v2](./migration).
:::
