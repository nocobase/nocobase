---
title: "Capacités courantes"
description: "Capacités courantes du contexte côté client NocoBase : requêtes ctx.api, internationalisation ctx.t, logs ctx.logger, routes ctx.router, gestion de vues ctx.viewer, contrôle d'accès ctx.acl."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Capacités courantes

L'objet contexte fournit les capacités intégrées de NocoBase. Cependant, certaines ne sont disponibles que dans le Plugin, d'autres uniquement dans les composants, et d'autres encore existent des deux côtés mais avec des syntaxes différentes. Vue d'ensemble :

| Capacité | Plugin (`this.xxx`) | Component (`ctx.xxx`) | Description |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| Requêtes API | `this.context.api` | `ctx.api` | Utilisation identique |
| Internationalisation | `this.t()` / `this.context.t` | `ctx.t` | `this.t()` injecte automatiquement le namespace |
| Logs | `this.context.logger` | `ctx.logger` | Utilisation identique |
| Enregistrement de route | `this.router.add()` | - | Plugin uniquement |
| Navigation | - | `ctx.router.navigate()` | Composant uniquement |
| Informations de route | `this.context.location` | `ctx.route` / `ctx.location` | Recommandé d'utiliser dans les composants |
| Gestion de vues | `this.context.viewer` | `ctx.viewer` | Ouvrir boîte de dialogue / tiroir, etc. |
| FlowEngine | `this.flowEngine` | - | Plugin uniquement |

Détaillons par namespace.

## Requêtes API (ctx.api)

`ctx.api.request()` appelle les API back-end avec une utilisation identique à [Axios](https://axios-http.com/).

### Dans le Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Envoyer une requête directement dans load()
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('Informations de l\'application', response.data);
  }
}
```

### Dans un composant

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // Requête GET
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // Requête POST
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Charger les données</button>;
}
```

### Avec ahooks useRequest

Dans un composant, vous pouvez utiliser `useRequest` d'[ahooks](https://ahooks.js.org/hooks/use-request/index) pour simplifier la gestion des états de requête :

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur de requête : {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Rafraîchir</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Intercepteurs de requêtes

`ctx.api.axios` permet d'ajouter des intercepteurs de requête/réponse, généralement configurés dans `load()` du Plugin :

```ts
async load() {
  // Intercepteur de requête : ajouter un en-tête personnalisé
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Intercepteur de réponse : gestion d'erreur globale
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Erreur de requête', error);
      return Promise.reject(error);
    },
  );
}
```

### En-têtes de requête personnalisés NocoBase

Le serveur NocoBase prend en charge les en-têtes personnalisés suivants, généralement injectés automatiquement par les intercepteurs et qu'il n'est pas nécessaire de définir à la main :

| Header | Description |
| ----------------- | --------------------------------- |
| `X-App` | En multi-app, indique l'application courante |
| `X-Locale` | Langue courante (par exemple `zh-CN`, `en-US`) |
| `X-Hostname` | Nom d'hôte du client |
| `X-Timezone` | Fuseau horaire du client (par exemple `+08:00`) |
| `X-Role` | Rôle courant |
| `X-Authenticator` | Mode d'authentification de l'utilisateur courant |

## Internationalisation (ctx.t / ctx.i18n)

Les plugins NocoBase gèrent leurs fichiers multilingues via le répertoire `src/locale/`, et utilisent `ctx.t()` pour récupérer les traductions dans le code.

### Fichiers multilingues

Sous `src/locale/` du plugin, créez un fichier JSON par langue :

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Attention

L'ajout initial des fichiers de langue nécessite un redémarrage de l'application pour prendre effet.

:::

### ctx.t()

Dans un composant, `ctx.t()` renvoie le texte traduit :

```tsx
const ctx = useFlowContext();

// Utilisation de base
ctx.t('Hello');

// Avec variable
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Avec namespace explicite (par défaut, le namespace est le nom du package du plugin)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Dans le Plugin, `this.t()` est plus pratique — il **injecte automatiquement le nom du package du plugin comme namespace**, sans avoir à passer `ns` à la main :

```ts
class MyPlugin extends Plugin {
  async load() {
    // Utilise automatiquement le nom du package du plugin courant comme ns
    console.log(this.t('Hello'));

    // Équivalent à
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` est l'instance [i18next](https://www.i18next.com/) sous-jacente. En général, `ctx.t()` suffit. Mais si vous devez changer de langue dynamiquement ou écouter les changements de langue, utilisez `ctx.i18n` :

```ts
// Récupérer la langue courante
const currentLang = ctx.i18n.language; // 'zh-CN'

// Écouter les changements de langue
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Langue changée pour', lng);
});
```

### tExpr()

`tExpr()` génère une chaîne d'expression de traduction différée, généralement utilisée dans `FlowModel.define()` — car `define` s'exécute au chargement du module, sans instance i18n disponible :

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // produit '{{t("Hello block")}}', traduit à l'exécution
});
```

Pour des utilisations d'internationalisation plus complètes (écriture des fichiers de traduction, hook useT, tExpr, etc.), voir [Internationalisation i18n](../component/i18n). Liste complète des codes de langue supportés par NocoBase : [Liste des langues](../../languages).

## Logs (ctx.logger)

`ctx.logger` produit des logs structurés, basés sur [pino](https://github.com/pinojs/pino).

### Dans le Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin chargé', { plugin: 'my-plugin' });
    this.context.logger.error('Échec d\'initialisation', { error });
  }
}
```

### Dans un composant

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Page chargée', { page: 'UserList' });
    ctx.logger.debug('État utilisateur courant', { user });
  };

  // ...
}
```

