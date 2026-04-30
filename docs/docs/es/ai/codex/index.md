---
title: "Use Codex para operar NocoBase, construyendo y desarrollando a la vez"
description: "Integre Codex, el asistente oficial de programación con IA de OpenAI, con NocoBase y opere su sistema de negocio en lenguaje natural mediante Skills y la CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,Lenguaje natural"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# Use Codex para operar NocoBase, construyendo y desarrollando a la vez

[Codex](https://github.com/openai/codex) es el asistente oficial de programación con IA de OpenAI: se ejecuta en la terminal, puede leer y escribir código, ejecutar comandos y ayudarle a realizar tareas que van desde la programación hasta la construcción de sistemas. Una vez integrado con NocoBase, podrá crear tablas de datos, construir páginas y configurar flujos de trabajo en lenguaje natural, aprovechando la potencia de los modelos de la serie GPT para construir su sistema de negocio rápidamente.

<!-- Se necesita una captura de pantalla de Codex operando NocoBase en la terminal -->

## ¿Qué es Codex?

Codex es el AI Agent en formato CLI lanzado por OpenAI, impulsado por la familia de modelos GPT (incluidos o3, o4-mini, etc.). Se ejecuta en un entorno sandbox local y puede ejecutar código y comandos de forma segura. Características principales:

- **Potencia de la serie GPT** — basado en los últimos modelos de OpenAI, destaca en generación de código y planificación de tareas
- **Ejecución en sandbox** — ejecuta los comandos en un sandbox aislado, de forma segura y controlada
- **Comprensión multimodal** — admite entrada de texto, imágenes y otros formatos, y comprende el diseño de la UI a partir de capturas
- **Nivel de autonomía flexible** — desde modo sugerencia hasta modo totalmente automático, usted decide cuán autónoma es la IA

## ¿Por qué elegir Codex?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que Codex resulta más adecuado:

- **Ya está usando el ecosistema de OpenAI** — si tiene una suscripción a ChatGPT Plus/Pro o una API Key de OpenAI, Codex es la opción más natural
- **Da prioridad a la seguridad** — el mecanismo de ejecución en sandbox garantiza que las operaciones de la IA no afecten accidentalmente a su sistema
- **Necesita un control flexible** — puede cambiar el nivel de autonomía según la complejidad de la tarea: totalmente automático para tareas simples, con confirmación para operaciones sensibles
- **Le gusta el estilo de los modelos de OpenAI** — la serie GPT tiene sus propias ventajas en planificación y ejecución por pasos

## Principio de conexión

Codex colabora con NocoBase de la siguiente forma:

```
Usted (Terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        └── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

- **NocoBase Skills** — paquete de conocimiento de dominio que permite a Codex saber cómo operar NocoBase
- **NocoBase CLI** — herramienta de línea de comandos que ejecuta efectivamente el modelado de datos, la construcción de páginas, etc.
- **Servicio NocoBase** — su instancia de NocoBase en ejecución

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- Tener Codex instalado (`npm install -g @openai/codex`)
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en Codex y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

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

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: cómo configurar la API Key de OpenAI, qué modelos admite Codex, cómo elegir el nivel de autonomía, qué hacer si falla la instalación de Skills, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Codex GitHub](https://github.com/openai/codex) — Código fuente y documentación de Codex
- [Claude Code + NocoBase](../claude-code/index.md) — Asistente oficial de programación con IA de Anthropic
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent de terminal de código abierto, compatible con más de 75 modelos
