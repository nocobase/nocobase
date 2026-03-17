:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Router

Il client NocoBase offre un gestore di router flessibile che Le permette di estendere le pagine e le pagine di impostazioni dei plugin tramite `router.add()` e `pluginSettingsRouter.add()`.

## Route di Pagina Predefinite Registrate

| Nome           | Percorso           | Componente          | Descrizione                   |
| -------------- | ------------------ | ------------------- | ----------------------------- |
| admin          | /admin/\*          | AdminLayout         | Pagine di amministrazione     |
| admin.page     | /admin/:name       | AdminDynamicPage    | Pagine create dinamicamente   |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Pagine di impostazioni dei plugin |

## Estensione di Pagine Regolari

Aggiungi le route delle pagine normali tramite `router.add()`. Per i componenti di pagina, usa `componentLoader` per la registrazione on demand, così il modulo della pagina verrà caricato solo quando la route viene effettivamente visitata.

I file di pagina devono usare `export default`:

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
      // Import dinamico: il modulo della pagina viene caricato solo quando si entra in questa route
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

Supporta parametri dinamici

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Se la pagina è pesante o non è necessaria al primo rendering, è consigliabile preferire `componentLoader`; `element` resta adatto per le route di layout o per pagine inline molto leggere.

## Estensione delle Pagine di Impostazioni dei Plugin

Aggiungi le pagine delle impostazioni del plugin tramite `pluginSettingsRouter.add()`. Come per le route normali, anche le pagine delle impostazioni dovrebbero usare `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titolo della pagina di impostazioni
      icon: 'ApiOutlined', // Icona del menu della pagina di impostazioni
      // Import dinamico: il modulo della pagina viene caricato solo quando si entra in questa pagina delle impostazioni
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Esempio di routing multilivello

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Route di primo livello
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // Route figlie
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Import dinamico: il modulo della pagina viene caricato solo quando si entra in questa pagina delle impostazioni
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```