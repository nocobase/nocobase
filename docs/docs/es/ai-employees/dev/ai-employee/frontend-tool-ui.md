---
title: "Añadir interacción frontend a una Tool"
description: "Presenta card, modal, decisions.edit y frontend execution para Tools de empleados de IA de NocoBase, y añade una tarjeta de selección a Dev Helper."
keywords: "NocoBase,tarjeta frontend de Tool,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,frontend Tool"
---

# Añadir interacción frontend a una Tool

Algunas Tools solo necesitan ejecutarse en el servidor y no requieren una interfaz personalizada. Otras necesitan que el usuario confirme, seleccione o edite parámetros; en esos casos puedes registrar una tarjeta, un modal o lógica de ejecución en el navegador para la Tool del mismo nombre.

:::tip Distingue estos dos conceptos

Una **tarjeta frontend** solo se ocupa de mostrar el ToolCall y gestionar la interacción entre la persona y la IA. No implica que la lógica de negocio de la Tool se ejecute necesariamente en el navegador.

Si solo muestras opciones como hace `suggestions` y continúas con el método `invoke()` del servidor después de que el usuario elija, conserva el valor predeterminado `execution: 'backend'`. Configura `execution: 'frontend'` e implementa el método `invoke` frontend únicamente cuando la lógica real de la Tool necesite acceder a la página actual del navegador, a un FlowModel o al estado del editor.

:::

## Define primero los parámetros y la lógica de ejecución en el servidor

La Tool integrada `suggestions` se encuentra en:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Su schema contiene tanto las opciones disponibles como la selección final del usuario:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Según la descripción de la Tool, en la primera llamada el modelo solo debe generar `options`. Como esta Tool no establece `defaultPermission: 'ALLOW'`, el permiso predeterminado es `ASK` y el ToolCall se pausa a la espera de una acción del usuario.

Después de que el usuario seleccione una opción, el frontend utiliza `decisions.edit()` para combinar `option` con los parámetros originales y reanudar el ToolCall. Finalmente, el método `invoke()` del servidor devuelve el contenido seleccionado:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

La implementación integrada también guarda el resultado de la selección en `aiMessages.toolCalls`, para que los mensajes históricos sigan mostrando qué opción eligió el usuario al volver a renderizarse.

## Crear el componente de la tarjeta

La tarjeta frontend recibe `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Atención

Este componente muestra el uso general de `decisions.edit()` y gestiona tanto los clics repetidos como los parámetros en forma de cadena JSON. Para usarlo en producción, también debes gestionar las conversaciones de solo lectura, el mensaje activo actual y el estado de las selecciones históricas según la interfaz de chat donde se encuentre. Consulta la implementación completa en `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` proporciona tres operaciones:

| Método | Función |
| --- | --- |
| `approve()` | Continuar la ejecución con los parámetros originales |
| `edit(args)` | Modificar los parámetros y continuar la ejecución |
| `reject(message?)` | Rechazar la ejecución y devolver el motivo al flujo de la conversación |

`SuggestionsOptionsCard.tsx` también gestiona estos detalles:

- Admite `options` tanto en forma de array como de cadena JSON
- Muestra el estado loading mientras se sigue generando el ToolCall
- Solo permite seleccionar opciones en ToolCalls con estado `interrupted`
- Deshabilita inmediatamente los botones después de hacer clic para evitar envíos duplicados
- Conserva y resalta la opción ya seleccionada en los mensajes históricos
- Solo permite iniciar operaciones desde la conversación editable actual

## Registrar la tarjeta en el plugin cliente

El nombre registrado en el frontend debe coincidir exactamente con el nombre de la Tool en el servidor:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Si el archivo del servidor es `src/ai/tools/developerChoice.ts`, registra aquí `developerChoice`.

La Tool integrada `suggestions` se registra de la misma forma:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Después, `PluginAIClientV2.load()` llama a `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` para combinar la tarjeta con la definición de la Tool del mismo nombre devuelta por el servidor.

## Elegir entre tarjeta, modal o ejecución frontend

A continuación solo se enumeran las opciones más habituales de `ToolsOptions` en el cliente. Consulta el tipo completo en `packages/core/client-v2/src/ai/tools-manager/types.ts`.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Usar una tarjeta

Utiliza primero `card` de forma predeterminada. Las tarjetas son adecuadas para mostrar el estado de ejecución, botones de confirmación y un número reducido de opciones en la posición del ToolCall.

### Usar un modal

Añade un `modal` cuando haya mucho contenido o necesites una vista previa grande o una edición compleja de parámetros.

### Ejecutar la Tool en el navegador

Si la Tool del servidor establece `execution: 'frontend'`, el cliente también debe proporcionar `invoke`. Este tipo de Tool es adecuado para leer el contexto de la página actual, el contenido del editor o el estado de FlowEngine, pero no para realizar escrituras de datos que necesiten la protección de permisos del servidor.

## Ejemplo completo: añadir una tarjeta de selección a un empleado de IA integrado

Después de completar [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md), puedes convertir la pregunta de seguimiento de `Dev Helper` en opciones en las que se pueda hacer clic. Para ello, define otra Tool llamada `developerChoice` y registra una tarjeta frontend. Coloca el archivo del servidor en:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Esta Tool declara las opciones y recibe la selección del usuario:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```

Como `developerChoice.ts` está dentro del directorio `tools/` de la Skill `welcome-developer`, se vincula automáticamente con la Skill actual. Sin embargo, estar vinculada solo significa que el modelo puede utilizar esta Tool, no que vaya a llamarla necesariamente.

También debes modificar el flujo de trabajo de `SKILLS.md` y sustituir los pasos 5 y 6 originales por:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Reutiliza para la tarjeta frontend el componente `DeveloperChoiceCard` definido antes y guárdalo en:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Por último, regístralo en `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Después de registrar la tarjeta, vuelve a compilar el cliente. Cuando la conversación llegue a `developerChoice`, el ToolCall se pausará y mostrará las opciones en las que se puede hacer clic.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## Enlaces relacionados

- [Definir una Tool del servidor](./define-tool.md) — Definir la Tool del servidor correspondiente a la tarjeta frontend
- [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md) — Completar primero el ejemplo básico de Dev Helper
- [Internacionalización de plugins para empleados de IA](./internationalization.md) — Traducir los textos de la interfaz de administración de Tools y Skills
- [Plugin cliente](../../../plugin-development/client/plugin.md) — Conocer el punto de entrada del plugin cliente y `load()`
