:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Routeur

Le client NocoBase met à votre disposition un gestionnaire de routeur flexible. Il vous permet d'étendre les pages et les pages de configuration des plugins via les méthodes `router.add()` et `pluginSettingsRouter.add()`.

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

Ajoutez des pages de réglages de plugin via `pluginSettingsRouter.add()`. Comme pour les routes classiques, les pages de réglages doivent elles aussi utiliser `componentLoader` pour le chargement à la demande.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titre de la page de configuration
      icon: 'ApiOutlined', // Icône du menu de la page de configuration
      // Import dynamique : le module de page n'est chargé que lorsque cette page de réglages est réellement visitée
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Exemple de routage multiniveau

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Route de niveau supérieur
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // Routes enfants
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Import dynamique : le module de page n'est chargé que lorsque cette page de réglages est réellement visitée
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```