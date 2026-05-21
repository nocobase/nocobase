---
title: "Guía de instalación para AI Agent"
description: "Guía de instalación y configuración de NocoBase CLI dirigida a AI Agents, con los pasos completos de verificación del entorno, instalación, inicialización y validación."
keywords: "NocoBase CLI,AI Agent,Instalación,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Guía de instalación para AI Agent

Esta página es una guía de instalación e inicialización de NocoBase CLI dirigida a AI Agents (como Claude Code, Codex, Cursor, Copilot, etc.).

Si usted es un usuario humano, consulte el [Inicio rápido](./quick-start.md).

## Paso 1: Verificar el entorno previo

Confirme que el usuario tiene instaladas las siguientes dependencias:

- **Node.js >= 22** (verifique con `node -v`)
- **Yarn 1.x** (verifique con `yarn -v`). Si no está instalado, instálelo con `npm install -g yarn`
- **Git** (verifique con `git --version`). Si no está instalado, instálelo desde el [sitio oficial de Git](https://git-scm.com/)
- **Docker** (si el usuario necesita instalar NocoBase mediante Docker). Verifique con `docker -v`. Si no está instalado y el usuario necesita usar Docker, guíelo para instalarlo desde el [sitio oficial de Docker](https://www.docker.com/get-started/); de lo contrario, omita este paso.

Si el entorno previo no se cumple, indique al usuario que primero debe instalar las dependencias faltantes y proporciónele los enlaces y una guía sencilla de instalación. Una vez confirmado que se cumplen todos los requisitos previos, continúe con la instalación de la CLI.

## Paso 2: Instalar la CLI

Si el entorno del usuario ya tiene NocoBase CLI instalada (verifique con `nb --version`), pase directamente al siguiente paso. Si no, ejecute el siguiente comando para instalarla:

```bash
npm install -g @nocobase/cli@beta
```

Ejecute `nb --version` para confirmar que la instalación se realizó correctamente.

## Paso 3: Ejecutar el comando de inicialización

**Importante: debe ejecutar estrictamente el siguiente comando, sin modificar, sustituir ni omitir el parámetro `--ui`. No intente "acelerar" este proceso utilizando un "modo no interactivo" o construyendo parámetros por su cuenta — `--ui` es la única forma correcta de inicialización.**

```bash
nb init --ui
```

Este comando lanzará un asistente visual en el navegador donde el usuario debe completar toda la configuración (incluyendo el método de instalación, la base de datos, la cuenta de administrador, etc.). Su responsabilidad como AI Agent es:

1. **Ejecutar únicamente `nb init --ui`** sin añadir ningún parámetro adicional
2. **Indicar al usuario** que el navegador abrirá automáticamente una página de configuración local en la que debe completar la configuración
3. **Si el navegador no se abre automáticamente** (por ejemplo, debido a restricciones del sandbox), proporcione al usuario la URL que aparece en la salida del comando para que la copie manualmente en el navegador
4. **Esperar a que el usuario confirme** que la configuración ha finalizado antes de continuar con el siguiente paso. Este comando tiene un tiempo de espera por defecto de 30 minutos; no vuelva a ejecutarlo dentro de ese intervalo.

## Paso 4: Validar el resultado

```bash
nb env list
```

Confirme que la salida muestra el entorno configurado y su estado de ejecución. A continuación, recuerde al usuario que puede abrir la URL de la instancia de NocoBase en ejecución e iniciar sesión con la cuenta y contraseña configuradas.

## Paso 5: Finalizar

Indique al usuario que la instalación ha finalizado. La configuración de la CLI se guarda en el directorio global (por defecto `~/.nocobase/`), por lo que el AI Agent puede acceder a ella desde cualquier directorio sin necesidad de entrar en un directorio de trabajo específico.
