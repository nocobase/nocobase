---
title: Puntos de extensión del plugin RunJS (documentación de ctx / snippets / mapeo de escenas)
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/flow-engine/runjs-extension-points).
:::

# Puntos de extensión del plugin RunJS (documentación de ctx / snippets / mapeo de escenas)

Cuando un plugin añade o extiende las capacidades de RunJS, se recomienda registrar el "mapeo de contexto / documentación de `ctx` / código de ejemplo" a través de los **puntos de extensión oficiales**. Esto garantiza que:

- El CodeEditor pueda ofrecer autocompletado para `ctx.xxx.yyy`.
- La IA de codificación pueda obtener referencias estructuradas de la API de `ctx` y ejemplos.

Este capítulo presenta dos puntos de extensión:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Se utiliza para registrar "contribuciones" (contributions) de RunJS. Sus usos típicos incluyen:

- Añadir o sobrescribir mapeos en `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, incluyendo `scenes`).
- Extender `RunJSDocMeta` (descripciones/ejemplos/plantillas de completado para la API de `ctx`) para `FlowRunJSContext` o un RunJSContext personalizado.

### Descripción del comportamiento

- Las contribuciones se ejecutan de forma unificada durante la fase `setupRunJSContexts()`.
- Si `setupRunJSContexts()` ya se ha completado, **las registros tardíos se ejecutarán inmediatamente** (sin necesidad de reiniciar el setup).
- Cada contribución se ejecutará **como máximo una vez** para cada `RunJSVersion`.

### Ejemplo: Añadir un contexto de modelo donde se puede escribir JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Documentación/autocompletado de ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'Contexto RunJS de MyPlugin',
    properties: {
      myPlugin: {
        description: 'Espacio de nombres de mi plugin',
        detail: 'object',
        properties: {
          hello: {
            description: 'Saludar',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Mapeo de modelo -> contexto (la escena afecta al autocompletado del editor y al filtrado de snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Se utiliza para registrar fragmentos de código de ejemplo (snippets) para RunJS, que sirven para:

- Autocompletado de snippets en el CodeEditor.
- Material de referencia/ejemplo para la IA de codificación (filtrable por escena/versión/idioma).

### Recomendación de nomenclatura para `ref`

Se sugiere utilizar: `plugin/<nombreDelPlugin>/<tema>`, por ejemplo:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Evite conflictos con los espacios de nombres `global/*` o `scene/*` del núcleo (core).

### Estrategia de conflictos

- Por defecto, no se sobrescriben los `ref` existentes (devuelve `false`, pero no lanza un error).
- Si necesita sobrescribir, pase explícitamente `{ override: true }`.

### Ejemplo: Registrar un snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hola (Mi Plugin)',
    description: 'Ejemplo mínimo para mi plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Snippet de mi plugin
ctx.message.success('Hola desde el plugin');
`,
  },
}));
```

## 3. Mejores prácticas

- **Mantenimiento por capas de documentación + snippets**:
  - `RunJSDocMeta`: Descripciones/plantillas de completado (cortas, estructuradas).
  - Snippets: Ejemplos largos (reutilizables, filtrables por escena/versión).
- **Evitar prompts excesivamente largos**: Los ejemplos no deben ser demasiados; priorice "plantillas mínimas ejecutables".
- **Prioridad de escena**: Si su código JS se ejecuta principalmente en escenarios como formularios o tablas, asegúrese de completar correctamente el campo `scenes` para mejorar la relevancia del autocompletado y los ejemplos.

## 4. Ocultar autocompletado basado en el ctx real: `hidden(ctx)`

Ciertas API de `ctx` dependen fuertemente del escenario (por ejemplo, `ctx.popup` solo está disponible cuando hay una ventana emergente o un cajón abierto). Cuando desee ocultar estas API no disponibles durante el autocompletado, puede definir `hidden(ctx)` para la entrada correspondiente en `RunJSDocMeta`:

- Si devuelve `true`: Oculta el nodo actual y su subárbol.
- Si devuelve `string[]`: Oculta subrutas específicas bajo el nodo actual (permite devolver varias rutas; las rutas son relativas; oculta el subárbol por coincidencia de prefijo).

`hidden(ctx)` admite `async`: usted puede usar `await ctx.getVar('ctx.xxx')` para decidir (a discreción del desarrollador). Se recomienda que sea rápido y sin efectos secundarios (no realice peticiones de red).

Ejemplo: Mostrar el autocompletado de `ctx.popup.*` solo cuando exista `popup.uid`.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexto de ventana emergente (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID de la ventana emergente',
      },
    },
  },
});
```

Ejemplo: La ventana emergente está disponible pero se ocultan algunas subrutas (solo rutas relativas; por ejemplo, ocultar `record` y `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexto de ventana emergente (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID de la ventana emergente',
        record: 'Registro de la ventana emergente',
        parent: {
          properties: {
            record: 'Registro padre',
          },
        },
      },
    },
  },
});
```

Nota: El CodeEditor siempre habilita el filtrado de autocompletado basado en el `ctx` real (fail-open, no lanza errores).

## 5. `info/meta` en tiempo de ejecución y API de información de contexto (para autocompletado y LLM)

Además de mantener la documentación de `ctx` de forma estática mediante `FlowRunJSContext.define()`, usted también puede inyectar **info/meta** en tiempo de ejecución a través de `FlowContext.defineProperty/defineMethod`, y exportar información de contexto **serializable** para el CodeEditor o modelos de lenguaje (LLM) mediante las siguientes API:

- `await ctx.getApiInfos(options?)`: Información estática de la API.
- `await ctx.getVarInfos(options?)`: Información de la estructura de variables (proviene de `meta`, admite expansión por ruta/profundidad máxima).
- `await ctx.getEnvInfos()`: Instantánea del entorno en tiempo de ejecución.

### 5.1 `defineMethod(name, fn, info?)`

`info` admite (todos opcionales):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (estilo JSDoc)

> Nota: `getApiInfos()` devuelve documentación estática de la API y no incluirá campos como `deprecated`, `disabled` o `disabledReason`.

Ejemplo: Proporcionar un enlace de documentación para `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Refrescar los datos de los bloques de destino',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Documentación' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Se utiliza para la interfaz de usuario del selector de variables (`getPropertyMetaTree` / `FlowContextSelector`), determinando si se muestra, la estructura del árbol, si está deshabilitado, etc. (admite funciones/async).
  - Campos comunes: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Se utiliza para la documentación estática de la API (`getApiInfos`) y descripciones para el LLM; no afecta a la interfaz del selector de variables (admite funciones/async).
  - Campos comunes: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Cuando solo se proporciona `meta` (y no `info`):

- `getApiInfos()` no devolverá esa clave (ya que la documentación estática no se infiere de `meta`).
- `getVarInfos()` construirá la estructura de variables basada en `meta` (utilizado para selectores de variables o árboles de variables dinámicas).

### 5.3 API de información de contexto

Se utiliza para exportar la "información de capacidades de contexto disponibles".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Puede usarse directamente en await ctx.getVar(getVar), se recomienda empezar con "ctx."
  value?: any; // Valor estático resuelto (serializable, solo se devuelve si se puede inferir)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Documentación estática (nivel superior)
type FlowContextVarInfos = Record<string, any>; // Estructura de variables (expandible por ruta/profundidad)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Parámetros comunes:

- `getApiInfos({ version })`: Versión de la documentación de RunJS (por defecto `v1`).
- `getVarInfos({ path, maxDepth })`: Recorte y nivel máximo de expansión (por defecto 3).

Nota: Los resultados devueltos por las API anteriores no contienen funciones, por lo que son adecuados para ser serializados y enviados directamente a un LLM.

### 5.4 `await ctx.getVar(path)`

Cuando usted tiene una "cadena de ruta de variable" (por ejemplo, proveniente de una configuración o entrada del usuario) y desea obtener directamente el valor en tiempo de ejecución de esa variable, puede usar `getVar`:

- Ejemplo: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` es una ruta de expresión que comienza con `ctx.` (por ejemplo, `ctx.record.id` / `ctx.record.roles[0].id`).

Adicionalmente: Los métodos o propiedades que comienzan con un guion bajo `_` se consideran miembros privados y no aparecerán en los resultados de `getApiInfos()` o `getVarInfos()`.