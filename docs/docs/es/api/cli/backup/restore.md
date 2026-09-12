---
title: 'nb backup restore'
description: 'Referencia del comando nb backup restore: restaura un archivo de copia de seguridad local al env de destino.'
keywords: 'nb backup restore,NocoBase CLI,restaurar copia de seguridad,restaurar,nbdata'
---

# nb backup restore

Restaura un archivo de copia de seguridad local al env de destino. Normalmente, aquí se usa un archivo `*.nbdata`. La restauración sobrescribirá los datos de la aplicación de destino, por lo que el CLI solicita una confirmación adicional de forma predeterminada.

## Uso

```bash
nb backup restore --file <path> [flags]
```

## Parámetros

| Parámetro      | Tipo    | Descripción                                                                                                                               |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`  | string  | Nombre del env de CLI al que se restaurará; si se omite, se usa el env actual                                                             |
| `--yes`, `-y`  | boolean | Omite la confirmación interactiva cuando el env indicado explícitamente por `--env` es diferente del env actual                           |
| `--file`, `-f` | string  | Ruta del archivo de copia de seguridad local; obligatorio                                                                                 |
| `--force`      | boolean | Confirma la sobrescritura de los datos de la aplicación; debe pasarse explícitamente en terminales no interactivos y sesiones de AI agent |

## Ejemplos

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Descripción

El CLI solo comprobará si `--env` coincide con el env actual cuando pases `--env` explícitamente. Si se especifica explícitamente un env diferente, primero se pedirá confirmación en un terminal interactivo; en terminales no interactivos o en escenarios de AI agent, debes añadir `--yes` explícitamente por tu cuenta, o ejecutar primero `nb env use <name>` y volver a intentarlo.

Antes de ejecutar, el CLI comprobará primero si la ruta indicada por `--file` existe y confirmará que es un archivo normal. Si la ruta no existe o apunta a un directorio, el comando fallará directamente.

Si no se pasa `--force`, en un terminal interactivo aparecerá una segunda confirmación indicando claramente que esta restauración sobrescribirá los datos de la aplicación. En terminales no interactivos y sesiones de AI agent, si falta `--force`, el CLI rechazará la ejecución directamente y mostrará una sugerencia para volver a ejecutar que se puede copiar tal cual. Si además se trata de una operación entre distintos env, normalmente hay que pasar tanto `--yes` como `--force`.

Después de que la carga se complete correctamente, el CLI seguirá esperando a que la aplicación de destino vuelva a pasar `__health_check`. Es decir, cuando el comando finaliza correctamente, la aplicación normalmente ya se ha restaurado a un estado accesible.

## Comandos relacionados

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
