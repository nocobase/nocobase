---
title: "nb plugin"
description: "Referencia del comando nb plugin: gestiona los plugins del env de NocoBase seleccionado."
keywords: "nb plugin,NocoBase CLI,gestión de plugins,enable,disable,list"
---

# nb plugin

Gestiona los plugins del env de NocoBase seleccionado. Los env npm/Git ejecutan los comandos de plugin localmente, los env Docker los ejecutan en el contenedor de la aplicación guardado y los env HTTP recurren a la API cuando esté disponible.

## Uso

```bash
nb plugin <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb plugin list`](./list.md) | Lista los plugins instalados |
| [`nb plugin enable`](./enable.md) | Habilita uno o varios plugins |
| [`nb plugin disable`](./disable.md) | Deshabilita uno o varios plugins |

## Ejemplos

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
