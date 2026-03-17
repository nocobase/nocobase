:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Router

De NocoBase-client biedt een flexibele routermanager die het uitbreiden van pagina's en instellingenpagina's voor plugins ondersteunt via `router.add()` en `pluginSettingsRouter.add()`.

## Geregistreerde standaard paginaroutes

| Naam           | Pad                | Component           | Beschrijving               |
| -------------- | ------------------ | ------------------- | -------------------------- |
| admin          | /admin/\*          | AdminLayout         | Beheerpagina's             |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dynamisch aangemaakte pagina's |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Instellingenpagina's voor plugins |

## Reguliere pagina-uitbreiding

Voeg gewone paginaroutes toe via `router.add()`. Gebruik voor paginacomponenten `componentLoader`, zodat de paginamodule pas wordt geladen wanneer de route daadwerkelijk wordt bezocht.

Paginabestanden moeten `export default` gebruiken:

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
      // Dynamische import: de paginamodule wordt pas geladen wanneer deze route wordt geopend
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

Ondersteuning voor dynamische parameters

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Als een pagina zwaar is of niet nodig is bij de eerste render, geef dan de voorkeur aan `componentLoader`; `element` blijft geschikt voor lay-outroutes of zeer lichte inlinepagina's.

## Uitbreiding van instellingenpagina's voor plugins

Voeg plugin-instellingenpagina's toe via `pluginSettingsRouter.add()`. Net als gewone routes moeten instellingenpagina's ook `componentLoader` gebruiken.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Titel van de instellingenpagina
      icon: 'ApiOutlined', // Menu-icoon voor de instellingenpagina
      // Dynamische import: de paginamodule wordt pas geladen wanneer deze instellingenpagina wordt geopend
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Voorbeeld van routering op meerdere niveaus

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Route op hoofdniveau
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // Subroutes
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dynamische import: de paginamodule wordt pas geladen wanneer deze instellingenpagina wordt geopend
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```