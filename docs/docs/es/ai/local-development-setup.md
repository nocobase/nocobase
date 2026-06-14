---
title: Configuración de desarrollo local
description: Prepara el entorno local del sistema operativo para NocoBase CLI y aplicaciones NocoBase, incluyendo Windows WSL, macOS, Linux, Node.js, Yarn y Docker.
---

# Configuración de desarrollo local

Esta página te ayuda a preparar un entorno local para NocoBase CLI y las aplicaciones NocoBase. Es adecuada para desarrollo local, evaluación de funciones y para que AI Agents instalen o administren NocoBase en tu equipo.

Si vas a desplegar NocoBase para usuarios reales, consulta primero los [requisitos del sistema para producción](../get-started/system-requirements.md).

## Windows: usar WSL

Para una configuración local en Windows, recomendamos mantener el entorno principal de desarrollo dentro de WSL 2: instala Node.js, Yarn y NocoBase CLI en la distribución Linux de WSL y ejecuta los comandos relacionados desde la terminal de WSL.

WSL se parece más a los entornos Linux donde NocoBase suele desplegarse. Esto tiene varias ventajas:

- La instalación de dependencias, compilación, inicio y revisión de logs se parecen más al flujo real del servidor
- Después de habilitar WSL integration en Docker Desktop, puedes ejecutar comandos `docker` directamente dentro de WSL
- Puedes reducir problemas adicionales de rutas nativas de Windows, permisos de archivos, enlaces simbólicos y compilación de dependencias nativas
- Es mejor para flujos con AI Agent. Cuando un agente ejecuta comandos como `nb`, `yarn` o `docker`, usa las mismas rutas Linux, sintaxis de shell y entorno de ejecución, lo que hace la depuración más directa

Si el entorno local basado en WSL aún no está listo, consulta [Configurar un entorno de desarrollo local en Windows con WSL](./windows-wsl.md).

Configuración recomendada:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, si planeas instalar NocoBase con Docker

Normalmente, Node.js, Yarn y NocoBase CLI se instalan dentro de WSL. Si usas Docker Desktop, habilita WSL integration en Docker Desktop para que WSL pueda acceder a Docker.

Comprueba el entorno:

```bash
node -v
yarn -v
docker version
```

:::tip Nota

NocoBase también puede instalarse en Windows Server. Aquí se recomienda WSL para desarrollo local y configuración de AI Agent en equipos personales. Esto no significa que Windows Server no pueda utilizarse para despliegues.

:::

## macOS

En macOS puedes usar directamente la terminal local.

Prepara:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack o Colima, si planeas instalar NocoBase con Docker

Comprueba el entorno:

```bash
node -v
yarn -v
docker version
```

Si no usas Docker, puedes omitir `docker version`.

## Linux

Linux puede utilizarse directamente como entorno de desarrollo local. Se recomienda Ubuntu, Debian u otras distribuciones comunes.

Prepara:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, si planeas instalar NocoBase con Docker

Comprueba el entorno:

```bash
node -v
yarn -v
docker version
```

Si no usas Docker, puedes omitir `docker version`.

## Siguientes pasos

- [Comparación de métodos de instalación y versiones](../get-started/quickstart.md) — Compara primero los métodos de instalación y los canales de versión
- [Instalar la aplicación NocoBase](./install-nocobase-app.md) — Inicializa una app local con NocoBase CLI
- [Guía de integración para AI Agent](./quick-start.mdx) — Permite que un AI Agent se conecte a NocoBase y lo opere
