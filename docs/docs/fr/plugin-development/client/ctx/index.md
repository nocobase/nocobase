---
title: "Context"
description: "Mécanisme de contexte côté client NocoBase : this.context dans le Plugin et useFlowContext() dans les composants pointent vers le même objet, avec deux points d'entrée différents."
keywords: "Context,contexte,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context

Dans NocoBase, le **contexte (Context)** est le pont qui relie le code de plugin aux capacités de NocoBase. Via le contexte, vous pouvez envoyer des requêtes, traduire, écrire des logs, naviguer entre pages, etc.

Le contexte a deux points d'accès :

- **Dans le Plugin** : `this.context`
- **Dans un composant React** : `useFlowContext()` (importé depuis `@nocobase/flow-engine`)

Les deux renvoient **le même objet** (instance de `FlowEngineContext`), seuls les contextes d'utilisation diffèrent.

## Utilisation dans le Plugin

Dans les méthodes de cycle de vie du plugin (comme `load()`), accédez au contexte via `this.context` :

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Accède aux capacités du contexte via this.context
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('Informations de l\'application', response.data);

    // Internationalisation : this.t() injecte automatiquement le nom du package du plugin comme namespace
    console.log(this.t('Hello'));
  }
}
```

## Utilisation dans un composant

Dans un composant React, récupérez le même objet de contexte via `useFlowContext()` :

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Raccourcis du Plugin vs propriétés ctx

La classe Plugin fournit des raccourcis pratiques pour `load()`. Notez que **certains raccourcis de la classe Plugin et les propriétés homonymes sur ctx pointent vers des objets différents** :

| Raccourci Plugin | Pointe vers | Utilisation |
| --- | --- | --- |
| `this.router` | RouterManager | Enregistrer des routes via `.add()` |
| `this.pluginSettingsManager` | PluginSettingsManager | Enregistrer la page de configuration du plugin (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine` | Instance FlowEngine | Enregistrer des FlowModel |
| `this.t()` | i18n.t() + ns automatique | Internationalisation, injecte automatiquement le nom du package |
| `this.context` | FlowEngineContext | Objet contexte, identique à useFlowContext() |

Le couple le plus facile à confondre est `this.router` et `ctx.router` :

- **`this.router`** (raccourci Plugin) → RouterManager, sert à **enregistrer des routes** (`.add()`)
- **`ctx.router`** (propriété de contexte) → instance React Router, sert à la **navigation** (`.navigate()`)

```ts
// Dans le Plugin : enregistrer une route
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// Dans un composant : navigation
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Capacités courantes fournies par le contexte

Voici les capacités courantes du contexte. Certaines ne sont disponibles que dans le Plugin, d'autres uniquement dans les composants, certaines existent des deux côtés mais avec des syntaxes différentes.

| Capacité | Plugin (`this.xxx`) | Component (`ctx.xxx`) | Description |
| --- | --- | --- | --- |
| Requêtes API | `this.context.api` | `ctx.api` | Utilisation identique |
| Internationalisation | `this.t()` / `this.context.t` | `ctx.t` | `this.t()` injecte automatiquement le namespace du plugin |
| Logs | `this.context.logger` | `ctx.logger` | Utilisation identique |
| Enregistrement de route | `this.router.add()` | - | Plugin uniquement |
| Navigation | - | `ctx.router.navigate()` | Composant uniquement |
| Informations de route | `this.context.location` | `ctx.route` / `ctx.location` | Recommandé d'utiliser dans les composants |
| Gestion de vues | `this.context.viewer` | `ctx.viewer` | Ouvrir boîtes de dialogue / tiroirs, etc. |
| FlowEngine | `this.flowEngine` | - | Plugin uniquement |

Voir [Capacités courantes](./common-capabilities) pour les utilisations détaillées et les exemples de code.

## Liens connexes

- [Capacités courantes](./common-capabilities) — utilisations détaillées de ctx.api, ctx.t, ctx.logger, etc.
- [Plugin](../plugin) — point d'entrée et raccourcis du plugin
- [Développement de composants Component](../component/index.md) — utilisation de base de useFlowContext dans les composants
