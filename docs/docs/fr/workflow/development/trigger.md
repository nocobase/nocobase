:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Étendre les types de déclencheurs

Chaque **flux de travail** doit être configuré avec un déclencheur spécifique, qui sert de point d'entrée pour démarrer l'exécution du processus.

Un type de déclencheur représente généralement un événement spécifique de l'environnement système. Pendant le cycle de vie d'exécution de l'application, toute partie offrant des événements auxquels on peut s'abonner peut être utilisée pour définir un type de déclencheur. Par exemple, la réception de requêtes, les opérations sur les **collections**, les tâches planifiées, etc.

Les types de déclencheurs sont enregistrés dans la table des déclencheurs du **plugin** à l'aide d'un identifiant de chaîne. Le **plugin** **flux de travail** intègre plusieurs déclencheurs :

- `'collection'` : Déclenché par les opérations sur les **collections** ;
- `'schedule'` : Déclenché par les tâches planifiées ;
- `'action'` : Déclenché par les événements post-action ;

Les types de déclencheurs étendus doivent avoir des identifiants uniques. L'implémentation pour l'abonnement/désabonnement du déclencheur est enregistrée côté serveur, et l'implémentation de l'interface de configuration est enregistrée côté client.

## Côté serveur

Tout déclencheur doit hériter de la classe de base `Trigger` et implémenter les méthodes `on` et `off`. Ces méthodes servent respectivement à s'abonner et à se désabonner d'événements spécifiques de l'environnement. Dans la méthode `on`, vous devez appeler `this.workflow.trigger()` au sein de la fonction de rappel de l'événement spécifique pour finalement déclencher l'événement. De plus, dans la méthode `off`, vous devez effectuer les tâches de nettoyage liées à la désinscription.

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

Par exemple, pour le déclencheur d'exécution planifiée mentionné ci-dessus, définissez l'élément de configuration du temps d'intervalle (`interval`) requis dans le formulaire de l'interface de configuration :

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

Ensuite, enregistrez ce type de déclencheur auprès de l'instance du **plugin** **flux de travail** au sein du **plugin** étendu :

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

Après cela, le nouveau type de déclencheur sera visible dans l'interface de configuration du **flux de travail**.

:::info{title=Conseil}
L'identifiant du type de déclencheur enregistré côté client doit être identique à celui du côté serveur, sinon cela entraînera des erreurs.
:::

Pour d'autres détails sur la définition des types de déclencheurs, veuillez consulter la section [Référence de l'API des flux de travail](./api#pluginregisterTrigger).