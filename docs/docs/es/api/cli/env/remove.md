---
title: "nb env remove"
description: "Referencia del comando nb env remove: detiene el runtime gestionado antes de quitar la configuración del env, o limpia recursos locales del CLI cuando sea necesario."
keywords: "nb env remove,NocoBase CLI,eliminar entorno,quitar configuración,purge"
---

# nb env remove

Elimina un env configurado. Para los env locales y Docker, este comando primero detiene el runtime de la aplicación y la base de datos integrada gestionados por la CLI en esta máquina, y después elimina la configuración guardada del env. Para los env HTTP y SSH, solo elimina la configuración guardada del env.

Si el env eliminado también es el env actual, la CLI selecciona automáticamente un nuevo env actual entre los env restantes. Si no quedan env, el env actual se limpia.

De forma predeterminada, el comando solicita confirmación. En modo no interactivo, `--force` es obligatorio antes de ejecutar el comando.

Pase `--purge` para limpiar también los recursos gestionados por la CLI en esta máquina. Para los env locales y Docker, `--purge` realiza la misma limpieza que [`nb app destroy`](../app/destroy.md). Para los env HTTP y SSH, `--purge` no toca servicios externos y solo elimina la configuración guardada del env.

## Uso

```bash
nb env remove <name> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<name>` | string | Nombre del entorno configurado que se va a eliminar |
| `--force`, `-f` | boolean | Omite la confirmación del modo de eliminación seleccionado; obligatorio en modo no interactivo |
| `--purge` | boolean | Elimina también los recursos locales gestionados por la CLI, los datos de storage y, cuando corresponda, los archivos locales descargados de la app. Para envs de API remota, solo se elimina la configuración guardada del env |
| `--verbose` | boolean | Muestra el progreso detallado |

## Ejemplos

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Comandos relacionados

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
