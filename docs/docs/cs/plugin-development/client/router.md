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

Běžné routy stránek přidáte pomocí metody `router.add()`. U stránkových komponent je potřeba používat `componentLoader`, aby se modul stránky načetl až ve chvíli, kdy uživatel na danou routu skutečně vstoupí.

Soubory stránek musí používat `export default`:

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
      // Dynamický import: modul stránky se načte až při vstupu na tuto routu
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

Podpora dynamických parametrů

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Pokud je stránka objemnější nebo není potřeba při prvním vykreslení, používejte přednostně `componentLoader`. `element` je stále vhodný pro layout routy nebo velmi lehké inline stránky.

## Rozšíření stránek nastavení **pluginů**

Stránky nastavení **pluginů** přidáte pomocí metody `pluginSettingsRouter.add()`. Stejně jako u běžných rout by i zde měl být použit `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Název stránky nastavení
      icon: 'ApiOutlined', // Ikona pro menu stránky nastavení
      // Dynamický import: modul stránky se načte až při vstupu na tuto stránku nastavení
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Podřízené routy
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dynamický import: modul stránky se načte až při vstupu na tuto stránku nastavení
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```
