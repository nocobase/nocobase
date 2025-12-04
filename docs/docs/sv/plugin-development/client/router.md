:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Router

NocoBase-klienten erbjuder en flexibel routerhanterare som gör det möjligt att utöka sidor och inställningssidor för plugin via `router.add()` och `pluginSettingsRouter.add()`.

## Registrerade standardsidrutter

| Namn           | Sökväg             | Komponent           | Beskrivning               |
| -------------- | ------------------ | ------------------- | ------------------------- |
| admin          | /admin/\*          | AdminLayout         | Administratörssidor       |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dynamiskt skapade sidor   |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Inställningssidor för plugin |

## Utökning av vanliga sidor

Lägg till vanliga sidrutter via `router.add()`.

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

Stödjer dynamiska parametrar

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Utökning av inställningssidor för plugin

Lägg till inställningssidor för plugin via `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Sidans titel
      icon: 'ApiOutlined', // Menyikon för sidan
      Component: HelloSettingPage,
    });
  }
}
```

Exempel på flernivårutter

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Toppnivårutt
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Underrutter
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