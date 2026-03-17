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

Sie können reguläre Seitenrouten mit `router.add()` hinzufügen. Für Seitenkomponenten sollte `componentLoader` verwendet werden, damit das Seitenmodul erst geladen wird, wenn die Route tatsächlich aufgerufen wird.

Seitendateien müssen `export default` verwenden:

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
      // Dynamischer Import: Das Seitenmodul wird erst geladen, wenn diese Route betreten wird
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

Unterstützt dynamische Parameter

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Wenn eine Seite umfangreicher ist oder nicht beim ersten Rendern benötigt wird, sollte `componentLoader` bevorzugt werden. `element` eignet sich weiterhin für Layout-Routen oder sehr leichte Inline-Seiten.

## Erweitern von Plugin-Einstellungsseiten

Sie können Plugin-Einstellungsseiten mit `pluginSettingsRouter.add()` hinzufügen. Wie bei normalen Routen sollte auch hier `componentLoader` verwendet werden.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titel der Einstellungsseite
      icon: 'ApiOutlined', // Menüsymbol der Einstellungsseite
      // Dynamischer Import: Das Seitenmodul wird erst geladen, wenn diese Einstellungsseite betreten wird
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Unterrouten
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dynamischer Import: Das Seitenmodul wird erst geladen, wenn diese Einstellungsseite betreten wird
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```
