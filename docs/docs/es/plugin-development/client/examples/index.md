---
title: "Tutoriales prácticos de plugins"
description: "Casos prácticos completos de plugins cliente de NocoBase: página de configuración, bloque personalizado, integración full-stack y campo personalizado, de cero a plugin terminado."
keywords: "ejemplos de plugins,casos prácticos,plugin completo,NocoBase"
---

# Tutoriales prácticos de plugins

Los capítulos anteriores presentaron por separado [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md), entre otras capacidades. Este capítulo las combina: a través de varios casos prácticos completos muestra el ciclo completo de un plugin, desde su creación hasta su finalización.

Cada ejemplo se corresponde con un plugin de muestra ejecutable, cuyo código fuente puede consultar o ejecutar en local.

## Lista de ejemplos

| Ejemplo | Capacidades implicadas | Dificultad |
| --- | --- | --- |
| [Crear una página de configuración del plugin](./settings-page) | Plugin + Router + Component + Context + servidor | Iniciación |
| [Crear un bloque de presentación personalizado](./custom-block) | Plugin + FlowEngine (BlockModel) | Iniciación |
| [Crear un componente de campo personalizado](./custom-field) | Plugin + FlowEngine (FieldModel) | Iniciación |
| [Crear un botón de acción personalizado](./custom-action) | Plugin + FlowEngine (ActionModel) | Iniciación |
| [Crear un plugin de gestión de datos full-stack](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + servidor | Avanzado |

Se recomienda leerlos en orden. El primer ejemplo usa componentes React + un endpoint de servidor sencillo y no toca FlowEngine; los tres siguientes presentan las clases base de bloque, campo y acción de FlowEngine; el último combina los tres más una colección en el servidor para componer un plugin full-stack completo. Si todavía no sabe cuándo usar componente o FlowModel, consulte primero [Component vs FlowModel](../component-vs-flow-model).

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear un plugin ejecutable desde cero.
- [Visión general del desarrollo en cliente](../index.md): ruta de aprendizaje e índice rápido.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel y `registerFlow`.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
- [Component vs FlowModel](../component-vs-flow-model): elegir entre componente y FlowModel.
