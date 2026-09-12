---
title: 'nb backup'
description: 'Referencia del comando nb backup: crea una copia de seguridad de NocoBase y la descarga localmente, o restaura un archivo de copia de seguridad local al env de destino.'
keywords: 'nb backup,NocoBase CLI,copia de seguridad,restaurar,nbdata'
---

# nb backup

Crea o restaura una copia de seguridad de NocoBase. `nb backup create` crea una copia de seguridad remota en el env de destino y luego descarga el archivo de copia de seguridad localmente; `nb backup restore` sube un archivo de copia de seguridad local al env de destino y espera a que la aplicación vuelva a estar lista.

## Uso

```bash
nb backup <command>
```

## Subcomandos

| Comando                             | Descripción                                                        |
| ----------------------------------- | ------------------------------------------------------------------ |
| [`nb backup create`](./create.md)   | Crear una copia de seguridad y descargarla localmente              |
| [`nb backup restore`](./restore.md) | Restaurar un archivo de copia de seguridad local al env de destino |

## Ejemplos

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Descripción

Antes de ejecutarse, la CLI primero comprueba si el env de destino expone los comandos de tiempo de ejecución relacionados con copias de seguridad. Si faltan comandos, actualiza automáticamente la caché de runtime una vez; si después de la actualización sigue faltando la capacidad `nb api backup ...`, significa que el env de destino aún no ha habilitado o sincronizado la capacidad de backup/restore, y en ese caso primero debes ocuparte de la propia aplicación de destino.

En concreto:

- `nb backup create` depende de `nb api backup create`, `nb api backup status` y `nb api backup download`
- `nb backup restore` depende de `nb api backup restore-upload`

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
