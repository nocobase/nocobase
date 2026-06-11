---
title: "Libere sus manos y use WorkBuddy para impulsar NocoBase"
description: "Controle NocoBase de forma remota con WorkBuddy de Tencent, compatible con WeCom, Lark, DingTalk y otras plataformas."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,Control remoto"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# Libere sus manos y use WorkBuddy para impulsar NocoBase

[WorkBuddy](https://www.codebuddy.cn) es el agente inteligente de IA para todos los escenarios de trabajo de Tencent: describa una necesidad en una frase y planificará y ejecutará los pasos por su cuenta. Una vez integrado con NocoBase, podrá controlar de forma remota su sistema de negocio desde plataformas como WeCom, Lark o DingTalk, completando las operaciones de gestión diarias sin necesidad de abrir el navegador.

<!-- Se necesita una captura de pantalla de WorkBuddy operando NocoBase en una conversación de WeCom -->

## ¿Qué es WorkBuddy?

WorkBuddy es la "estación de trabajo de escritorio con agente inteligente de IA para todos los escenarios laborales" de Tencent. A diferencia de las herramientas de conversación con IA habituales, WorkBuddy descompone, planifica y ejecuta automáticamente las tareas que recibe, entregando un resultado verificable, sin necesidad de que usted le guíe paso a paso.

Características principales:

- **Planificación y ejecución autónomas** — descompone los pasos automáticamente al recibir la tarea, los ejecuta uno por uno y entrega un resultado completo
- **Acceso multiplataforma** — admite WeCom, Lark, DingTalk, QQ y otras plataformas de oficina populares en China
- **Más de 20 habilidades integradas** — generación de documentos, análisis de datos, creación de PPT, edición de correos, etc., listas para usar
- **Operación con archivos locales** — puede leer y procesar los archivos locales que usted autorice

En resumen, las herramientas tradicionales de IA le dan sugerencias para que usted actúe; WorkBuddy hace el trabajo directamente.

| Diálogo de IA tradicional        | WorkBuddy                                       |
| -------------------------------- | ----------------------------------------------- |
| Solo conversa, da sugerencias    | Ejecuta tareas reales                           |
| Requiere operar archivos a mano  | Opera archivos locales automáticamente          |
| Tareas simples de un solo paso   | Descompone automáticamente tareas complejas multi-paso |
| Salida en forma de texto         | Entrega resultados verificables                 |

## ¿Por qué elegir WorkBuddy?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que WorkBuddy resulta más adecuado:

- **El equipo usa WeCom / Lark / DingTalk** — WorkBuddy admite la mayor variedad de plataformas ofimáticas en China, con la cobertura más amplia
- **Necesita controlar NocoBase desde el móvil** — gestione el sistema en cualquier momento, desde fuera de la oficina, sin restricciones de dispositivo
- **Quiere una solución lista para usar** — producto de Tencent con más de 20 habilidades integradas y baja barrera de configuración
- **Se centra en la automatización de tareas** — WorkBuddy es excelente descomponiendo y ejecutando tareas de varios pasos, ideal para las operaciones y la gestión diaria

## Principio de conexión

WorkBuddy colabora con NocoBase de la siguiente forma:

```
Usted (WeCom / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        └── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

Usted envía una instrucción desde cualquier plataforma compatible y WorkBuddy realiza la operación sobre NocoBase en el backend mediante Skills y la CLI, devolviéndole el resultado en tiempo real a la ventana de conversación.

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- Una cuenta de WorkBuddy ([registro](https://www.codebuddy.cn))
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

:::warning Atención

WorkBuddy se encuentra actualmente en iteración rápida y algunas funcionalidades pueden cambiar. Se recomienda consultar la [documentación oficial de WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) para obtener la información más actualizada.

:::

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en WorkBuddy y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

```
Ayúdame a instalar NocoBase CLI y completar la inicialización: https://docs.nocobase.com/cn/ai/ai-quick-start.md (por favor, accede directamente al contenido del enlace)
```

### Instalación manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

El navegador abrirá automáticamente la página de configuración visual y le guiará para instalar NocoBase Skills, configurar la base de datos e iniciar la aplicación. Para los pasos detallados, consulte el [Inicio rápido](../quick-start.md).

Una vez completada la instalación, ejecute `nb env list` para confirmar el estado de ejecución del entorno:

```bash
nb env list
```

Confirme que la salida muestra el entorno configurado y su estado de ejecución.

## Preguntas frecuentes

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: qué plataformas admite WorkBuddy, cuál es el cupo gratuito, cómo gestionar errores de operación, si varias personas pueden compartir el mismo WorkBuddy para operar la misma instancia de NocoBase, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Documentación oficial de WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) — Guía completa de uso de WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) — El AI Agent de código abierto más popular del mundo, con despliegue en Lark con un solo clic
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Consolida habilidades automáticamente y entiende cada vez mejor su sistema de negocio
