---
title: "Problemas frecuentes al desarrollar plugins para empleados de IA"
description: "Soluciona problemas de registro o ejecución de Tools, Skills, empleados integrados y tarjetas frontend de Tools para empleados de IA de NocoBase."
keywords: "NocoBase,problemas frecuentes de empleados de IA,Tool no registrada,Skill no cargada,tarjeta frontend"
---

# Problemas frecuentes al desarrollar plugins para empleados de IA

## La Tool no se registra

Comprueba lo siguiente en este orden:

- El archivo está dentro de `src/ai/**/tools/`, en el ámbito de compilación del plugin
- Se utiliza un archivo `.ts` o `.js`
- Se utiliza `export default defineTools(...)`
- El archivo de la Tool no tiene por error la extensión `.d.ts`
- No hay otra Tool con el mismo nombre que provoque que se ignore la registrada después
- El plugin se ha vuelto a compilar y cargar

## La Skill no aparece

Comprueba primero el nombre del archivo. Actualmente debe ser:

```text
SKILLS.md
```

Además, confirma que el frontmatter contenga valores estables para `name` y `description`, y que el archivo se encuentre en `src/ai/**/skills/<skill-name>/SKILLS.md`.

## La Skill se carga, pero no puede llamar a la Tool

Comprueba lo siguiente:

- La lista `tools` de la Skill incluye el nombre de la Tool
- La Tool está dentro del directorio `tools/` de la Skill actual
- El nombre del archivo de la Tool, `definition.name` y la referencia de la Skill coinciden
- El valor de `scope` es adecuado para el método de vinculación actual
- La Tool no dejó de registrarse por tener un nombre duplicado

Vincular una Tool solo significa que el modelo puede utilizarla. Si la Tool ya aparece en la Skill, pero el modelo sigue sin llamarla, indica claramente en el flujo de trabajo de `SKILLS.md` cuándo debe llamarse, qué parámetros necesita y que debe esperarse el resultado.

## La tarjeta frontend no aparece

El nombre registrado en el frontend debe coincidir exactamente con el nombre final de la Tool en el servidor:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Comprueba también lo siguiente:

- El plugin personalizado utiliza el runtime `src/client-v2/`
- La tarjeta se registra en el método `load()` del plugin cliente
- El ToolCall ha entrado en un estado compatible con la tarjeta
- La tarjeta no está deshabilitada debido a la comprobación de `invokeStatus`
- El plugin cliente se ha vuelto a compilar y cargar

## La Tool no continúa después de hacer clic en la tarjeta

Confirma que se haya llamado a `approve()`, `edit()` o `reject()`. Si necesitas guardar la selección del usuario en los parámetros, utiliza:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Confirma también que el schema del servidor permita este campo y que `invoke()` lo lea.

## Los cambios en `definition.name` no se aplican

El nombre de una Tool cargada automáticamente viene determinado por el nombre del archivo o del directorio. Por ejemplo:

```text
src/ai/tools/developerChoice.ts
```

El nombre final será `developerChoice`. Si quieres cambiarlo, debes renombrar también el archivo, las referencias de las Skills, la configuración del empleado de IA y el nombre registrado en el frontend.

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Volver a la descripción general de la guía de desarrollo
- [Definir una Tool del servidor](./define-tool.md) — Comprobar el nombre y el método de registro de la Tool
- [Definir una Skill](./define-skill.md) — Comprobar la vinculación entre la Skill y la Tool
- [Añadir interacción frontend a una Tool](./frontend-tool-ui.md) — Comprobar el ToolCall y el registro frontend
