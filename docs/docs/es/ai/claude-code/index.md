---
title: "Claude Code + NocoBase: el cerebro de IA más potente, su arquitecto jefe de NocoBase"
description: "Integre Claude Code, el asistente oficial de programación con IA de Anthropic, con NocoBase y opere su sistema de negocio en lenguaje natural mediante Skills y la CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,Lenguaje natural"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# Claude Code + NocoBase: el cerebro de IA más potente, su arquitecto jefe de NocoBase

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) es el asistente oficial de programación con IA de Anthropic: se ejecuta directamente en la terminal, comprende toda su base de código y le ayuda a realizar tareas que van desde la programación hasta la construcción de sistemas. Una vez integrado con NocoBase, podrá crear tablas de datos, construir páginas y configurar flujos de trabajo en lenguaje natural, disfrutando de la experiencia de construcción que ofrecen los modelos de IA más potentes.

<!-- Se necesita una captura de pantalla de Claude Code operando NocoBase en la terminal -->

## ¿Qué es Claude Code?

Claude Code es el AI Agent en formato CLI lanzado por Anthropic, impulsado por la familia de modelos Claude. Se ejecuta directamente en la terminal, comprende el contexto del proyecto y ejecuta operaciones. Características principales:

- **Capacidad de modelo de primer nivel** — basado en Claude Opus / Sonnet, con un rendimiento líder en comprensión y generación de código
- **Nativo de la terminal** — se ejecuta directamente en la terminal y se integra sin fisuras en el flujo de trabajo del desarrollador
- **Conciencia del proyecto** — comprende automáticamente la estructura del proyecto, las dependencias y las convenciones de código
- **Colaboración multiherramienta** — admite leer y escribir archivos, ejecutar comandos, buscar código y otras operaciones

Claude Code también admite integración con VS Code, JetBrains y otros IDE, y se puede utilizar como aplicación de escritorio independiente o aplicación web.

## ¿Por qué elegir Claude Code?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que Claude Code resulta más adecuado:

- **Quiere la máxima capacidad del modelo** — los modelos de la serie Claude destacan en razonamiento complejo y generación de código
- **Flujo de trabajo diario del desarrollador** — nativo de la terminal, encaja perfectamente con su IDE, Git, npm y otras herramientas
- **Necesita una comprensión profunda del proyecto** — Claude Code analiza automáticamente la estructura del proyecto y ofrece sugerencias acordes al contexto
- **Construye y desarrolla a la vez** — le ayuda tanto a construir aplicaciones NocoBase como a desarrollar plugins personalizados

## Principio de conexión

Claude Code colabora con NocoBase de la siguiente forma:

```
Usted (Terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        └── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

- **NocoBase Skills** — paquete de conocimiento de dominio que permite a Claude Code saber cómo operar NocoBase
- **NocoBase CLI** — herramienta de línea de comandos que ejecuta efectivamente el modelado de datos, la construcción de páginas, etc.
- **Servicio NocoBase** — su instancia de NocoBase en ejecución

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- Tener Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en Claude Code y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

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

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: cómo configurar la API Key, qué modelos admite Claude Code, cómo usarlo en VS Code, qué hacer si falla la instalación de Skills, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Documentación oficial de Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Guía completa de uso de Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) — El AI Agent de código abierto más popular del mundo, con despliegue en Lark con un solo clic
- [Codex + NocoBase](../codex/index.md) — Asistente oficial de programación con IA de OpenAI
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent de terminal de código abierto, compatible con más de 75 modelos
