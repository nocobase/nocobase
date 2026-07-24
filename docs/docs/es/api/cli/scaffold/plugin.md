---
title: "nb scaffold plugin"
description: "Referencia del comando nb scaffold plugin: genera el scaffolding de un plugin de NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffolding de plugin"
---

# nb scaffold plugin

Genera el código de scaffolding de un plugin de NocoBase.

## Uso

```bash
nb scaffold plugin <pkg> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<pkg>` | string | Nombre del paquete del plugin; obligatorio |
| `--cwd`, `-c` | string | Especifica la ruta del directorio raíz de la aplicación |
| `--force-recreate`, `-f` | boolean | Fuerza la recreación del scaffolding del plugin |

## Ejemplos

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Descripción

Para las source apps gestionadas por el CLI (aplicaciones creadas mediante `nb init`), el plugin se genera en el directorio `<app-path>/plugins/`; `nb` sincroniza automáticamente el plugin a `source/packages/plugins/` para el desarrollo y el flujo de compilación.

Si el plugin de destino ya existe, el comando falla por defecto. Use `--force-recreate` para forzar la recreación. Si existe un directorio o enlace simbólico externo en conflicto en el lado source, elimínelo manualmente antes de reintentar.

## Comandos relacionados

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
