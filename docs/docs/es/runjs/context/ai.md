---
title: "ctx.ai"
description: "Use ctx.ai en RunJS para activar tareas de empleados de IA en la conversación global o en un AI Chat Box específico, pasando el contenido directamente o reutilizando tareas configuradas en una acción de empleado de IA."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,onResponseLoadingChange,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

Use `ctx.ai` en RunJS para activar **tareas de empleados de IA**. Es útil en JSBlock, JSAction y otras interacciones donde un botón, formulario o flujo de negocio necesita enviar trabajo a un empleado de IA específico.

`ctx.ai` carga archivos adjuntos para tareas de IA y activa tareas. Las cargas de archivos se pueden esperar, pero la activación de una tarea no devuelve su resultado de ejecución. Después de la llamada, la tarea entra en el flujo de conversación del empleado de IA.

:::warning Nota

`ctx.ai` lo proporciona el plugin de IA. Si el plugin no está habilitado, o el entorno RunJS actual no ha cargado la capacidad de cliente correspondiente, `ctx.ai` puede no existir. Puede comprobar `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask` o `ctx.ai?.triggerModelTask` antes de llamarlo.

:::

## Métodos

### ctx.ai.uploadFile()

Carga un archivo y devuelve un objeto adjunto que se puede pasar directamente a una tarea de empleado de IA.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `file` | `File` | Objeto de archivo del navegador que se va a cargar. |
| `options.onProgress` | `(percent: number) => void` | Callback del progreso de carga. `percent` va de `0` a `100`. |
| `options.signal` | `AbortSignal` | Señal para cancelar la carga. |

La carga usa el almacenamiento de archivos configurado por el plugin de IA y crea un registro en `aiFiles`. El objeto devuelto incluye campos como `id`, `filename`, `url` y `source`:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment se puede colocar directamente en message.attachments
```

El Promise se rechaza cuando falla la carga. Quitar un archivo adjunto de la lista local no elimina el registro ya creado en `aiFiles`, igual que en la ventana de chat de IA predeterminada.

### ctx.ai.triggerTask()

Activa directamente una tarea de empleado de IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Empleado de IA. Si se pasa una cadena, se compara exactamente con `AIEmployee.username`, y debe ser accesible para el usuario actual. |
| `tasks` | `Task[]` | Lista de tareas que se van a activar. |
| `chatBoxUid` | `string` | uid de FlowModel del bloque AI Chat Box que debe recibir la tarea. |
| `open` | `boolean` | Si se abre el panel de conversación del empleado de IA. |
| `auto` | `boolean` | Si se usa la semántica de activación automática de una acción de empleado de IA. |
| `onResponseLoadingChange` | `(loading: boolean) => void` | Callback del estado de carga de la respuesta. Solo se ejecuta cuando esta tarea se envía automáticamente. |

Campos comunes de `Task`:

| Campo | Tipo | Descripción |
|------|------|------|
| `title` | `string` | Título de la tarea. |
| `message.system` | `string` | Mensaje de sistema para limitar el rol y los requisitos de salida del empleado de IA. |
| `message.user` | `string` | Mensaje de usuario, es decir, la instrucción principal de esta tarea. |
| `message.attachments` | `Attachment[]` | Archivos adjuntos usados por la tarea, normalmente devueltos por `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Contexto de bloques de página usado por la tarea. |
| `autoSend` | `boolean` | Si el mensaje de la tarea se envía automáticamente. |
| `webSearch` | `boolean` | Si esta tarea puede usar Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modelo usado por esta tarea. |
| `skillSettings` | `SkillSettings` | Configuración de skills / tools usada por esta tarea. |

### Seguir el estado de carga de la respuesta

Pase `onResponseLoadingChange` en las opciones de nivel superior para seguir el estado de carga de la respuesta del modelo. El callback recibe `true` cuando NocoBase empieza a esperar la respuesta y `false` cuando termina, se cancela o falla. Si el componente React ya declaró `setResponseLoading` mediante `useState`, puede escribir:

```tsx
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
      autoSend: true,
    },
  ],
  onResponseLoadingChange(loading) {
    setResponseLoading(loading);
  },
});
```

