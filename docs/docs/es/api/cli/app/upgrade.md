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
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--skip-code-update`, `-s` | boolean | Reiniciar utilizando el código fuente local o la imagen Docker ya guardados, sin volver a descargar la actualización |
| `--version` | string | Sobrescribe la `downloadVersion` guardada; cuando la actualización tiene éxito, la nueva versión se guarda de nuevo en la configuración de la env |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de actualización y reinicio |

## Ejemplos

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
