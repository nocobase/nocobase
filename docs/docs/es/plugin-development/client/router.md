---
title: "Router"
description: "Enrutamiento del cliente de NocoBase: this.router.add para registrar rutas de página, pluginSettingsManager para registrar páginas de configuración de plugins (addMenuItem + addPageTabItem)."
keywords: "Router,enrutamiento,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,registro de páginas,NocoBase"
---

# Router

En NocoBase, los plugins registran páginas mediante rutas. Hay dos enfoques habituales:

- `this.router.add()`: registra rutas de página normales
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()`: registra páginas de configuración de plugins

El registro de rutas suele realizarse en el método `load()` del plugin. Consulte [Plugin](./plugin) para más detalles.

:::warning Nota

En los plugins de NocoBase v2, las rutas registradas reciben por defecto el prefijo `/v`. Debe incluir este prefijo al acceder a las rutas.

:::

## Rutas predeterminadas

NocoBase tiene registradas las siguientes rutas predeterminadas:

| Nombre         | Ruta                  | Componente          | Descripción                   |
| -------------- | --------------------- | ------------------- | ----------------------------- |
| admin          | /v/admin/\*          | AdminLayout         | Páginas de administración     |
| admin.page     | /v/admin/:name       | AdminDynamicPage    | Páginas creadas dinámicamente |
| admin.settings | /v/admin/settings/\* | AdminSettingsLayout | Páginas de configuración de plugins |

## Rutas de página

Registre rutas de página mediante `this.router.add()`. Los componentes de página deberían usar `componentLoader` para la carga diferida, de modo que el código de la página solo se cargue cuando se visita realmente.

:::warning Nota

Los archivos de página deben exportar el componente con `export default`.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Registro en el método `load()` del plugin:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Carga diferida: el módulo solo se carga al visitar /v/hello
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

El primer argumento de `router.add()` es el nombre de la ruta, que admite la notación de punto `.` para expresar relaciones padre-hijo. Por ejemplo, `root.home` representa una ruta hija de `root`.

En los componentes, puede navegar a una ruta mediante `ctx.router.navigate('/hello')`.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Para más detalles, consulte la sección de enrutamiento en [Component](./component/index.md).

### Rutas anidadas

El anidamiento se implementa mediante la notación de punto. Las rutas padre usan `<Outlet />` para renderizar el contenido de las rutas hijas:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Ruta padre, con element como diseño en línea
    this.router.add('root', {
      element: (
        <div>
          <nav>Barra de navegación</nav>
          <Outlet />
        </div>
      ),
    });

    // Ruta hija, con componentLoader para la carga diferida
    this.router.add('root.home', {
      path: '/', // -> /v/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Parámetros dinámicos

Las rutas admiten parámetros dinámicos:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

En los componentes, puede obtener los parámetros dinámicos mediante `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Obtener el parámetro dinámico id
  return <h1>User ID: {id}</h1>;
}
```

Para más detalles, consulte la sección de enrutamiento en [Component](./component/index.md).

### componentLoader vs. element

- **`componentLoader`** (recomendado): carga diferida, adecuada para componentes de página. Los archivos de página necesitan `export default`.
- **`element`**: pasa JSX directamente, adecuado para componentes de diseño o páginas en línea muy ligeras.

Si la página tiene dependencias pesadas, es preferible usar `componentLoader`.

## Páginas de configuración de plugins

Registre páginas de configuración de plugins mediante `this.pluginSettingsManager`. El registro consta de dos pasos: primero use `addMenuItem()` para registrar la entrada de menú y luego `addPageTabItem()` para registrar la página real. Las páginas de configuración aparecen en el menú «Configuración de plugins» de NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Registrar la entrada de menú
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Nombre de un icono de Ant Design, consulte https://5x.ant.design/components/icon
    });

    // Registrar la página (la clave 'index' se asigna a la ruta raíz del menú)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Tras el registro, la ruta de acceso es `/v/admin/settings/hello`. Cuando solo hay una página bajo el menú, la barra de pestañas superior se oculta automáticamente.

### Página de configuración con varias pestañas

Si la página de configuración necesita varias subpáginas, registre varias llamadas a `addPageTabItem` con el mismo `menuKey`: arriba aparecerá automáticamente una barra de pestañas:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Registrar la entrada de menú
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Pestaña 1: Configuración general (la clave 'index' se asigna a /v/admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Pestaña 2: Configuración avanzada (se asigna a /v/admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Parámetros de addMenuItem

| Campo      | Tipo                  | Obligatorio | Descripción                                                          |
| ---------- | --------------------- | ----------- | -------------------------------------------------------------------- |
| `key`      | `string`              | Sí          | Identificador único del menú, no puede contener `.`                  |
| `title`    | `ReactNode`           | No          | Título del menú                                                      |
| `icon`     | `string \| ReactNode` | No          | Icono del menú; cuando es una cadena, se renderiza como `Icon` integrado |
| `sort`     | `number`              | No          | Valor de orden; los valores menores aparecen primero, por defecto `0` |
| `showTabs` | `boolean`             | No          | Si se muestra la barra de pestañas superior; por defecto se determina según el número de páginas |
| `hidden`   | `boolean`             | No          | Si se oculta la entrada de navegación                                |

### Parámetros de addPageTabItem

| Campo             | Tipo        | Obligatorio | Descripción                                                          |
| ----------------- | ----------- | ----------- | -------------------------------------------------------------------- |
| `menuKey`         | `string`    | Sí          | El `key` del menú padre, correspondiente al `key` de `addMenuItem`   |
| `key`             | `string`    | Sí          | Identificador único de la página. `'index'` indica la página predeterminada, asignada a la ruta raíz del menú |
| `title`           | `ReactNode` | No          | Título de la página (se muestra en la pestaña)                       |
| `componentLoader` | `Function`  | No          | Componente de página con carga diferida (recomendado)                |
| `Component`       | `Component` | No          | Pasar el componente directamente (alternativa a `componentLoader`)   |
| `sort`            | `number`    | No          | Valor de orden; los valores menores aparecen primero                 |
| `hidden`          | `boolean`   | No          | Si se oculta en la barra de pestañas                                 |
| `link`            | `string`    | No          | Enlace externo; cuando se establece, al hacer clic en la pestaña se navega a la URL externa |

## Enlaces relacionados

- [Plugin](./plugin): las rutas se registran en `load()`
- [Component](./component/index.md): cómo escribir los componentes de página que las rutas montan
- [Ejemplo de plugin: crear una página de configuración](./examples/settings-page): ejemplo completo de página de configuración
