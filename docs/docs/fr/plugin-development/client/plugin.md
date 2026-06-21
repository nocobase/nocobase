---
title: "Plugin client"
description: "Point d'entrée du plugin client NocoBase : héritage de la classe Plugin, cycle de vie afterAdd/beforeLoad/load, enregistrement des routes et FlowModel."
keywords: "Plugin,plugin client,cycle de vie,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin

Dans NocoBase, le **plugin client (Client Plugin)** est le moyen principal pour étendre et personnaliser les fonctionnalités front-end. Vous pouvez hériter de la classe de base `Plugin` fournie par `@nocobase/client-v2` dans `src/client-v2/plugin.tsx` du répertoire de votre plugin, puis enregistrer routes, modèles et autres ressources dans les méthodes du cycle de vie comme `load()`.

La plupart du temps, seul `load()` vous concerne — la logique principale est en général enregistrée à l'étape `load()`.

:::tip Prérequis

Avant de développer un plugin client, assurez-vous d'avoir lu le chapitre [Écrire votre premier plugin](../write-your-first-plugin.md) afin d'avoir généré la structure de répertoire et les fichiers de base du plugin.

:::

## Structure de base

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Exécuté après l'ajout du plugin
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Exécuté avant le load() de tous les plugins
    console.log('Before load');
  }

  async load() {
    // Exécuté au chargement du plugin : enregistrer routes, modèles, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Cycle de vie

À chaque rafraîchissement du navigateur ou initialisation de l'application, le plugin exécute séquentiellement `afterAdd()` → `beforeLoad()` → `load()` :

| Méthode        | Moment d'exécution                | Description                                                                 |
| -------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `afterAdd()`   | Après la création de l'instance du plugin | Tous les plugins ne sont pas encore initialisés à ce stade. Convient pour de l'initialisation légère, comme la lecture de configuration. |
| `beforeLoad()` | Avant le `load()` de tous les plugins | Vous pouvez accéder aux instances des autres plugins activés via `this.app.pm.get()`. Convient à la gestion des dépendances entre plugins. |
| `load()`       | Une fois tous les `beforeLoad()` exécutés | **Cycle de vie le plus utilisé.** C'est ici qu'on enregistre les routes, FlowModels et autres ressources principales. |

En général, écrire `load()` suffit pour développer un plugin client.

## Que faire dans load()

`load()` est le point d'entrée principal pour enregistrer les fonctionnalités du plugin. Opérations courantes :

**Enregistrer des routes de page :**

```ts
async load() {
  // Enregistrer une page indépendante
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Enregistrer une page de configuration de plugin (menu + page)
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Configuration Hello'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Configuration Hello'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

Voir [Router - routage](./router) pour l'utilisation détaillée.

**Enregistrer un FlowModel :**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // Import dynamique : le module n'est chargé que la première fois que ce model est utilisé
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` utilise le chargement à la demande (import dynamique) ; le module n'est chargé qu'à la première utilisation du modèle. C'est la méthode d'enregistrement recommandée. Voir [FlowEngine](./flow-engine/index.md) pour l'utilisation détaillée.

## Propriétés courantes du plugin

Dans une classe de plugin, les propriétés suivantes sont accessibles directement via `this` :

| Propriété                    | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `this.router`                | Gestionnaire de routes, pour enregistrer les routes de page       |
| `this.pluginSettingsManager` | Gestionnaire de pages de configuration de plugin (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`            | Instance FlowEngine, pour enregistrer des FlowModels              |
| `this.engine`                | Alias de `this.flowEngine`                                        |
| `this.context`               | Objet de contexte, identique à celui retourné par `useFlowContext()` dans les composants |
| `this.app`                   | Instance Application                                              |
| `this.app.eventBus`          | Bus d'événements applicatif (`EventTarget`), pour écouter les événements de cycle de vie |

Si vous avez besoin d'accéder à plus de capacités NocoBase (par exemple `api`, `t`(i18n), `logger`), récupérez-les via `this.context` :

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

Pour plus de capacités du contexte, voir [Context](./ctx/index.md).

## Liens connexes

- [Router - routage](./router) — Enregistrer des routes de page et des pages de configuration de plugin
- [Développement de Component](./component/index.md) — Comment écrire les composants React montés sur les routes
- [Context](./ctx/index.md) — Utiliser les capacités intégrées de NocoBase via le contexte
- [FlowEngine](./flow-engine/index.md) — Enregistrer des composants visuellement configurables tels que blocs, champs ou actions
- [Écrire votre premier plugin](../write-your-first-plugin.md) — Créer un plugin de zéro
