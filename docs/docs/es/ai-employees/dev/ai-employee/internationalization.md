---
title: "Internacionalización de plugins para empleados de IA"
description: "Presenta los archivos de internacionalización, las plantillas de traducción y las limitaciones actuales de las Tools, Skills y perfiles de empleados integrados de NocoBase."
keywords: "NocoBase,internacionalización de plugins para empleados de IA,Tool introduction,Skill introduction,locale"
---

# Internacionalización de plugins para empleados de IA

Los textos de la interfaz de administración de los plugins para empleados de IA deben mostrarse en el idioma actual de la interfaz. Las Tools y Skills pueden usar los archivos locale del propio plugin mediante `introduction`; los perfiles de empleados se gestionan de otra forma.

## Qué contenido debe internacionalizarse

Por lo general, debes internacionalizar los textos de la interfaz que ven administradores o usuarios:

- `introduction.title` e `introduction.about` de las Tools
- `introduction.title` e `introduction.about` de las Skills
- Textos de tarjetas frontend, modales y botones de acción

`definition.name`, `definition.description`, las descripciones del schema, el cuerpo de la Skill y el prompt del sistema del empleado de IA están destinados principalmente al modelo. No cambies el nombre estable de una Tool ni el contenido del flujo de trabajo solo para traducir la interfaz.

## Traducir los textos de administración de Tools y Skills

El campo `introduction` de una Tool puede usar plantillas de traducción `{{t(...)}}`:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Una Skill utiliza la misma sintaxis en el frontmatter de `SKILLS.md`:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

El valor `ns` debe coincidir con el namespace de internacionalización que utiliza realmente el plugin.

## Añadir archivos de idioma

Los archivos de idioma del plugin se guardan en el directorio `src/locale/`. Todos los idiomas usan las mismas claves y solo cambia el texto correspondiente.

### Añadir textos en inglés

Añade los textos a `src/locale/en-US.json`:

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### Añadir textos en chino

Añade los textos a `src/locale/zh-CN.json`:

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## Limitaciones actuales del perfil del empleado de IA

Los campos `nickname`, `position`, `bio` y `greeting` del perfil del empleado de IA no utilizan el mecanismo de plantillas `{{t(...)}}` anterior. En la implementación actual, el runtime de empleados integrados traduce estas cadenas originales dentro del namespace `@nocobase/plugin-ai`; por tanto, los plugins de terceros no deben suponer que un namespace personalizado se aplicará automáticamente.

Si no añades lógica de localización adicional, se recomienda elegir un idioma predeterminado para el perfil del empleado y guardar los textos de la interfaz de administración de Tools, Skills e interacciones frontend en los archivos locale del propio plugin.

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Volver a la descripción general de la guía de desarrollo
- [Definir una Tool del servidor](./define-tool.md) — Usar plantillas de traducción en la introducción de una Tool
- [Definir una Skill](./define-skill.md) — Usar plantillas de traducción en el frontmatter de una Skill
- [Definir un empleado de IA integrado](./define-ai-employee.md) — Conocer los campos del perfil del empleado
- [Añadir interacción frontend a una Tool](./frontend-tool-ui.md) — Traducir los textos de tarjetas frontend y modales
