:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Router

Der NocoBase-Client bietet einen flexiblen Router-Manager, der es Ihnen ermöglicht, Seiten und Plugin-Einstellungsseiten mithilfe von `router.add()` und `pluginSettingsManager` zu erweitern.

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
