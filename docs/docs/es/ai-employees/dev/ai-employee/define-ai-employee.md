---
title: "Definir un empleado de IA integrado"
description: "Explica cómo crear empleados de IA integrados en plugins de NocoBase mediante defineAIEmployee y los directorios prompt.md, skills y tools."
keywords: "NocoBase,empleado de IA integrado,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Definir un empleado de IA integrado

Los empleados de IA integrados se registran junto con el plugin. La primera vez que se carga el plugin, NocoBase crea el registro del empleado correspondiente y lo marca como integrado. En cargas posteriores, actualiza a partir del código el perfil predeterminado, el prompt, las habilidades y las herramientas del empleado.

## Formato de archivo único y formato de directorio

Si el perfil es sencillo y no necesita un prompt independiente ni recursos exclusivos, puedes usar un único archivo:

```text
src/ai/ai-employees/lina.ts
```

Si necesitas un archivo `prompt.md`, Skills exclusivas o Tools exclusivas, utiliza un directorio:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

El formato de directorio es más adecuado para el mantenimiento a largo plazo.

## Usar `defineAIEmployee()`

`index.ts` utiliza la función `defineAIEmployee()` proporcionada por `@nocobase/ai`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Los campos principales son:

| Campo | Función |
| --- | --- |
| `username` | Identificador único del empleado de IA; es obligatorio y debe mantenerse estable a largo plazo |
| `category` | Categoría del empleado, como `developer` o `business` |
| `description` | Descripción interna e información para búsquedas |
| `avatar` | Identificador del avatar |
| `nickname` | Nombre mostrado a los usuarios |
| `position` | Puesto |
| `bio` | Presentación breve |
| `greeting` | Saludo para conversaciones nuevas |
| `systemPrompt` | Prompt del sistema predeterminado |
| `skills` | Nombres de Skills vinculadas explícitamente |
| `tools` | Configuración de Tools vinculadas explícitamente |
| `chatSettings` | Ajustes del chat, como habilitar Skills o Tools y el modo del prompt del sistema |
| `sort` | Orden de los empleados integrados |

Actualmente, `tools` es un array de objetos:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` solo sobrescribe el permiso de llamada de este empleado de IA para una Tool `CUSTOM`. Para las Tools `GENERAL` y `SPECIFIED`, el runtime sigue utilizando el valor `defaultPermission` de la propia Tool. Si una Tool `CUSTOM` no tiene una configuración específica para el empleado, también recurre al valor `defaultPermission` de la Tool.

Las Tools detectadas automáticamente en el directorio se normalizan como `{ name: 'toolName' }`.

## Colocar prompts largos en `prompt.md`

Si el empleado de IA utiliza el formato de directorio, puedes colocar el prompt del sistema en un archivo `prompt.md` del mismo nivel:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

Cuando existe `prompt.md`, su contenido sobrescribe el valor `systemPrompt` de `index.ts`. Guardar los prompts largos en archivos Markdown facilita su revisión y evita problemas de escape en las cadenas de plantilla de TypeScript.

## Ejemplo de empleado de IA integrado: Nathan

El perfil del empleado en `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` es muy breve:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Todas las capacidades de Nathan proceden de los demás recursos del mismo directorio:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

El proceso de carga completa automáticamente tres niveles de vinculación:

1. Los archivos de `tools/` se registran como Tools
2. Las Tools se vinculan automáticamente con la Skill `frontend-developer`
3. La Skill se vincula automáticamente con Nathan

Por tanto, `index.ts` no necesita volver a enumerar todas las `skills` y `tools`.

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Conocer la relación entre los empleados de IA integrados, las Tools y las Skills
- [Definir una Skill](./define-skill.md) — Crear una Skill exclusiva para un empleado
- [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md) — Consultar el directorio completo del empleado y su proceso de registro
- [Internacionalización de plugins para empleados de IA](./internationalization.md) — Conocer las diferencias de localización entre el perfil del empleado y los textos de Tools y Skills
