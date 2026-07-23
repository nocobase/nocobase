---
title: "ctx.ai"
description: "Use ctx.ai en RunJS para activar tareas de empleados de IA, pasando el contenido de la tarea directamente o reutilizando tareas configuradas en una acción de empleado de IA."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

Use `ctx.ai` en RunJS para activar **tareas de empleados de IA**. Es útil en JSBlock, JSAction y otras interacciones donde un botón, formulario o flujo de negocio necesita enviar trabajo a un empleado de IA específico.

`ctx.ai` solo activa tareas. No devuelve el resultado de ejecución de la tarea. Después de la llamada, la tarea entra en el flujo de conversación del empleado de IA.

:::warning Nota

`ctx.ai` lo proporciona el plugin de IA. Si el plugin no está habilitado, o el entorno RunJS actual no ha cargado la capacidad de cliente correspondiente, `ctx.ai` puede no existir. Puede comprobar `ctx.ai?.triggerTask` o `ctx.ai?.triggerModelTask` antes de llamarlo.

:::

## Métodos

### ctx.ai.triggerTask()

Activa directamente una tarea de empleado de IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Empleado de IA. Si se pasa una cadena, se compara exactamente con `AIEmployee.username`, y debe ser accesible para el usuario actual. |
| `tasks` | `Task[]` | Lista de tareas que se van a activar. |
| `open` | `boolean` | Si se abre el panel de conversación del empleado de IA. |
| `auto` | `boolean` | Si se usa la semántica de activación automática de una acción de empleado de IA. |

Campos comunes de `Task`:

| Campo | Tipo | Descripción |
|------|------|------|
| `title` | `string` | Título de la tarea. |
| `message.system` | `string` | Mensaje de sistema para limitar el rol y los requisitos de salida del empleado de IA. |
| `message.user` | `string` | Mensaje de usuario, es decir, la instrucción principal de esta tarea. |
| `message.workContext` | `ContextItem[]` | Contexto de bloques de página usado por la tarea. |
| `autoSend` | `boolean` | Si el mensaje de la tarea se envía automáticamente. |
| `webSearch` | `boolean` | Si esta tarea puede usar Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modelo usado por esta tarea. |
| `skillSettings` | `SkillSettings` | Configuración de skills / tools usada por esta tarea. |

### Agregar contexto de bloques de página

`message.workContext` se usa actualmente para pasar bloques de página. Coloque ahí el uid de FlowModel del bloque de destino:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Campo | Descripción |
|------|------|
| `type` | Valor fijo `flow-model`, indicando que es un contexto de bloque de página. |
| `uid` | uid de FlowModel del bloque de página, como una tabla, un detalle o un gráfico. |

Si desea usar el JSBlock actual como contexto, use el uid del modelo actual:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Especificar modelo

`model` especifica el modelo de una sola tarea. Si se omite, se usa la configuración predeterminada del empleado de IA. Pasar `null` significa no especificar un modelo a nivel de tarea.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Configurar skills / tools

`skillSettings` especifica las skills y tools disponibles para una sola tarea. Si se omite, se usa la configuración de capacidades del empleado de IA.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Para deshabilitar explícitamente todas las skills o tools de esta tarea, pase arreglos vacíos y conserve los campos de versión:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Ejemplo:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Si `aiEmployee` es una cadena, NocoBase busca por coincidencia exacta de `username` entre los empleados de IA accesibles para el usuario actual.

### ctx.ai.triggerModelTask()

Lee una tarea desde un modelo de acción de empleado de IA en la página y la activa.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | uid de FlowModel de la acción de empleado de IA. |
| `taskIndex` | `number` | Índice de la tarea, empezando desde `0`. |
| `options.open` | `boolean` | Si se abre el panel de conversación del empleado de IA. |
| `options.auto` | `boolean` | Si se usa la semántica de activación automática de una acción de empleado de IA. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Si el modelo de destino no existe, no tiene empleado de IA configurado, o el índice indicado no tiene tarea, no se activa ninguna tarea y se imprime una advertencia en la consola.

## Notas

- `triggerTask()` y `triggerModelTask()` son fire-and-forget. No devuelven el resultado de ejecución de la tarea.
- Las cadenas de `aiEmployee` solo coinciden exactamente con `AIEmployee.username`.
- `triggerModelTask()` usa `taskIndex` empezando desde `0`.
- `message.workContext` actualmente solo describe contexto de bloques de página.

## Relacionado

- [ctx.message](./message.md): Muestra avisos ligeros antes y después de activar tareas.
- [ctx.render](./render.md): Renderiza botones o formularios en JSBlock.
- [ctx.model](./model.md): Obtiene información del FlowModel actual.
