---
title: "Capacidades comunes"
description: "Capacidades comunes del contexto en el cliente de NocoBase: peticiones con ctx.api, internacionalización con ctx.t, logger, ctx.router, gestión de vistas con ctx.viewer y control de permisos con ctx.acl."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Capacidades comunes

El objeto de contexto expone las capacidades nativas de NocoBase. Algunas solo están disponibles en el Plugin, otras solo en los componentes y otras en ambos lados con sintaxis diferente. Vista general:

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

A continuación se describen una a una, agrupadas por namespace.

## Peticiones API (ctx.api)

Use `ctx.api.request()` para llamar al backend. Su uso es idéntico al de [Axios](https://axios-http.com/).

### En el Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Petición directa dentro de load()
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('Información de la aplicación', response.data);
  }
}
```

### En componentes

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // Petición GET
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // Petición POST
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Cargar datos</button>;
}
```

### Combinado con useRequest de ahooks

En los componentes puede usar `useRequest` de [ahooks](https://ahooks.js.org/hooks/use-request/index) para simplificar la gestión del estado de la petición:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error en la petición: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refrescar</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Interceptores de peticiones

Mediante `ctx.api.axios` puede añadir interceptores de petición/respuesta, normalmente en el `load()` del Plugin:

```ts
async load() {
  // Interceptor de petición: añadir cabecera personalizada
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Interceptor de respuesta: tratamiento unificado de errores
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Error en la petición', error);
      return Promise.reject(error);
    },
  );
}
```

### Cabeceras personalizadas de NocoBase

NocoBase Server admite las siguientes cabeceras personalizadas. Suelen inyectarse automáticamente mediante interceptores y no es necesario establecerlas a mano:

| Cabecera          | Descripción                                   |
| ----------------- | --------------------------------------------- |
| `X-App`           | Aplicación actual en escenarios multi-app     |
| `X-Locale`        | Idioma actual (por ejemplo `zh-CN`, `en-US`)  |
| `X-Hostname`      | Nombre del host del cliente                   |
| `X-Timezone`      | Zona horaria del cliente (por ejemplo `+08:00`) |
| `X-Role`          | Rol actual                                    |
| `X-Authenticator` | Método de autenticación del usuario actual    |

## Internacionalización (ctx.t / ctx.i18n)

Los plugins de NocoBase gestionan los archivos multilingües en el directorio `src/locale/`, y `ctx.t()` se utiliza para acceder a las traducciones desde el código.

### Archivos multilingües

Cree un archivo JSON por idioma bajo `src/locale/`:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Atención

La primera vez que añada un archivo de idioma debe reiniciar la aplicación para que surta efecto.

:::

### ctx.t()

En los componentes, obtenga textos traducidos con `ctx.t()`:

```tsx
const ctx = useFlowContext();

// Uso básico
ctx.t('Hello');

// Con variables
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Especificar namespace (el por defecto es el nombre del paquete del plugin)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

En el Plugin es más cómodo usar `this.t()`: **inyecta automáticamente el nombre del paquete del plugin como namespace**, sin necesidad de pasar `ns`:

```ts
class MyPlugin extends Plugin {
  async load() {
    // Usa automáticamente el nombre del paquete actual como ns
    console.log(this.t('Hello'));

    // Equivalente a
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` es la instancia subyacente de [i18next](https://www.i18next.com/). Por lo general basta con `ctx.t()`. Si necesita cambiar el idioma dinámicamente o escuchar cambios de idioma, use `ctx.i18n`:

```ts
// Idioma actual
const currentLang = ctx.i18n.language; // 'zh-CN'

// Escuchar cambios de idioma
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Idioma cambiado a', lng);
});
```

### tExpr()

`tExpr()` genera una expresión de traducción diferida y suele usarse en `FlowModel.define()`, ya que el `define()` se ejecuta al cargar el módulo, momento en el que aún no existe la instancia de i18n:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // Genera '{{t("Hello block")}}', se traduce en tiempo de ejecución
});
```

Para una explicación completa de la internacionalización (archivos de traducción, hook `useT`, `tExpr`, etc.), consulte [Internacionalización (i18n)](../component/i18n). La lista completa de códigos de idioma soportados por NocoBase está en [Lista de idiomas](../../languages).

## Logger (ctx.logger)

`ctx.logger` produce logs estructurados y está basado en [pino](https://github.com/pinojs/pino).

### En el Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin cargado', { plugin: 'my-plugin' });
    this.context.logger.error('Error al inicializar', { error });
  }
}
```

### En componentes

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Página cargada', { page: 'UserList' });
    ctx.logger.debug('Estado actual del usuario', { user });
  };

  // ...
}
```

Niveles de log de mayor a menor: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Solo se emiten los logs cuyo nivel sea mayor o igual al configurado.

## Rutas (ctx.router / ctx.route / ctx.location)

Las capacidades de rutas se dividen en tres bloques: registro (solo en el Plugin), navegación e información (solo en componentes).

