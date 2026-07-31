---
title: "Desarrollo de plugins para empleados de IA"
description: "Presenta la relación entre Tools, Skills, empleados de IA integrados y la interfaz frontend de Tools en los plugins de NocoBase, junto con las convenciones de directorios y la ruta de aprendizaje."
keywords: "NocoBase,desarrollo de plugins para empleados de IA,Tool,Skill,defineAIEmployee,src/ai"
---

# Desarrollo de plugins para empleados de IA

En NocoBase, los plugins pueden poner sus capacidades de negocio a disposición de los empleados de IA. Los tres puntos de extensión se ocupan de niveles diferentes:

- **Tool (herramienta)** — Ejecuta operaciones concretas, como consultar datos, llamar a una API o modificar registros
- **Skill (habilidad)** — Indica al modelo cuándo debe usar una herramienta y qué pasos debe seguir para completar una tarea
- **Empleado de IA integrado (Built-in AI Employee)** — Combina el perfil del rol, el prompt del sistema, las habilidades y las herramientas en un empleado listo para usar

Por lo general, no necesitas llamar manualmente a las API de registro. Cuando colocas los archivos en los directorios convencionales de `src/ai` del plugin, NocoBase los escanea y registra automáticamente al cargar el plugin. Solo necesitas registrar el componente frontend o la lógica de ejecución correspondiente en `src/client-v2/plugin.tsx` cuando una Tool requiere una tarjeta personalizada, un modal o lógica que se ejecute en el navegador.

Antes de empezar, asegúrate de que la aplicación tenga instalado y habilitado `@nocobase/plugin-ai`. El código del plugin puede usar los tipos y las funciones de definición que proporcionan `@nocobase/ai` y `@nocobase/actions`.

:::tip Lecturas previas

- [Crear tu primer plugin](../../../plugin-development/write-your-first-plugin.md) — Si aún no tienes experiencia desarrollando plugins, empieza por conocer la estructura de directorios, el proceso de compilación y cómo habilitarlos
- [Empleados de IA](../../index.md) — Familiarízate primero con la configuración y el uso básico de los empleados de IA

:::


## Índice rápido

| Quiero… | Consultar |
| --- | --- |
| Permitir que la IA llame a una operación del servidor | [Definir una Tool del servidor](./define-tool.md) |
| Establecer el flujo de llamadas de varias Tools | [Definir una Skill](./define-skill.md) |
| Proporcionar un rol de IA fijo con el plugin | [Definir un empleado de IA integrado](./define-ai-employee.md) |
| Consultar cómo combinar por completo una Tool, una Skill y un empleado | [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md) |
| Añadir a una Tool una interfaz de confirmación, selección o edición | [Añadir interacción frontend a una Tool](./frontend-tool-ui.md) |
| Añadir traducciones para la interfaz de administración de Tools y Skills | [Internacionalización de plugins para empleados de IA](./internationalization.md) |
| Solucionar problemas de registro, vinculación y ejecución | [Problemas frecuentes](./troubleshooting.md) |

## Decide primero qué nivel quieres ampliar

Tool, Skill y empleado de IA integrado no son tres funciones independientes, sino capacidades que se combinan progresivamente de abajo arriba. No todos los plugins necesitan implementar los tres niveles.

```text
Tool: permite que la IA ejecute una acción concreta
  ↓
Skill: permite que la IA complete un tipo de tarea siguiendo un método definido
  ↓
Empleado de IA integrado: combina estas capacidades en un rol fijo y un punto de acceso
```

Puedes decidir por qué nivel empezar según tus necesidades:

- Si solo necesitas que la IA consulte datos, llame a una API o modifique registros, basta con definir una Tool
- Si necesitas establecer el orden de llamada de las herramientas, los pasos de confirmación y el formato de salida, define además una Skill para esas Tools
- Si quieres que el plugin proporcione directamente un rol fijo al habilitarse, crea también un empleado de IA integrado y vincula las Skills y Tools correspondientes

