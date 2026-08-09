---
title: "Ejemplo completo: crear un empleado de IA integrado"
description: "Define una Tool, una Skill, un prompt del sistema y un empleado de IA integrado en un plugin de NocoBase mediante un ejemplo completo."
keywords: "NocoBase,Dev Helper,ejemplo de empleado de IA,defineTools,defineAIEmployee,SKILLS.md"
---

# Ejemplo completo: crear un empleado de IA integrado

A continuación se muestra un ejemplo completo para crear un empleado de IA integrado que guíe el desarrollo de plugins. El empleado se llama `Dev Helper` y tiene configurados una Tool, una Skill y un prompt del sistema. Cuando el usuario diga «Saluda a Alice», el empleado cargará la Skill `welcome-developer`, llamará a la Tool `greetDeveloper` para confirmar el nombre y generará un saludo en el idioma actual del usuario.

:::tip Lecturas previas

- [Definir una Tool del servidor](./define-tool.md) — Conocer `defineTools()` y la estructura básica de una Tool
- [Definir una Skill](./define-skill.md) — Conocer `SKILLS.md` y la vinculación de Tools
- [Definir un empleado de IA integrado](./define-ai-employee.md) — Conocer `defineAIEmployee()` y el directorio del empleado

:::

## Resultado final

Al terminar, el plugin ofrecerá estas capacidades:

- Crear un empleado de IA integrado llamado `Dev Helper`
- Vincular automáticamente la Skill `welcome-developer` con el empleado
- Confirmar el nombre del desarrollador llamando a la Tool `greetDeveloper` desde la Skill
- Generar un saludo y una pregunta de seguimiento en el idioma actual del usuario

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Estructura final de directorios

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Este ejemplo no necesita código frontend ni registro manual en `src/server/plugin.ts`.

## Paso 1: definir la Tool

Crea `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

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
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Paso 2: definir la Skill

Crea `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Como `greetDeveloper.ts` está dentro del directorio `tools/` de la Skill actual, no necesitas añadir `tools: [greetDeveloper]`.

## Paso 3: definir el perfil del empleado de IA

Crea `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` es el identificador único en la base de datos. No lo cambies de forma arbitraria después de publicar el plugin, porque NocoBase tratará el nuevo valor como otro empleado de IA integrado.

:::warning Atención

Además de mantenerse estable, el valor de `username` no debe coincidir con el de otros plugins ni con empleados de IA existentes. Si ya existe en la base de datos el mismo `username`, al cargar el plugin se actualizará el registro correspondiente en lugar de crear un empleado nuevo y aislado.

Al volver a cargar el plugin, es posible que se vuelvan a escribir en la base de datos los valores de `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, el prompt del sistema predeterminado, las vinculaciones de Skills y Tools, `chatSettings` y `sort`. Para plugins destinados a producción, se recomienda usar un nombre con el prefijo del plugin, como `developer-helper-dev-assistant`.

:::

## Paso 4: definir el prompt del sistema

Crea `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Con esto, la relación entre directorios queda vinculada automáticamente:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Paso 5: habilitar y verificar

Vuelve a compilar o reinicia el servicio de desarrollo y confirma que el plugin que contiene estos archivos esté habilitado. Después, comprueba en la página de administración de empleados de IA que:

- Aparece `Dev Helper`
- El empleado está marcado como empleado integrado
- Las Skills exclusivas del empleado incluyen `welcome-developer`
- Tras cargar la Skill, se puede usar `greetDeveloper`

Introduce en la conversación:

```text
请向 Alice 打个招呼。
```

El flujo esperado es:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Si no quieres que la Tool solicite confirmación al usuario antes de cada llamada, establece `defaultPermission: 'ALLOW'`. Para Tools que eliminan datos, realizan modificaciones masivas o producen efectos secundarios externos, suele ser más adecuado conservar `ASK` como valor predeterminado.

## Resumen

| Archivo | Responsabilidad |
| --- | --- |
| `greetDeveloper.ts` | Validar la entrada y devolver un resultado estructurado de la Tool |
| `SKILLS.md` | Definir el flujo de llamada de la Tool y de la respuesta |
| `prompt.md` | Definir el rol del empleado y las restricciones globales |
| `index.ts` | Definir el perfil del empleado de IA integrado |

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Conocer la relación entre Tools, Skills y empleados de IA integrados
- [Definir una Tool del servidor](./define-tool.md) — Consultar la configuración completa de `defineTools()`
- [Definir una Skill](./define-skill.md) — Consultar los campos y la sintaxis de `SKILLS.md`
- [Definir un empleado de IA integrado](./define-ai-employee.md) — Consultar `defineAIEmployee()` y la vinculación por directorios
- [Internacionalización de plugins para empleados de IA](./internationalization.md) — Añadir traducciones para los textos de la interfaz de administración del ejemplo
