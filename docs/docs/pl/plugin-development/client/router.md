:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Router

Klient NocoBase oferuje elastyczny menedżer routera, który umożliwia rozszerzanie stron oraz stron ustawień wtyczek za pomocą metod `router.add()` i `pluginSettingsRouter.add()`.

## Domyślne zarejestrowane trasy stron

| Nazwa          | Ścieżka            | Komponent           | Opis                        |
| -------------- | ------------------ | ------------------- | --------------------------- |
| admin          | /admin/\*          | AdminLayout         | Strony administracyjne      |
| admin.page     | /admin/:name       | AdminDynamicPage    | Strony tworzone dynamicznie |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Strony ustawień wtyczek     |

## Rozszerzanie zwykłych stron

Zwykłe trasy stron dodaje się za pomocą metody `router.add()`.

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

Obsługa parametrów dynamicznych

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Rozszerzanie stron ustawień wtyczek

Strony ustawień wtyczek dodaje się za pomocą metody `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Tytuł strony ustawień
      icon: 'ApiOutlined', // Ikona menu strony ustawień
      Component: HelloSettingPage,
    });
  }
}
```

Przykład trasowania wielopoziomowego

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Trasa najwyższego poziomu
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Trasy podrzędne
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