:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Routeur

Le client NocoBase met à votre disposition un gestionnaire de routeur flexible. Il vous permet d'étendre les pages et les pages de configuration des plugins via les méthodes `router.add()` et `pluginSettingsManager`.

## Routes de page par défaut enregistrées

| Nom            | Chemin             | Composant           | Description                     |
| -------------- | ------------------ | ------------------- | ------------------------------- |
| admin          | /admin/\*          | AdminLayout         | Pages d'administration          |
| admin.page     | /admin/:name       | AdminDynamicPage    | Pages créées dynamiquement      |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Pages de configuration des plugins |

## Extension des pages classiques

Ajoutez des routes de page classiques via `router.add()`. Pour les composants de page, utilisez `componentLoader` pour un enregistrement à la demande, afin que le module de la page ne soit chargé que lorsque la route est réellement visitée.

Les fichiers de page doivent utiliser `export default` :

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', {
      path: '/',
      // Import dynamique : le module de page n'est chargé que lorsque cette route est réellement visitée
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

Prise en charge des paramètres dynamiques

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Si la page est lourde ou n'est pas nécessaire au premier affichage, privilégiez `componentLoader` ; `element` reste adapté aux routes de mise en page ou aux pages inline très légères.

## Extension des pages de configuration des plugins

Register plugin settings pages via `this.pluginSettingsManager`. Registration has two steps — first use `addMenuItem()` to register the menu entry, then use `addPageTabItem()` to register the actual page. Settings pages appear in the NocoBase "Plugin Settings" menu.

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

To add multiple sub-pages under a single menu entry, register multiple `addPageTabItem` calls with the same `menuKey` — tabs will appear automatically:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```