Cuando se utilizan los tres niveles, una tarea se ejecuta en este orden:

1. El usuario asigna una tarea al empleado de IA
2. El empleado de IA determina qué Skill necesita según el prompt del sistema
3. La Skill indica al modelo qué Tools debe llamar y en qué orden
4. La Tool ejecuta la consulta, escritura o solicitud externa y devuelve el resultado
5. El empleado de IA prepara la respuesta final a partir del resultado de la Tool

La tarjeta frontend de una Tool no es un cuarto nivel. Solo añade una interfaz interactiva al ToolCall cuando la Tool necesita que el usuario confirme, seleccione una opción o edite parámetros.

## Coloca los recursos de IA en `src/ai`

NocoBase descubre los recursos de IA de un plugin según convenciones de directorios. Con la estructura estándar de plugins, basta con colocar las Tools, Skills y empleados de IA integrados en `src/ai`; no es necesario registrarlos uno por uno en el método `load()` de `src/server/plugin.ts`.

Un directorio completo puede organizarse así:

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Cada ubicación corresponde a un método de registro diferente:

| Archivo o directorio | Procesamiento de NocoBase |
| --- | --- |
| `src/ai/tools/<name>.ts` | Registra una Tool independiente |
| `src/ai/skills/<name>/SKILLS.md` | Registra una Skill |
| `tools/` dentro del directorio de una Skill | Registra las Tools y las vincula automáticamente con la Skill actual |
| `src/ai/ai-employees/<name>.ts` | Registra un empleado de IA integrado definido en un único archivo |
| `src/ai/ai-employees/<name>/index.ts` | Registra un empleado de IA integrado definido mediante un directorio |
| `prompt.md` dentro del directorio del empleado de IA | Se utiliza como prompt del sistema predeterminado del empleado |
| `skills/` y `tools/` dentro del directorio del empleado de IA | Registra los recursos y los vincula automáticamente con el empleado actual |

Al cargar el plugin, NocoBase completa estas tareas en orden antes de ejecutar el método `load()` del propio plugin:

1. Escanea y registra las Tools
2. Analiza `SKILLS.md` y vincula las Tools del directorio de la Skill con la Skill correspondiente
3. Carga los empleados de IA integrados y combina el `prompt.md`, las Skills y las Tools de sus directorios

`src/client-v2` no forma parte de estos directorios de escaneo automático. Solo debes hacer un registro adicional en `src/client-v2/plugin.tsx` cuando una Tool necesite una tarjeta frontend, un modal o lógica de ejecución en el navegador.

## Referencia rápida de puntos de extensión y directorios

| Punto de extensión | Responsabilidad | Ubicación predeterminada |
| --- | --- | --- |
| Tool | Ejecutar operaciones concretas, como consultas, escrituras o solicitudes externas | `src/ai/**/tools/` |
| Skill | Definir el flujo, el orden de llamada de las Tools y las restricciones de salida | `src/ai/**/skills/<name>/SKILLS.md` |
| Empleado de IA integrado | Definir un rol fijo y combinar el prompt del sistema, las Skills y las Tools | `src/ai/ai-employees/` |
| Tarjeta frontend de Tool | Mostrar el ToolCall y recopilar acciones de confirmación, edición o rechazo | `src/client-v2/` |

Empieza implementando una Tool. Añade una Skill cuando necesites un flujo fijo y crea un empleado de IA integrado cuando necesites una entrada para un rol fijo. Añade una tarjeta frontend solo si la Tool requiere interacción con el navegador.

## Enlaces relacionados

- [Crear tu primer plugin](../../../plugin-development/write-your-first-plugin.md) — Crea y ejecuta un plugin de NocoBase desde cero
- [Descripción general de los empleados de IA](../../index.md) — Conoce el punto de entrada para usar empleados de IA
- [Guía de ingeniería de prompts](../../configuration/prompt-engineering-guide.md) — Escribe prompts del sistema y restricciones de tareas
