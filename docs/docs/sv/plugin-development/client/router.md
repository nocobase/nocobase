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

Lägg till vanliga sidrutter via `router.add()`. För sidkomponenter bör du använda `componentLoader`, så att sidmodulen bara laddas när rutten faktiskt besöks.

Sidfiler måste använda `export default`:

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
      // Dynamisk import: sidmodulen laddas först när denna rutt öppnas
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

Stödjer dynamiska parametrar

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Om sidan är tung eller inte behövs vid första renderingen bör du föredra `componentLoader`; `element` passar fortfarande för layoutrutter eller mycket lätta inline-sidor.

## Utökning av inställningssidor för plugin

Lägg till plugininställningssidor via `pluginSettingsRouter.add()`. Precis som vanliga rutter bör även inställningssidor använda `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Sidans titel
      icon: 'ApiOutlined', // Menyikon för sidan
      // Dynamisk import: sidmodulen laddas först när denna inställningssida öppnas
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Underrutter
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dynamisk import: sidmodulen laddas först när denna inställningssida öppnas
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```