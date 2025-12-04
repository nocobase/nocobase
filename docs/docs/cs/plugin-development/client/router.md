:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Router

Klient NocoBase nabízí flexibilního správce routeru, který umožňuje rozšířit stránky a stránky nastavení **pluginů** pomocí metod `router.add()` a `pluginSettingsRouter.add()`.

## Registrované výchozí routy stránek

| Název          | Cesta              | Komponenta          | Popis                       |
| -------------- | ------------------ | ------------------- | --------------------------- |
| admin          | /admin/\*          | AdminLayout         | Administrativní stránky     |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dynamicky vytvořené stránky |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Stránky nastavení **pluginů** |

## Rozšíření běžných stránek

Běžné routy stránek přidáte pomocí metody `router.add()`.

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

Podpora dynamických parametrů

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Rozšíření stránek nastavení **pluginů**

Stránky nastavení **pluginů** přidáte pomocí metody `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Název stránky nastavení
      icon: 'ApiOutlined', // Ikona pro menu stránky nastavení
      Component: HelloSettingPage,
    });
  }
}
```

Příklad vícestupňového routování

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Routa nejvyšší úrovně
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Podřízené routy
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