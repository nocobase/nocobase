:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Router

Il client NocoBase offre un gestore di router flessibile che Le permette di estendere le pagine e le pagine di impostazioni dei plugin tramite `router.add()` e `pluginSettingsRouter.add()`.

## Route di Pagina Predefinite Registrate

| Nome           | Percorso           | Componente          | Descrizione                   |
| -------------- | ------------------ | ------------------- | ----------------------------- |
| admin          | /admin/\*          | AdminLayout         | Pagine di amministrazione     |
| admin.page     | /admin/:name       | AdminDynamicPage    | Pagine create dinamicamente   |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Pagine di impostazioni dei plugin |

## Estensione di Pagine Regolari

Aggiunga route di pagina regolari tramite `router.add()`.

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

Supporta parametri dinamici

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Estensione delle Pagine di Impostazioni dei Plugin

Aggiunga le pagine di impostazioni dei plugin tramite `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titolo della pagina di impostazioni
      icon: 'ApiOutlined', // Icona del menu della pagina di impostazioni
      Component: HelloSettingPage,
    });
  }
}
```

Esempio di routing multilivello

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Route di primo livello
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Route figlie
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