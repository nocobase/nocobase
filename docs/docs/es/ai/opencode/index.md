---
title: "OpenCode + NocoBase: una forma de construir NocoBase abierta, libre y sin ataduras"
description: "Integre OpenCode, el asistente de programación con IA de código abierto, con NocoBase. Elija libremente el modelo y opere su sistema de negocio en lenguaje natural."
keywords: "OpenCode,NocoBase,AI Agent,Código abierto,Multimodelo,Skills,CLI,Lenguaje natural"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# OpenCode + NocoBase: una forma de construir NocoBase abierta, libre y sin ataduras

[OpenCode](https://github.com/opencode-ai/opencode) es un AI Agent de terminal de código abierto que admite más de 75 modelos (Claude, GPT, Gemini, DeepSeek, etc.). No está atado a ningún proveedor: usted puede elegir libremente el modelo más adecuado. Una vez integrado con NocoBase, podrá crear tablas de datos, construir páginas y configurar flujos de trabajo en lenguaje natural, manteniendo el control total sobre la elección del modelo y el coste.

<!-- Se necesita una captura de pantalla de OpenCode operando NocoBase en la terminal -->

## ¿Qué es OpenCode?

OpenCode está desarrollado por Anomaly Innovations (más de 140k estrellas en GitHub) y se posiciona como "AI Agent de terminal sin lock-in de proveedor". Está escrito en Go y ofrece una elegante interfaz TUI. Características principales:

- **Compatible con más de 75 modelos** — Claude, GPT, Gemini, DeepSeek, modelos locales, etc., con cambio libre
- **Cero lock-in con proveedores** — usa su propia API Key, paga por el uso real, sin necesidad de suscripciones adicionales
- **Arquitectura multi-Agent** — incluye cinco roles de Agent integrados: Build, Plan, Review, Debug y Docs
- **Privacidad ante todo** — no almacena código ni contexto; todos los datos permanecen en local

OpenCode también admite integración con editores como VS Code, JetBrains, Zed y Neovim, y dispone de aplicación de escritorio independiente.

## ¿Por qué elegir OpenCode?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que OpenCode resulta más adecuado:

- **No quiere quedar atado a un único modelo** — hoy con Claude, mañana con GPT, pasado mañana con DeepSeek; todo desde una misma herramienta
- **Da importancia al control de costes** — uso de su propia API Key con pago por consumo, compatible con la suscripción existente de ChatGPT Plus
- **Tiene requisitos de privacidad** — el código y el contexto no pasan por terceros; admite modelos locales
- **Le gusta la personalización avanzada** — configuración YAML para personalizar el comportamiento del Agent y cubrir necesidades específicas del equipo

## Principio de conexión

OpenCode colabora con NocoBase de la siguiente forma:

```
Usted (Terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        └── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

- **NocoBase Skills** — paquete de conocimiento de dominio que permite a OpenCode saber cómo operar NocoBase
- **NocoBase CLI** — herramienta de línea de comandos que ejecuta efectivamente el modelado de datos, la construcción de páginas, etc.
- **Servicio NocoBase** — su instancia de NocoBase en ejecución

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- Tener OpenCode instalado ([guía de instalación](https://opencode.ai/docs/))
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en OpenCode y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

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

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: cómo configurar la API Key de cada modelo, cómo cambiar de modelo, cómo usar modelos locales, qué hacer si falla la instalación de Skills, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Documentación oficial de OpenCode](https://opencode.ai/docs/) — Guía completa de uso de OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) — Asistente oficial de programación con IA de Anthropic
- [Codex + NocoBase](../codex/index.md) — Asistente oficial de programación con IA de OpenAI
