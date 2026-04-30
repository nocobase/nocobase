---
title: "Visión general del desarrollo de plugins de cliente"
description: "Visión general del desarrollo de plugins de cliente de NocoBase: línea principal de conocimiento Plugin → Router → Component → Context → FlowEngine, tabla de índice rápido para localizar las secciones."
keywords: "plugin de cliente,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Visión general

Los plugins de cliente de NocoBase pueden hacer muchas cosas: registrar nuevas páginas, escribir componentes personalizados, llamar a la API del backend, añadir Blocks y Fields, e incluso extender botones de Action. Todas estas capacidades se organizan a través de un punto de entrada de Plugin unificado.

Si usted ya tiene experiencia con React, le resultará rápido empezar: en la mayoría de los casos solo se trata de escribir componentes React normales y, mediante las capacidades de contexto que proporciona NocoBase (como enviar peticiones, internacionalización), integrarlos con NocoBase. Solo cuando necesite que un componente aparezca en la interfaz de configuración visual de NocoBase, tendrá que conocer [FlowEngine](./flow-engine/index.md).

:::warning Atención

NocoBase está migrando de `client` (v1) a `client-v2`, y `client-v2` aún está en desarrollo. El contenido de este documento es para experimentación previa y no se recomienda su uso directo en producción. Los nuevos plugins deben utilizar el directorio `src/client-v2/` y la API de `@nocobase/client-v2`.

:::

## Ruta de aprendizaje

Se recomienda conocer el desarrollo de plugins de cliente en el siguiente orden, de lo simple a lo complejo:

```
Plugin (entrada) → Router (página) → Component (componente) → Context (contexto) → FlowEngine (extensión de UI)
```

Donde:

1. **[Plugin](./plugin)**: la clase de entrada del plugin, que registra rutas, modelos y otros recursos en ciclos de vida como `load()`.
2. **[Router](./router)**: registre rutas de página mediante `router.add()` y registre páginas de configuración del plugin mediante `pluginSettingsManager`.
3. **[Component](./component/index.md)**: lo que la ruta monta es un componente React. Por defecto basta con usar React + Antd, sin diferencia respecto al desarrollo frontend habitual.
4. **[Context](./ctx/index.md)**: dentro del plugin puede obtener el contexto mediante `this.context`, y dentro de los componentes mediante `useFlowContext()`, para utilizar las capacidades que ofrece NocoBase: enviar peticiones (`ctx.api`), internacionalización (`ctx.t`), logs (`ctx.logger`), etc.
5. **[FlowEngine](./flow-engine/index.md)**: si su componente necesita aparecer en los menús «Add Block / Field / Action» y permitir configuración visual del usuario, debe envolverlo con FlowModel.

Los primeros cuatro pasos cubren la mayoría de los escenarios de plugins. Solo cuando necesite una integración profunda con el sistema de configuración de UI de NocoBase deberá llegar al quinto paso. Si no está seguro de qué método utilizar, consulte [Component vs FlowModel](./component-vs-flow-model).

## Índice rápido

| Quiero… | Dónde mirar |
| --- | --- |
| Conocer la estructura básica del plugin de cliente | [Plugin](./plugin) |
| Añadir una página independiente | [Router](./router) |
| Añadir una página de configuración del plugin | [Router](./router) |
| Escribir un componente React normal | [Desarrollo de Component](./component/index.md) |
| Llamar a la API del backend, usar las capacidades integradas de NocoBase | [Context → Capacidades comunes](./ctx/common-capabilities) |
| Personalizar el estilo del componente | [Styles & Themes](./component/styles-themes) |
| Añadir un nuevo Block | [FlowEngine → Extensión de Block](./flow-engine/block) |
| Añadir un nuevo componente de Field | [FlowEngine → Extensión de Field](./flow-engine/field) |
| Añadir un nuevo botón de Action | [FlowEngine → Extensión de Action](./flow-engine/action) |
| No estoy seguro de usar Component o FlowModel | [Component vs FlowModel](./component-vs-flow-model) |
| Ver cómo se construye un plugin completo | [Ejemplos prácticos de plugin](./examples/index.md) |

## Enlaces relacionados

- [Escribir su primer plugin](../write-your-first-plugin) — crear un plugin funcional desde cero
- [Visión general del desarrollo de servidor](../server) — los plugins de cliente normalmente requieren un complemento del servidor
- [Documentación completa de FlowEngine](../../flow-engine/index.md) — referencia completa de FlowModel, Flow y Context
- [Estructura de directorios del proyecto](../project-structure) — dónde colocar los archivos del plugin
