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

Dodaj zwykłe trasy stron za pomocą `router.add()`. W przypadku komponentów stron używaj `componentLoader`, aby moduł strony był ładowany dopiero wtedy, gdy użytkownik faktycznie wejdzie na daną trasę.

Pliki stron muszą używać `export default`:

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
      // Import dynamiczny: moduł strony zostanie załadowany dopiero po wejściu na tę trasę
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

Obsługa parametrów dynamicznych

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Jeśli strona jest ciężka lub nie jest potrzebna przy pierwszym renderowaniu, preferuj `componentLoader`; `element` nadal nadaje się do tras układu lub bardzo lekkich stron inline.

## Rozszerzanie stron ustawień wtyczek

Dodaj strony ustawień wtyczki za pomocą `pluginSettingsRouter.add()`. Podobnie jak zwykłe trasy, strony ustawień również powinny używać `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Tytuł strony ustawień
      icon: 'ApiOutlined', // Ikona menu strony ustawień
      // Import dynamiczny: moduł strony zostanie załadowany dopiero po wejściu na tę stronę ustawień
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Trasy podrzędne
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Import dynamiczny: moduł strony zostanie załadowany dopiero po wejściu na tę stronę ustawień
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```