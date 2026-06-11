---
title: "Hermes Agent: un asistente de NocoBase que le entiende cada vez mejor"
description: "Integre Hermes Agent con NocoBase y, gracias a la memoria entre sesiones y la consolidación automática de habilidades, deje que la IA conozca cada vez mejor su sistema de negocio."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,Aprendizaje automático,Auto-hospedaje"
sidebar: false
---

:::warning Contenido en redacción

Esta página todavía está en redacción. Algunas secciones pueden estar incompletas o sufrir cambios.

:::

# Hermes Agent: un asistente de NocoBase que le entiende cada vez mejor

[Hermes Agent](https://github.com/nousresearch/hermes-agent) es un AI Agent de código abierto y auto-hospedado: convierte automáticamente cada operación exitosa en un documento de habilidad reutilizable, por lo que comprende cada vez mejor su sistema. Una vez integrado con NocoBase, no solo podrá construir y gestionar el sistema en lenguaje natural, sino también permitir que aprenda gradualmente las convenciones y preferencias de su negocio.

<!-- Se necesita una captura de pantalla de Hermes Agent operando NocoBase en la terminal o en una conversación de Lark -->

## ¿Qué es Hermes Agent?

Hermes Agent está desarrollado por Nous Research (35,7k estrellas en GitHub). Su filosofía central es "cuanto más se usa, más inteligente se vuelve". A diferencia de otros AI Agents, Hermes cuenta con un mecanismo completo de aprendizaje en bucle cerrado:

- **Memoria entre sesiones** — basada en búsqueda de texto completo y resúmenes con LLM, puede recuperar el contexto de conversaciones de hace varias semanas
- **Consolidación automática de habilidades** — tras completar con éxito una tarea compleja, crea automáticamente un documento de habilidad reutilizable
- **Auto-mejora continua** — las habilidades se optimizan con el uso repetido, ganando precisión con el tiempo
- **Compatible con más de 400 modelos** — compatible con los principales proveedores de LLM, sin estar atado a un modelo concreto

Hermes admite 8 plataformas, como Lark, Telegram, Discord y Slack, y también puede usarse directamente desde la terminal.

:::tip Sugerencia

Hermes Agent se ejecuta en su propio servidor y todos los datos y la memoria se almacenan localmente, lo que lo hace adecuado para escenarios con requisitos estrictos de seguridad de datos.

:::

## ¿Por qué elegir Hermes Agent?

Si está decidiendo qué AI Agent utilizar para operar NocoBase, estos son los escenarios para los que Hermes resulta más adecuado:

- **Mantenimiento prolongado del mismo sistema** — el mecanismo de memoria de Hermes le permite entender cada vez mejor su negocio sin tener que volver a explicar el contexto cada vez
- **El equipo necesita auto-hospedaje** — los datos quedan totalmente locales, sin pasar por servicios en la nube de terceros
- **Necesita procesos operativos estandarizados** — los documentos de habilidad consolidados automáticamente por Hermes pueden servir como manual operativo del equipo
- **Prefiere la operación por terminal** — Hermes admite la interacción CLI de forma nativa, ideal para el uso diario de equipos técnicos

## Principio de conexión

Hermes Agent colabora con NocoBase de la siguiente forma:

```
Usted (Lark / Telegram / Terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (permite al Agent comprender el sistema de configuración de NocoBase)
        │
        ├── NocoBase CLI (ejecuta operaciones de creación, modificación, despliegue, etc.)
        │
        └── Memoria y documentos de habilidad (consolidados automáticamente, reutilizados de forma continua)
              │
              └─→ Servicio NocoBase (su sistema de negocio)
```

A diferencia de otros Agents, Hermes actualiza su propia memoria y sus documentos de habilidad después de cada operación. Esta información se almacena localmente y se reutiliza automáticamente en operaciones posteriores.

## Requisitos previos

Antes de comenzar, asegúrese de tener preparado el siguiente entorno:

- Un servidor para ejecutar Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js >= 22 (para ejecutar NocoBase CLI y Skills)
- Si ya tiene una instancia de NocoBase, **debido a la rápida iteración de las capacidades de IA, actualmente solo la última versión beta admite la experiencia completa. La versión mínima requerida es >= 2.1.0-beta.20 y se recomienda encarecidamente actualizar a la última versión.**

La instalación de Hermes solo requiere una línea de comandos:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Atención

Hermes Agent requiere despliegue y mantenimiento por su parte. Si desea una solución sin configuración y lista para usar, considere [OpenClaw](../openclaw/index.md) (despliegue con un solo clic en Lark) o [WorkBuddy](../workbuddy/index.md) (alojado por Tencent).

:::

## Inicio rápido

### Instalación con IA con un solo paso

Copie el siguiente prompt en Hermes Agent y este completará automáticamente la instalación, inicialización y configuración del entorno de NocoBase CLI:

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

<!-- TODO: organizar entre 5 y 8 preguntas frecuentes. Por ejemplo: dónde se almacenan los archivos de memoria, cómo migrar a un nuevo servidor, qué modelos se admiten, cómo borrar memorias erróneas, en qué se diferencia Hermes de OpenClaw, etc. -->

## Enlaces relacionados

- [NocoBase CLI](../quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paquetes de conocimiento de dominio instalables en AI Agents
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — Construya aplicaciones NocoBase desde cero con IA
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Código fuente y documentación de Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) — El AI Agent de código abierto más popular del mundo, con despliegue en Lark con un solo clic
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Control remoto de NocoBase desde WeCom, Lark, DingTalk y otras plataformas
