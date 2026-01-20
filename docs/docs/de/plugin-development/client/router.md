:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Router

Der NocoBase-Client bietet einen flexiblen Router-Manager, der es Ihnen ermöglicht, Seiten und Plugin-Einstellungsseiten mithilfe von `router.add()` und `pluginSettingsRouter.add()` zu erweitern.

## Registrierte Standard-Seitenrouten

| Name           | Pfad               | Komponente                | Beschreibung              |
| -------------- | ------------------ | ------------------- | ------------------------- |
| admin          | /admin/\*          | AdminLayout         | Admin-Seiten              |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dynamisch erstellte Seiten |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Plugin-Einstellungsseiten |

## Erweitern von Standardseiten

Sie können reguläre Seitenrouten mit `router.add()` hinzufügen.

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

Unterstützt dynamische Parameter

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Erweitern von Plugin-Einstellungsseiten

Sie können Plugin-Einstellungsseiten mit `pluginSettingsRouter.add()` hinzufügen.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titel der Einstellungsseite
      icon: 'ApiOutlined', // Menüsymbol der Einstellungsseite
      Component: HelloSettingPage,
    });
  }
}
```

Mehrstufiges Routing-Beispiel

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Hauptroute
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Unterrouten
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