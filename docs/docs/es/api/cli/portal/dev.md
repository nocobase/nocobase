---
title: "nb portal dev"
description: "Referencia del comando nb portal dev: inicia el modo de desarrollo del directorio local de código fuente de un Portal."
keywords: "nb portal dev,NocoBase CLI,Portal,modo de desarrollo,desarrollo local"
---

# nb portal dev

Inicia el modo de desarrollo del directorio local de código fuente del Portal indicado. Normalmente se usa después de ejecutar [`nb portal create`](./create.md) o [`nb portal pull`](./pull.md).

Al ejecutarse, actualiza `.env` y `.env.local` en el directorio local de código fuente y a continuación ejecuta `pnpm dev` en ese mismo directorio.

## Uso

```bash
nb portal dev <portal> [flags]
```

## Parámetro

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<portal>` | string | Nombre o slug del Portal |
| `--env`, `-e` | string | Nombre del env de la CLI. Si se omite, se usa el env actual |
| `--yes`, `-y` | boolean | Omite la confirmación interactiva cuando el `--env` indicado explícitamente difiere del env actual |

## Ejemplos

Iniciar el modo de desarrollo de un Portal en el env actual:

```bash
nb portal dev customer
```

Iniciar el modo de desarrollo de un Portal en un env concreto:

```bash
nb portal dev customer --env dev --yes
```

## Notas

`dev` inicia el servidor de desarrollo a partir del directorio local de código fuente del Portal. No crea el registro de Portal ni descarga el código fuente remoto; si el directorio local de código fuente no existe, use antes [`nb portal create`](./create.md) o [`nb portal pull`](./pull.md).

El directorio local de código fuente debe contener `package.json`. Los env de tipo `ssh` todavía no admiten iniciar el modo de desarrollo de un Portal.

## Comandos relacionados

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
