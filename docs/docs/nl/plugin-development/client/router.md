:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Router

De NocoBase-client biedt een flexibele routermanager die het uitbreiden van pagina's en instellingenpagina's voor plugins ondersteunt via `router.add()` en `pluginSettingsRouter.add()`.

## Geregistreerde standaard paginaroutes

| Naam           | Pad                | Component           | Beschrijving               |
| -------------- | ------------------ | ------------------- | -------------------------- |
| admin          | /admin/\*          | AdminLayout         | Beheerpagina's             |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dynamisch aangemaakte pagina's |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Instellingenpagina's voor plugins |

## Reguliere pagina-uitbreiding

Voeg reguliere paginaroutes toe via `router.add()`.

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

Ondersteuning voor dynamische parameters

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Uitbreiding van instellingenpagina's voor plugins

Voeg instellingenpagina's voor plugins toe via `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titel van de instellingenpagina
      icon: 'ApiOutlined', // Menu-icoon voor de instellingenpagina
      Component: HelloSettingPage,
    });
  }
}
```

Voorbeeld van routering op meerdere niveaus

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Route op hoofdniveau
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Subroutes
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