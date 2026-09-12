---
title: Actualizar la aplicación NocoBase
description: Actualiza una aplicación NocoBase guardada como CLI env con nb app upgrade, incluyendo confirmación del env, comandos de actualización, versiones objetivo y verificación.
---

# Actualizar la aplicación NocoBase

:::tip Alcance

Esta guía aplica a las aplicaciones instaladas con `nb init`. Si tu aplicación se instaló con el método antiguo, lee primero [Cómo actualizar NocoBase de 2.0 a 2.1](./upgrade-from-2-0-to-2-1.md).

:::

## Paso 1: confirmar el env actual

Primero confirma el CLI env activo:

```bash
nb env current
```

Si no tienes claro qué envs existen, lista primero todos:

```bash
nb env list
```

Si el env actual no es la aplicación que quieres actualizar, cambia al env objetivo:

```bash
nb env use <env-name>
```

## Paso 2: ejecutar la actualización

:::warning Nota

De forma predeterminada, la actualización descarga de nuevo el código fuente de la aplicación o la imagen Docker.

En envs npm / Git, el directorio `source/` se elimina y se descarga de nuevo. No guardes ahí archivos que necesites conservar.

Si ya preparaste manualmente el código fuente o la imagen Docker y no quieres que la CLI los descargue de nuevo, añade `--skip-download` al comando.

:::

El comando de actualización predeterminado es:

```bash
nb app upgrade
```

Este comando normalmente realiza estos pasos:

1. Detener la aplicación actual
2. Descargar y reemplazar el código o la imagen guardados
3. Sincronizar plugins comerciales
4. Actualizar e iniciar la aplicación
5. Actualizar la información de runtime del env

En scripts, CI o sesiones de AI Agent, pasa `--force` explícitamente:

```bash
nb app upgrade --force
```

Si la aplicación que quieres actualizar no es el env actual, especifica el env:

```bash
nb app upgrade --env app1 --yes --force
```

### Actualizar a una versión específica

Usa `--version` para actualizar a un canal de versión específico:

```bash
nb app upgrade --version beta
```

También puedes indicar una versión exacta:

```bash
nb app upgrade --version 2.1.0-beta.24
```

Después de una actualización correcta, la CLI escribe la versión objetivo en la configuración del env, para que actualizaciones o recuperaciones posteriores puedan reutilizarla.

### Omitir la descarga

Si ya actualizaste el código fuente o la imagen Docker y solo quieres ejecutar la actualización y el inicio con el contenido actual, añade `--skip-download`:

```bash
nb app upgrade --skip-download
```

Este parámetro omite la descarga del código o la imagen y también omite la sincronización de plugins comerciales. Úsalo normalmente solo cuando la versión objetivo ya esté preparada manualmente.

## Paso 3: verificar el resultado

Después de la actualización, revisa primero la información de runtime del env y los logs de la aplicación:

```bash
nb env info
nb app logs
```

Luego abre la aplicación y confirma que la cuenta de administrador puede iniciar sesión. Si quieres que un AI Agent siga trabajando con esta aplicación, inicia una nueva sesión del AI Agent o reinicia la actual para que lea la información más reciente del env.

## Enlaces relacionados

- [Administrar aplicaciones](../nocobase-cli/operations/manage-app.md) — Iniciar, detener, reiniciar, ver logs y actualizar aplicaciones
- [Referencia del comando `nb app upgrade`](../api/cli/app/upgrade.md) — Ver todas las opciones del comando de actualización
- [Gestión de múltiples entornos](../nocobase-cli/operations/multi-environment.md) — Confirmar, cambiar y mantener varios CLI envs
