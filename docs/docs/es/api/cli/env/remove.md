---
title: 'nb env remove'
description: 'Referencia del comando nb env remove: detiene los entornos de ejecución gestionados antes de eliminar la configuración del env, o limpia por completo los recursos locales gestionados cuando sea necesario.'
keywords: 'nb env remove,NocoBase CLI,eliminar entorno,eliminar configuración,purge'
---

# nb env remove

Elimina un env configurado. Para los env local/docker, este comando primero detiene el entorno de ejecución de la aplicación y el entorno de ejecución de la base de datos integrada gestionados por la CLI en la máquina actual, y luego elimina la configuración guardada del env de la CLI. Para los env http/ssh, este comando solo elimina la configuración guardada del env de la CLI.

Si el env eliminado es el env actual, la CLI seleccionará automáticamente un nuevo env actual entre los env restantes; si ya no hay ningún env disponible, el env actual se borrará.

De forma predeterminada, el comando requiere confirmación. En modo no interactivo, debes pasar explícitamente `--force` para ejecutarlo.

Si necesitas limpiar en la mayor medida posible los recursos gestionados por la CLI en la máquina actual, puedes pasar `--purge`. Para los env local/docker, `--purge` también limpia los recursos de ejecución gestionados, los datos de storage y, cuando corresponda, los archivos de la app local descargados; para los env http/ssh, `--purge` no afecta a servicios externos y solo elimina la configuración guardada del env de la CLI.

## Uso

```bash
nb env remove <name> [flags]
```

## Parámetros

| Parámetro       | Tipo    | Descripción                                                                                                                                                                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Nombre del entorno configurado que se va a eliminar                                                                                                                                                                                      |
| `--force`, `-f` | boolean | Omite la confirmación en el modo remove actual; obligatorio en modo no interactivo                                                                                                                                                       |
| `--purge`       | boolean | Limpia además los recursos gestionados por la CLI, los datos de storage y, cuando corresponda, los archivos de la app local descargados en la máquina actual; para los env de API remota, solo elimina la configuración guardada del env |
| `--verbose`     | boolean | Muestra el progreso detallado                                                                                                                                                                                                            |

## Ejemplos

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Comandos relacionados

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
