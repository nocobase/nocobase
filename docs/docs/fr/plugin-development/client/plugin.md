:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Plugin

Dans NocoBase, le **plugin client** est le principal moyen d'étendre et de personnaliser les fonctionnalités du frontend. En héritant de la classe de base `Plugin` fournie par `@nocobase/client`, les développeurs peuvent enregistrer de la logique, ajouter des composants de page, étendre des menus ou intégrer des fonctionnalités tierces à différentes étapes du cycle de vie.

## Structure de la classe de plugin

Voici la structure d'un plugin client de base :

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Exécuté après l'ajout du plugin
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Exécuté avant le chargement du plugin
    console.log('Before plugin load');
  }

  async load() {
    // Exécuté lors du chargement du plugin, pour enregistrer les routes, les composants d'interface utilisateur, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Description du cycle de vie

Chaque plugin passe séquentiellement par les étapes de cycle de vie suivantes lors du rafraîchissement du navigateur ou de l'initialisation de l'application :

| Méthode de cycle de vie | Moment d'exécution | Description |
|-------------------------|--------------------|-------------|
| **afterAdd()**          | Exécutée immédiatement après l'ajout du plugin au gestionnaire de plugins. | L'instance du plugin est créée à ce stade, mais tous les plugins ne sont pas encore entièrement initialisés. Convient pour une initialisation légère, comme la lecture de configurations ou la liaison d'événements de base. |
| **beforeLoad()**        | Exécutée avant la méthode `load()` de tous les plugins. | Vous pouvez accéder à toutes les instances de plugins activés (`this.app.pm.get()`). Convient pour la logique de préparation qui dépend d'autres plugins. |
| **load()**              | Exécutée lors du chargement du plugin. | Cette méthode est exécutée une fois que toutes les méthodes `beforeLoad()` des plugins sont terminées. Convient pour l'enregistrement des routes frontend, des composants d'interface utilisateur et d'autres logiques essentielles. |

## Ordre d'exécution

Chaque fois que le navigateur est rafraîchi, l'ordre d'exécution est `afterAdd()` → `beforeLoad()` → `load()`.

## Contexte du plugin et FlowEngine

À partir de NocoBase 2.0, les API d'extension côté client sont principalement regroupées dans le **FlowEngine**. Dans la classe de plugin, vous pouvez obtenir l'instance du moteur via `this.engine`.

```ts
// Accéder au contexte du moteur dans la méthode load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Pour plus de détails, consultez :
- [FlowEngine](/flow-engine)
- [Contexte](./context.md)