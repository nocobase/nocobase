---
title: "nb plugin"
description: "Referencia del comando nb plugin: gestiona los plugins del env de NocoBase seleccionado e importa plugins empaquetados a storage/plugins."
keywords: "nb plugin,NocoBase CLI,gestión de plugins,enable,disable,list,import"
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
| [`nb plugin import`](./import.md) | Importa un archivo de plugin empaquetado o un paquete npm |
| [`nb plugin list`](./list.md) | Lista los plugins instalados |
| [`nb plugin enable`](./enable.md) | Habilita uno o varios plugins |
| [`nb plugin disable`](./disable.md) | Deshabilita uno o varios plugins |

## Ejemplos

```bash
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