Niveaux de log du plus haut au plus bas : `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Seuls les logs supérieurs ou égaux au niveau configuré sont émis.

## Routes (ctx.router / ctx.route / ctx.location)

Les capacités liées aux routes se divisent en trois parties : enregistrement (Plugin uniquement), navigation et récupération d'informations (composant uniquement).

### Enregistrement de routes (this.router / this.pluginSettingsManager)

Dans `load()` du Plugin, enregistrez les routes de page via `this.router.add()` et les pages de configuration de plugin via `this.pluginSettingsManager` :

```ts
async load() {
  // Enregistrer une route de page standard
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Enregistrer la page de configuration du plugin (apparaîtra dans le menu « Configuration des plugins »)
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Icône Ant Design, voir https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Voir [Router](../router) pour les détails. Exemple complet de page de configuration : [Faire une page de configuration de plugin](../examples/settings-page).

:::warning Attention

`this.router` est le RouterManager, utilisé pour **enregistrer des routes**. `this.pluginSettingsManager` est le PluginSettingsManager, utilisé pour **enregistrer la page de configuration**. Les deux ne sont pas la même chose que `ctx.router` (React Router, utilisé pour la **navigation**) dans les composants.

:::

### Navigation (ctx.router)

Dans un composant, naviguez via `ctx.router.navigate()` :

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Informations de route (ctx.route)

Dans un composant, récupérez les informations de la route courante via `ctx.route` :

```tsx
const ctx = useFlowContext();

// Récupère le paramètre dynamique (par exemple route définie /users/:id)
const { id } = ctx.route.params;

// Récupère le nom de la route
const { name } = ctx.route;
```

Type complet de `ctx.route` :

```ts
interface RouteOptions {
  name?: string;         // Identifiant unique de la route
  path?: string;         // Modèle de route
  pathname?: string;     // Chemin complet de la route
  params?: Record<string, any>; // Paramètres de la route
}
```

### URL courante (ctx.location)

`ctx.location` fournit les détails de l'URL courante, similaire à `window.location` du navigateur :

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

`ctx.route` et `ctx.location` sont aussi accessibles via `this.context` dans le Plugin, mais l'URL au moment du chargement du plugin est indéterminée et la valeur n'a pas de sens. Il est recommandé de les utiliser dans les composants.

## Gestion des vues (ctx.viewer / ctx.view)

`ctx.viewer` permet d'ouvrir des boîtes de dialogue, des tiroirs, etc. de façon impérative. Disponible aussi bien dans le Plugin que dans les composants.

### Dans le Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Par exemple, ouvrir une boîte de dialogue dans une logique d'initialisation
    this.context.viewer.dialog({
      title: 'Bienvenue',
      content: () => <div>Plugin initialisé</div>,
    });
  }
}
```

### Dans un composant

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Ouvrir une boîte de dialogue
    ctx.viewer.dialog({
      title: 'Modifier l\'utilisateur',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Ouvrir un tiroir
    ctx.viewer.drawer({
      title: 'Détails',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Modifier</Button>
      <Button onClick={openDrawer}>Voir les détails</Button>
    </div>
  );
}
```

### Méthode générique

```tsx
// Spécifier le type de vue via type
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Titre',
  content: () => <SomeComponent />,
});
```

### Manipuler la vue depuis l'intérieur (ctx.view)

Dans un composant à l'intérieur d'une boîte de dialogue ou d'un tiroir, vous pouvez manipuler la vue courante (par exemple la fermer) via `ctx.view` :

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Contenu de la boîte de dialogue</p>
      <Button onClick={() => ctx.view.close()}>Fermer</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` est l'instance FlowEngine, disponible uniquement dans le Plugin. On l'utilise généralement pour enregistrer des FlowModel :

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Enregistrer un FlowModel (chargement à la demande recommandé)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel est le cœur du système de configuration visuelle de NocoBase — si votre composant doit apparaître dans le menu « Ajouter un bloc / champ / action », il faut l'encapsuler avec FlowModel. Voir [FlowEngine](../flow-engine/index.md) pour les détails.

## Autres capacités

Les capacités suivantes peuvent être utiles dans des scénarios plus avancés ; les voici brièvement listées :

| Propriété | Description |
| ----------------------- | ----------------------------------------------- |
| `ctx.model` | Instance FlowModel courante (disponible dans le contexte d'exécution d'un Flow) |
| `ctx.ref` | Référence du composant, à utiliser avec `ctx.onRefReady` |
| `ctx.exit()` | Sortir de l'exécution du Flow courant |
| `ctx.defineProperty()` | Ajouter dynamiquement une propriété personnalisée au contexte |
| `ctx.defineMethod()` | Ajouter dynamiquement une méthode personnalisée au contexte |
| `ctx.useResource()` | Récupérer l'interface d'opération sur les ressources de données |
| `ctx.dataSourceManager` | Gestion des sources de données |

Pour les détails, voir [Documentation complète FlowEngine](../../../flow-engine/index.md).

## Liens connexes

- [Aperçu du Context](../ctx/index.md) — points communs et différences entre les deux entrées de contexte
- [Plugin](../plugin) — raccourcis du Plugin
- [Développement de composants Component](../component/index.md) — utilisation de useFlowContext dans les composants
- [Router](../router) — enregistrement et navigation
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowEngine
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction, tExpr, useT
- [Liste des langues](../../languages) — codes de langue supportés par NocoBase
- [Faire une page de configuration de plugin](../examples/settings-page) — exemple complet d'utilisation de ctx.api
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
