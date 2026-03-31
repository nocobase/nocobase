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

Ajoutez des routes de page classiques via la méthode `router.add()`.

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

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

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
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

## Extension des pages de configuration des plugins

Ajoutez des pages de configuration des plugins via la méthode `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titre de la page de configuration
      icon: 'ApiOutlined', // Icône du menu de la page de configuration
      Component: HelloSettingPage,
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
      Component: Outlet,
    });

    // Routes enfants
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```