### Registro de rutas (this.router / this.pluginSettingsManager)

Dentro del `load()` del Plugin, registre rutas de páginas con `this.router.add()` y páginas de configuración con `this.pluginSettingsManager`:

```ts
async load() {
  // Registrar una ruta de página normal
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Registrar una página de configuración (aparecerá en el menú "Configuración del plugin")
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Iconos de Ant Design, ver https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Para más detalles, consulte [Router](../router). Para un ejemplo completo de página de configuración, consulte [Crear una página de configuración del plugin](../examples/settings-page).

:::warning Atención

`this.router` es el RouterManager y se usa para **registrar rutas**. `this.pluginSettingsManager` es el PluginSettingsManager y se usa para **registrar páginas de configuración**. Ninguno de los dos es lo mismo que `ctx.router` (React Router, que sirve para **navegar entre páginas**) en los componentes.

:::

### Navegación (ctx.router)

En los componentes, use `ctx.router.navigate()` para navegar:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Información de la ruta (ctx.route)

En los componentes, obtenga la información de la ruta actual con `ctx.route`:

```tsx
const ctx = useFlowContext();

// Parámetros dinámicos (por ejemplo, ruta definida como /users/:id)
const { id } = ctx.route.params;

// Nombre de la ruta
const { name } = ctx.route;
```

Tipo completo de `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // Identificador único de la ruta
  path?: string;         // Plantilla de la ruta
  pathname?: string;     // Ruta completa
  params?: Record<string, any>; // Parámetros de la ruta
}
```

### URL actual (ctx.location)

`ctx.location` ofrece la información detallada de la URL actual, similar al `window.location` del navegador:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

Aunque `ctx.route` y `ctx.location` son accesibles en el Plugin a través de `this.context`, durante la carga del plugin la URL aún no es determinista y los valores carecen de sentido. Recomendamos usarlos en los componentes.

## Gestión de vistas (ctx.viewer / ctx.view)

`ctx.viewer` ofrece una API imperativa para abrir diálogos, drawers y otras vistas. Funciona tanto en el Plugin como en los componentes.

### En el Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Por ejemplo, abrir un diálogo en una lógica de inicialización
    this.context.viewer.dialog({
      title: 'Bienvenido',
      content: () => <div>Plugin inicializado</div>,
    });
  }
}
```

### En componentes

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Abrir un diálogo
    ctx.viewer.dialog({
      title: 'Editar usuario',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Abrir un drawer
    ctx.viewer.drawer({
      title: 'Detalle',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Editar</Button>
      <Button onClick={openDrawer}>Ver detalle</Button>
    </div>
  );
}
```

### Método genérico

```tsx
// Especificar el tipo de vista con type
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Título',
  content: () => <SomeComponent />,
});
```

### Operar dentro de la vista (ctx.view)

Dentro del componente del diálogo o drawer puede manipular la vista actual mediante `ctx.view` (por ejemplo, cerrarla):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Contenido del diálogo</p>
      <Button onClick={() => ctx.view.close()}>Cerrar</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` es la instancia de FlowEngine y solo está disponible en el Plugin. Suele utilizarse para registrar FlowModel:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Registrar FlowModel (forma recomendada con carga bajo demanda)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel es el núcleo del sistema de configuración visual de NocoBase. Si su componente debe aparecer en los menús "Añadir bloque / campo / acción", debe envolverlo con un FlowModel. Para más detalles, consulte [FlowEngine](../flow-engine/index.md).

## Más capacidades

Las siguientes capacidades pueden resultar útiles en escenarios más avanzados:

| Propiedad               | Descripción                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `ctx.model`             | Instancia actual de FlowModel (disponible dentro del contexto de ejecución de un Flow) |
| `ctx.ref`               | Referencia del componente, usar junto con `ctx.onRefReady`   |
| `ctx.exit()`            | Salir de la ejecución del Flow actual                        |
| `ctx.defineProperty()`  | Añadir dinámicamente una propiedad personalizada al contexto |
| `ctx.defineMethod()`    | Añadir dinámicamente un método personalizado al contexto    |
| `ctx.useResource()`     | Obtener la API de operaciones sobre un recurso de datos      |
| `ctx.dataSourceManager` | Gestor de fuentes de datos                                   |

Para el uso detallado, consulte la [Documentación completa de FlowEngine](../../../flow-engine/index.md).

## Enlaces relacionados

- [Visión general del Context](../ctx/index.md): semejanzas y diferencias entre los dos puntos de acceso al contexto.
- [Plugin](../plugin): atajos del Plugin.
- [Desarrollo de Component](../component/index.md): uso de `useFlowContext` en los componentes.
- [Router](../router): registro y navegación de rutas.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción, `tExpr`, `useT`.
- [Lista de idiomas](../../languages): códigos de idioma soportados por NocoBase.
- [Crear una página de configuración del plugin](../examples/settings-page): ejemplo completo de uso de `ctx.api`.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
