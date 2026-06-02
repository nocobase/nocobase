---
title: "nb app destroy"
description: "Referencia del comando nb app destroy: elimina los recursos de runtime gestionados, los datos de storage y la configuración guardada del env para un env seleccionado."
keywords: "nb app destroy,NocoBase CLI,destruir env,limpieza,eliminar storage"
---

# nb app destroy

Destruye un env seleccionado eliminando los recursos de runtime gestionados, los datos de storage y la configuración guardada del env de la CLI.

Para los env locales y Docker, el comando primero elimina los recursos de runtime de la aplicación gestionados en esta máquina, elimina también el runtime de la base de datos integrada cuando existe, borra los datos de storage y, por último, elimina la configuración guardada del env de la CLI. Para los env HTTP y SSH, solo elimina la configuración guardada del env de la CLI y no toca servicios externos.

Para los env locales descargados de npm/Git, el comando también elimina los archivos locales de la aplicación gestionados por la CLI. Para rutas locales personalizadas de la app, conserva los archivos del código fuente local y solo elimina los recursos de runtime gestionados, los datos de storage y la configuración guardada del env.

De forma predeterminada, el comando solicita confirmación. En modo no interactivo, debe pasar explícitamente `--env` y `--force`.

## Uso

```bash
nb app destroy [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env de la CLI que se va a destruir; en modo interactivo, si se omite se usa el env actual |
| `--force`, `-f` | boolean | Omite la confirmación y destruye inmediatamente el env seleccionado; obligatorio en modo no interactivo |
| `--verbose` | boolean | Muestra la salida sin procesar de los comandos de destrucción |

## Ejemplos

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
