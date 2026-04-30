---
title: "nb app upgrade"
description: "Referencia del comando nb app upgrade: actualiza el código fuente o la imagen y reinicia la aplicación NocoBase indicada."
keywords: "nb app upgrade,NocoBase CLI,actualización,actualizar,imagen Docker"
---

# nb app upgrade

Actualiza la aplicación NocoBase indicada. Las instalaciones npm/Git refrescan el código fuente guardado y reinician con quickstart; las instalaciones Docker refrescan la imagen guardada y reconstruyen el contenedor de aplicación.

## Uso

```bash
nb app upgrade [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a actualizar; si se omite, se utiliza el env actual |
| `--skip-code-update`, `-s` | boolean | Reiniciar utilizando el código fuente local o la imagen Docker ya guardados, sin volver a descargar la actualización |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de actualización y reinicio |

## Ejemplos

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## Comandos relacionados

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
