---
title: "OpenClaw + NocoBase: el AI Agent más popular trabaja para usted"
description: "Integre OpenClaw, el AI Agent de código abierto más popular del mundo, con NocoBase y opere su sistema de negocio en lenguaje natural mediante Skills y la CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,Lenguaje natural"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# OpenClaw + NocoBase: el AI Agent más popular trabaja para usted

[OpenClaw](https://github.com/openclaw/openclaw) es el framework de AI Agent de código abierto más popular del mundo: no solo conversa, sino que también ejecuta tareas reales. Una vez integrado con NocoBase, podrá crear tablas de datos, construir páginas y configurar flujos de trabajo en lenguaje natural, e incluso dejarlo funcionando 24/7 de forma autónoma para mantener su sistema de negocio de manera continua.

<!-- Se necesita una captura de pantalla de OpenClaw operando NocoBase en una conversación de Lark -->

## ¿Qué es OpenClaw?

OpenClaw es un framework de AI Agent de código abierto creado por el desarrollador Peter Steinberger. Es uno de los proyectos de AI Agent más populares del mundo en este momento (más de 300k estrellas en GitHub). Se posiciona como un "asistente de IA capaz de ejecutar tareas". A diferencia de herramientas conversacionales como ChatGPT o Claude, OpenClaw tiene cuatro características principales:

- **Capacidad de ejecución** — completa tareas automáticamente al recibir instrucciones en lenguaje natural, no solo ofrece sugerencias
- **Memoria entre sesiones** — recuerda sus preferencias y hábitos de uso, volviéndose más cómodo con el tiempo
- **Ecosistema de Skills** — amplía sus capacidades instalando Skills, como "enseñar nuevas habilidades" al asistente
- **Funcionamiento 24/7** — admite tareas programadas e informes proactivos, sin necesidad de supervisión constante

OpenClaw admite más de 26 plataformas, como Lark, Telegram y Discord, y puede dialogar con él directamente desde sus herramientas ofimáticas habituales. Los usuarios de Lark también pueden desplegarlo con un solo clic, sin necesidad de conocimientos técnicos.

## ¿Por qué elegir OpenClaw?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que OpenClaw resulta más adecuado:

- **Necesita un inicio sin barreras** — los usuarios de Lark pueden desplegarlo con un solo clic, sin necesidad de montar un servidor propio
- **El equipo trabaja con Lark** — OpenClaw está profundamente integrado con Lark, ofreciendo una experiencia fluida con generación en streaming, mención del bot en grupos, etc.
- **Requiere disponibilidad 24/7** — OpenClaw se despliega en la nube, sin depender del estado del equipo local
- **Valora el ecosistema de la comunidad** — OpenClaw tiene la mayor comunidad de Skills; además de NocoBase, dispone de muchas otras habilidades

## Principio de conexión

OpenClaw colabora con NocoBase de la siguiente forma:

```
Usted (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        └── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

- **NocoBase Skills** — paquete de conocimiento de dominio que permite a OpenClaw saber cómo operar NocoBase
- **NocoBase CLI** — herramienta de línea de comandos que ejecuta efectivamente el modelado de datos, la construcción de páginas, etc.
- **Servicio NocoBase** — su instancia de NocoBase en ejecución

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- OpenClaw Agent ya desplegado ([despliegue con un solo clic en Lark](https://openclaw.feishu.cn) o despliegue local)
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

:::warning Atención

Cuando instale Skills de terceros, preste atención a la seguridad: priorice las Skills de fuentes oficiales o de confianza y evite instalar habilidades de la comunidad sin revisar.

:::

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en OpenClaw y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

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

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: qué hacer si falla la instalación de Skills, cómo actualizar la versión de Skills, qué modelos admite OpenClaw, cómo revertir un error de operación, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Guía de despliegue de OpenClaw en Lark](https://openclaw.feishu.cn) — Despliegue OpenClaw en Lark con un solo clic
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Consolida habilidades automáticamente y entiende cada vez mejor su sistema de negocio
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Control remoto de NocoBase desde WeCom, Lark, DingTalk y otras plataformas
