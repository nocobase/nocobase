---
title: "Definir una Tool del servidor"
description: "Presenta defineTools, scope, schema, invoke, permisos y registro por directorio para las Tools del servidor de empleados de IA de NocoBase."
keywords: "NocoBase,Tool de empleado de IA,defineTools,ToolsOptions,Zod,invoke"
---

# Definir una Tool del servidor

En NocoBase, una **Tool (herramienta)** ejecuta operaciones concretas, como consultas, escrituras o solicitudes externas. Las Tools del servidor suelen definirse con `defineTools()` de `@nocobase/ai` y se colocan en el directorio `src/ai/**/tools/` del plugin.

## Estructura mínima de una Tool

Las Tools del servidor se definen con `defineTools()`, proporcionada por `@nocobase/ai`. La siguiente Tool recibe un nombre y devuelve un saludo:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Si la ruta del archivo es `src/ai/tools/greetDeveloper.ts`, el cargador utiliza el nombre de archivo `greetDeveloper` como nombre final de la Tool. Aunque `definition.name` tenga otro valor, el nombre del archivo lo sobrescribe durante el registro.

Por tanto, de forma predeterminada, mantén el mismo nombre para el archivo, `definition.name`, las referencias de las Skills y el registro frontend.

## Opciones de configuración de una Tool

Las opciones principales de `defineTools()` son:

| Opción | Función | Valor predeterminado |
| --- | --- | --- |
| `scope` | Determina el ámbito de disponibilidad de la Tool | Obligatorio |
| `execution` | Indica si la lógica se ejecuta en `backend` o `frontend` | `backend` |
| `defaultPermission` | Permite la llamada directamente o solicita confirmación antes de ejecutarla | `ASK` |
| `silence` | Indica si se oculta el aviso de llamada a la Tool en la conversación | `false` |
| `introduction` | Título y descripción mostrados en la interfaz de administración | Utiliza el nombre de la Tool |
| `definition` | Proporciona al modelo el nombre, la descripción y el schema de parámetros | Obligatorio |
| `invoke` | Lógica de ejecución real de la Tool | Obligatorio |

La elección de `scope` afecta directamente a cómo entra una Tool en el contexto de un empleado de IA:

| `scope` | Forma de uso |
| --- | --- |
| `GENERAL` | Compartida por todos los empleados de IA; suele utilizarse para capacidades básicas generales |
| `SPECIFIED` | Solo pueden utilizarla las Skills o los empleados de IA a los que está vinculada |
| `CUSTOM` | Los administradores pueden añadirla manualmente a la configuración de un empleado de IA y elegir entre «Preguntar» o «Permitir» |

Se recomienda utilizar `SPECIFIED` de forma predeterminada. Usa `GENERAL` solo cuando todos los empleados de IA necesiten esa capacidad; utiliza `CUSTOM` cuando quieras que el administrador pueda seleccionarla para cada empleado.

## `definition` está destinada al modelo

`definition.description` y `definition.schema` influyen en si el modelo selecciona una Tool y en cómo construye sus parámetros. La descripción debe aclarar tres aspectos:

- En qué casos debe llamarse
- Qué representa cada parámetro
- Qué tareas no debe gestionar esta Tool

Se recomienda utilizar Zod para el schema de parámetros:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

El nombre de la Tool también debe mantenerse estable. Las Skills, la configuración de empleados de IA, las tarjetas frontend y los mensajes de chat guardados la buscan por su nombre.

## Qué recibe `invoke()`

El método `invoke()` del servidor recibe tres parámetros:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

A través de `ctx` puedes acceder a la aplicación actual, la base de datos, la información de autenticación y los parámetros de la action. Por ejemplo:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

La Tool debe devolver una estructura que permita determinar si la operación se completó correctamente. Las Tools integradas suelen utilizar esta forma:

```ts
return {
  status: 'success',
  content: result,
};
```

Ante un error de negocio previsto, también debe devolver un estado y un motivo claros, sin obligar al modelo a adivinar si la operación tuvo éxito.

## Usar un directorio para descripciones extensas

Además de un único archivo, una Tool también puede utilizar un directorio:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` exporta de forma predeterminada el resultado de `defineTools()`. Cuando existe `description.md`, todo su contenido sobrescribe `definition.description`, lo que resulta útil para guardar instrucciones de uso extensas de la Tool.

El nombre del directorio `documentSearch` se convierte en el nombre final registrado.

## Ejemplo de Tool integrada: `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` muestra una Tool del servidor completa:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Esta implementación ofrece varias prácticas reutilizables:

- Utiliza `SPECIFIED` para limitar la herramienta a empleados o Skills concretos
- Utiliza Zod para restringir los parámetros generados por el modelo
- Lee la configuración de la conversación de IA actual desde `ctx.action.params.values`
- Agrupa varias consultas independientes en un solo ToolCall y las ejecuta en paralelo mediante `Promise.all()`
- Devuelve resultados estructurados con fuentes claras para que el modelo superior pueda seguir procesándolos

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Elegir el nivel de capacidad que necesitas ampliar
- [Definir una Skill](./define-skill.md) — Organizar mediante una Skill el flujo de llamadas de varias Tools
- [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md) — Consultar un ejemplo ejecutable de Tool
- [Añadir interacción frontend a una Tool](./frontend-tool-ui.md) — Añadir una interfaz de confirmación y selección a un ToolCall
