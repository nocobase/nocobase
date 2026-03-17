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

Agrega rutas de páginas normales mediante `router.add()`. Para los componentes de página, usa `componentLoader` para registrarlos bajo demanda, de modo que el módulo de la página solo se cargue cuando realmente se visite la ruta.

Los archivos de página deben usar `export default`:

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
      // Importación dinámica: el módulo de la página solo se carga cuando se entra en esta ruta
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

Admite parámetros dinámicos

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Si la página es pesada o no es necesaria en el primer renderizado, se recomienda priorizar `componentLoader`; `element` sigue siendo adecuado para rutas de diseño o páginas en línea muy ligeras.

## Extensión de páginas de configuración de plugins

Agrega páginas de configuración del plugin mediante `pluginSettingsRouter.add()`. Al igual que las rutas de páginas normales, las páginas de configuración también deben usar `componentLoader` para el registro bajo demanda.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Título de la página de configuración
      icon: 'ApiOutlined', // Icono del menú de la página de configuración
      // Importación dinámica: el módulo de la página solo se carga cuando se entra en esta página de configuración
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Rutas secundarias
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Importación dinámica: el módulo de la página solo se carga cuando se entra en esta página de configuración
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```