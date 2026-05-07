---
title: "Context"
description: "Mecanismo de contexto en el cliente de NocoBase: this.context en el Plugin y useFlowContext() en los componentes son el mismo objeto, solo cambia el punto de acceso."
keywords: "Context,contexto,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context

En NocoBase, el **contexto (Context)** es el puente entre el código del plugin y las capacidades de NocoBase. A través del contexto puede hacer peticiones, traducir textos, escribir logs, navegar entre páginas, etc.

El contexto tiene dos puntos de acceso:

- **En el Plugin**: `this.context`.
- **En los componentes React**: `useFlowContext()` (importado desde `@nocobase/flow-engine`).

Ambos devuelven **el mismo objeto** (una instancia de `FlowEngineContext`); solo cambia el escenario de uso.

## Uso en el Plugin

En los métodos del ciclo de vida del plugin, como `load()`, acceda mediante `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Acceder a las capacidades a través de this.context
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('Información de la aplicación', response.data);

    // Internacionalización: this.t() inyecta automáticamente el nombre del paquete del plugin como namespace
    console.log(this.t('Hello'));
  }
}
```

## Uso en componentes

En los componentes React, obtenga el mismo objeto de contexto con `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Atajos del Plugin vs propiedades de ctx

La clase Plugin ofrece varios atajos para usarlos cómodamente dentro de `load()`. Atención: **algunos atajos del Plugin y las propiedades del mismo nombre en `ctx` apuntan a cosas distintas**:

| Atajo del Plugin               | Apunta a              | Uso                                                          |
| ------------------------------ | --------------------- | ------------------------------------------------------------ |
| `this.router`                  | RouterManager         | Registrar rutas con `.add()`                                 |
| `this.pluginSettingsManager`   | PluginSettingsManager | Registrar páginas de configuración (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`              | Instancia de FlowEngine | Registrar FlowModel                                          |
| `this.t()`                     | i18n.t() + ns automático | Internacionalización con el nombre del paquete inyectado     |
| `this.context`                 | FlowEngineContext     | Objeto de contexto, equivalente a `useFlowContext()`         |

Lo más fácil de confundir es `this.router` y `ctx.router`:

- **`this.router`** (atajo del Plugin) → RouterManager, sirve para **registrar rutas** (`.add()`).
- **`ctx.router`** (propiedad del contexto) → instancia de React Router, sirve para **navegar entre páginas** (`.navigate()`).

```ts
// En el Plugin: registrar rutas
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// En el componente: navegación de páginas
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Capacidades comunes del contexto

A continuación se enumeran las capacidades habituales del contexto. Algunas solo están disponibles en el Plugin, otras solo en los componentes y otras están en ambos lados pero con sintaxis diferente.

| Capacidad   | Plugin (`this.xxx`)            | Componente (`ctx.xxx`)        | Notas                                                |
| ----------- | ------------------------------ | ----------------------------- | ---------------------------------------------------- |
| Petición API | `this.context.api`             | `ctx.api`                     | Uso idéntico                                         |
| i18n        | `this.t()` / `this.context.t`  | `ctx.t`                       | `this.t()` inyecta el namespace del plugin           |
| Logger      | `this.context.logger`          | `ctx.logger`                  | Uso idéntico                                         |
| Registro de rutas | `this.router.add()`       | -                             | Solo en el Plugin                                    |
| Navegación  | -                              | `ctx.router.navigate()`       | Solo en componentes                                  |
| Información de ruta | `this.context.location` | `ctx.route` / `ctx.location`  | Recomendado en componentes                           |
| Gestión de vistas | `this.context.viewer`    | `ctx.viewer`                  | Abrir diálogos, drawers, etc.                        |
| FlowEngine  | `this.flowEngine`              | -                             | Solo en el Plugin                                    |

Para el uso detallado y ejemplos de cada capacidad, consulte [Capacidades comunes](./common-capabilities).

## Enlaces relacionados

- [Capacidades comunes](./common-capabilities): uso detallado de `ctx.api`, `ctx.t`, `ctx.logger`, etc.
- [Plugin](../plugin): entrada del plugin y atajos.
- [Desarrollo de Component](../component/index.md): uso básico de `useFlowContext` en componentes.
