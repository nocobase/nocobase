:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Relation entre FlowEngine et les plugins

Le **FlowEngine** n'est pas un plugin. Il s'agit plutôt d'une **API de cœur** mise à la disposition des plugins pour relier les fonctionnalités fondamentales aux extensions métier.
Dans NocoBase 2.0, toutes les API sont centralisées au sein du FlowEngine. Les plugins peuvent y accéder via `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context : Des capacités globales gérées de manière centralisée

Le FlowEngine met à votre disposition un **Context** centralisé qui regroupe les API nécessaires à divers scénarios, par exemple :

```ts
class PluginHello extends Plugin {
  async load() {
    // Extension du routeur
    this.engine.context.router;

    // Effectuer une requête
    this.engine.context.api.request();

    // Lié à l'i18n
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Remarque** :
> Dans la version 2.0, le Context résout les problèmes suivants rencontrés dans la version 1.x :
>
> * Contexte dispersé, appels incohérents
> * Perte de contexte entre différentes arborescences de rendu React
> * Utilisation limitée aux composants React
>
> Pour plus de détails, consultez le **chapitre FlowContext**.

---

## Alias de raccourci pour les plugins

Afin de simplifier les appels, le FlowEngine met à disposition des alias sur l'instance du plugin :

* `this.context` → équivalent à `this.engine.context`
* `this.router` → équivalent à `this.engine.context.router`

## Exemple : Étendre le routeur

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// Pour les scénarios d'exemple et de test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Dans cet exemple :

* Le plugin étend la route pour le chemin `/` en utilisant la méthode `this.router.add` ;
* `createMockClient` fournit une application mock propre pour faciliter les démonstrations et les tests ;
* `app.getRootComponent()` renvoie le composant racine, qui peut être directement monté sur la page.