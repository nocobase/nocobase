---
title: "Router - routage"
description: "Routage côté client de NocoBase : enregistrement de pages avec this.router.add, enregistrement de pages de configuration de plugin via pluginSettingsManager (addMenuItem + addPageTabItem)."
keywords: "Router,routage,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,enregistrement de page,NocoBase"
---

# Router - routage

Dans NocoBase, les plugins enregistrent des pages via le routage. Deux approches courantes :

- `this.router.add()` — Enregistrer une route de page classique
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — Enregistrer une page de configuration de plugin

L'enregistrement des routes se fait habituellement dans la méthode `load()` du plugin ; voir [Plugin](./plugin) pour plus de détails.

:::warning Attention

Pour les plugins de NocoBase v2, les routes enregistrées seront préfixées par `/v2` par défaut ; il faut donc inclure ce préfixe dans l'URL d'accès.

:::

## Routes par défaut

NocoBase a déjà enregistré les routes par défaut suivantes :

| Nom            | Chemin                | Composant           | Description           |
| -------------- | --------------------- | ------------------- | --------------------- |
| admin          | /v2/admin/\*          | AdminLayout         | Pages d'administration |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | Pages créées dynamiquement |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | Pages de configuration des plugins |

## Routes de page

Enregistrez vos routes de page via `this.router.add()`. Pour les composants de page, il est recommandé d'utiliser `componentLoader` pour un chargement à la demande, afin que le code de la page ne soit chargé que lorsque la route est réellement visitée.

:::warning Attention

Les fichiers de page doivent obligatoirement exporter le composant via `export default`.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Enregistrement dans le `load()` du plugin :

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Chargement à la demande : le module n'est chargé que lorsque /v2/hello est visité
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

Le premier argument de `router.add()` est le nom de la route, qui prend en charge la notation pointée `.` pour exprimer une relation parent-enfant. Par exemple, `root.home` désigne une sous-route de `root`.

Dans un composant, vous pouvez naviguer vers cette route via `ctx.router.navigate('/hello')`.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Pour plus de détails, voir la section sur le routage dans [Développement de Component](./component/index.md).

### Routes imbriquées

L'imbrication s'obtient via la notation pointée. La route parente utilise `<Outlet />` pour rendre le contenu de la sous-route :

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Route parente : on écrit le layout directement avec element
    this.router.add('root', {
      element: (
        <div>
          <nav>Barre de navigation</nav>
          <Outlet />
        </div>
      ),
    });

    // Sous-route : chargement à la demande via componentLoader
    this.router.add('root.home', {
      path: '/', // -> /v2/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v2/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Paramètres dynamiques

Les chemins de route prennent en charge les paramètres dynamiques :

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

Dans le composant, récupérez les paramètres dynamiques via `ctx.route.params` :

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Récupère le paramètre dynamique id
  return <h1>User ID: {id}</h1>;
}
```

Pour plus de détails, voir la section sur le routage dans [Développement de Component](./component/index.md).

### componentLoader vs element

- **`componentLoader`** (recommandé) : chargement à la demande, idéal pour les composants de page ; le fichier de page doit utiliser `export default`
- **`element`** : passe directement du JSX, adapté aux composants de mise en page ou aux pages inline très légères

Si la page est lourde, préférez `componentLoader`.

## Pages de configuration de plugin

Enregistrez les pages de configuration de plugin via `this.pluginSettingsManager`. L'enregistrement se fait en deux étapes : d'abord enregistrer l'entrée de menu avec `addMenuItem()`, puis enregistrer la page réelle avec `addPageTabItem()`. Les pages de configuration apparaissent dans le menu « Configuration des plugins » de NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Enregistrer l'entrée de menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Configuration Hello'),
      icon: 'ApiOutlined', // Nom d'icône Ant Design, voir https://5x.ant.design/components/icon
    });

    // Enregistrer la page (lorsque key vaut 'index', elle est mappée sur le chemin racine du menu)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Configuration Hello'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Une fois enregistrée, l'URL d'accès est `/admin/settings/hello`. Lorsqu'il n'y a qu'une seule page sous le menu, la barre d'onglets en haut est masquée automatiquement.

### Page de configuration multi-onglets

Si la page de configuration nécessite plusieurs sous-pages, enregistrez plusieurs `addPageTabItem` avec le même `menuKey` ; la barre d'onglets apparaîtra automatiquement en haut :

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Enregistrer l'entrée de menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Onglet 1 : Configuration de base (key vaut 'index', mappé sur /admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Configuration de base'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Onglet 2 : Configuration avancée (mappé sur /admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Configuration avancée'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Paramètres de addMenuItem

| Champ      | Type                  | Requis | Description                                           |
| ---------- | --------------------- | ------ | ----------------------------------------------------- |
| `key`      | `string`              | Oui    | Identifiant unique du menu, ne peut pas contenir `.`  |
| `title`    | `ReactNode`           | Non    | Titre du menu                                         |
| `icon`     | `string \| ReactNode` | Non    | Icône du menu ; si c'est une chaîne, elle est rendue via `Icon` intégré |
| `sort`     | `number`              | Non    | Valeur de tri ; plus la valeur est petite, plus l'élément est en avant ; valeur par défaut `0` |
| `showTabs` | `boolean`             | Non    | Afficher ou non la barre d'onglets ; déterminé automatiquement par défaut selon le nombre de pages |
| `hidden`   | `boolean`             | Non    | Masquer ou non l'entrée de navigation                 |

### Paramètres de addPageTabItem

| Champ              | Type        | Requis | Description                                                            |
| ------------------ | ----------- | ------ | ---------------------------------------------------------------------- |
| `menuKey`          | `string`    | Oui    | `key` du menu auquel rattacher la page, correspond au `key` d' `addMenuItem` |
| `key`              | `string`    | Oui    | Identifiant unique de la page. `'index'` représente la page par défaut, mappée sur le chemin racine du menu |
| `title`            | `ReactNode` | Non    | Titre de la page (affiché sur l'onglet)                               |
| `componentLoader`  | `Function`  | Non    | Composant chargé en lazy loading (recommandé)                         |
| `Component`        | `Component` | Non    | Composant passé directement (alternative à `componentLoader`)         |
| `sort`             | `number`    | Non    | Valeur de tri ; plus la valeur est petite, plus l'élément est en avant |
| `hidden`           | `boolean`   | Non    | Masquer ou non l'élément dans la barre d'onglets                      |
| `link`             | `string`    | Non    | Lien externe ; lorsqu'il est défini, cliquer sur l'onglet redirige vers cette URL externe |

## Liens connexes

- [Plugin](./plugin) — Le routage est enregistré dans `load()`
- [Développement de Component](./component/index.md) — Comment écrire les composants de page montés sur les routes
- [Exemple pratique : créer une page de configuration de plugin](./examples/settings-page) — Exemple complet de page de configuration
