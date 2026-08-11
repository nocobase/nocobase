---
title: "nb portal deploy"
description: "Referencia del comando nb portal deploy: compila y despliega el workspace de Portal especificado."
keywords: "nb portal deploy,NocoBase CLI,Portal,compilar,desplegar"
---

# nb portal deploy

Compila y despliega el workspace de Portal especificado. Normalmente se usa cuando el desarrollo local ya terminó y necesitas actualizar el Portal en el env de destino.

Durante la ejecución, primero se actualizan `.env` y `.env.local` en el workspace y después se ejecuta `pnpm build`. El resultado de compilación debe incluir `dist/client/index.html`.

## Uso

```bash
nb portal deploy <portal> [flags]
```

## Parámetro

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<portal>` | string | Nombre o slug del Portal |
| `--env`, `-e` | string | Nombre del env de la CLI. Si se omite, se usa el env actual |
| `--no-install` | boolean | Omitir `pnpm install` antes de compilar |
| `--yes`, `-y` | boolean | Omitir la confirmación interactiva cuando el `--env` explícito no coincide con el env actual |

## Ejemplos

Desplegar un Portal en el env actual:

```bash
nb portal deploy customer
```

Desplegar un Portal en un env específico:

```bash
nb portal deploy customer --env dev --yes
```

Omitir la instalación de dependencias y solo recompilar y desplegar:

```bash
nb portal deploy customer --no-install
```

## Notas

`deploy` está pensado para workspaces de desarrollo de Portal que ya existen. Si todavía no tienes un workspace local, créalo primero con [`nb portal create`](./create.md) o usa [`nb portal pull`](./pull.md) para traerlo desde el source storage.

El despliegue compila el Portal desde la ruta de desarrollo registrada en la configuración del env de la CLI y sincroniza el resultado de compilación con el directorio de despliegue del storage de la aplicación de destino.

El despliegue no modifica el source storage ni la configuración de Git. Estas configuraciones se actualizan en el registro remoto del Portal mediante [`nb portal config`](./config.md).

## Comandos relacionados

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