`onResponseLoadingChange` solo sigue la respuesta iniciada directamente por esta llamada a `triggerTask()`. Con `autoSend: false`, la tarea queda en el borrador del chat y el callback no se ejecuta. Si el usuario envía el borrador más tarde, ese envío manual no reutiliza el callback.

En un componente React de un bloque JS, esta actualización vuelve a renderizar el componente mientras permanezca montado.

### Seleccionar un AI Chat Box

Defina `chatBoxUid` en las opciones de nivel superior de `triggerTask()` para activar la tarea en un bloque AI Chat Box montado, en lugar de abrir el diálogo global del empleado de IA.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

El uid debe pertenecer al bloque AI Chat Box exterior que esté montado en la página actual. No coloque este valor de enrutamiento dentro de `tasks`. Si no se encuentra el bloque de destino, NocoBase muestra un error y no vuelve al diálogo global. Si se omite `chatBoxUid`, la tarea usa el diálogo global del empleado de IA.

### Cargar y enviar archivos adjuntos en JSBlock

El siguiente ejemplo renderiza la carga de archivos, las instrucciones de la tarea y un botón de envío en JSBlock. Los archivos cargados se pasan al empleado de IA mediante `message.attachments`:

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

Con `autoSend: false`, los archivos adjuntos y las instrucciones se colocan en el borrador del chat de IA y no se envían inmediatamente.

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

Las opciones públicas de `triggerModelTask()` no aceptan `chatBoxUid`. Para seleccionar un AI Chat Box, configure `chatBoxUid` en la tarea predefinida de la acción de empleado de IA. `triggerModelTask()` seguirá reutilizando ese valor predefinido.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | uid de FlowModel de la acción de empleado de IA. |
| `taskIndex` | `number` | Índice de la tarea, empezando desde `0`. |
| `options.open` | `boolean` | Si se abre el panel de conversación del empleado de IA. |
| `options.auto` | `boolean` | Si se usa la semántica de activación automática de una acción de empleado de IA. |
| `options.attachments` | `Attachment[]` | Archivos adjuntos que se agregan dinámicamente a la tarea configurada. |
| `options.onResponseLoadingChange` | `(loading: boolean) => void` | Callback del estado de carga de la respuesta. Solo se ejecuta cuando la tarea configurada se envía automáticamente. |

`options.onResponseLoadingChange` se comporta igual que en `triggerTask()`. Su ejecución depende del valor `autoSend` de la tarea configurada. No se ejecuta cuando la tarea usa `autoSend: false`.

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Si el modelo de destino no existe, no tiene empleado de IA configurado, o el índice indicado no tiene tarea, no se activa ninguna tarea y se imprime una advertencia en la consola.

## Notas

- `triggerTask()` y `triggerModelTask()` son fire-and-forget. No devuelven el resultado de ejecución de la tarea.
- `uploadFile()` devuelve un Promise. Espere a que termine la carga antes de activar una tarea que use el archivo adjunto.
- Las cadenas de `aiEmployee` solo coinciden exactamente con `AIEmployee.username`.
- `triggerModelTask()` usa `taskIndex` empezando desde `0`.
- `message.workContext` actualmente solo describe contexto de bloques de página.
- El valor de nivel superior `triggerTask().chatBoxUid` debe hacer referencia a un bloque AI Chat Box montado en la página actual.
- `triggerModelTask()` sigue usando el `chatBoxUid` configurado en su tarea predefinida.
- Los archivos adjuntos dinámicos de `triggerModelTask()` se agregan a los `message.attachments` existentes de la tarea predefinida sin cambiar la configuración guardada.
- `onResponseLoadingChange` solo sigue una respuesta enviada automáticamente por la llamada actual. No sigue un mensaje que el usuario envíe manualmente después.

## Relacionado

- [ctx.message](./message.md): Muestra avisos ligeros antes y después de activar tareas.
- [ctx.render](./render.md): Renderiza botones o formularios en JSBlock.
- [ctx.model](./model.md): Obtiene información del FlowModel actual.
