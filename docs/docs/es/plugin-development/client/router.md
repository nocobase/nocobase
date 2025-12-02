:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Router

El cliente de NocoBase le ofrece un gestor de rutas flexible que le permite extender páginas y páginas de configuración de plugins mediante `router.add()` y `pluginSettingsRouter.add()`.

## Rutas de página predeterminadas

| Nombre           | Ruta               | Componente                | Descripción                 |
| -------------- | ------------------ | ------------------- | --------------------------- |
| admin          | /admin/\*          | AdminLayout         | Páginas de administración   |
| admin.page     | /admin/:name       | AdminDynamicPage    | Páginas creadas dinámicamente |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Páginas de configuración de plugins |

## Extensión de páginas generales

Añada rutas de página generales usando `router.add()`.

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

Admite parámetros dinámicos

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Extensión de páginas de configuración de plugins

Añada páginas de configuración de plugins usando `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Título de la página de configuración
      icon: 'ApiOutlined', // Icono del menú de la página de configuración
      Component: HelloSettingPage,
    });
  }
}
```

Ejemplo de rutas multinivel

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Ruta de nivel superior
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Rutas secundarias
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