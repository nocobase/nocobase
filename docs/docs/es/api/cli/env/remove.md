---
title: "nb env remove"
description: "Referencia del comando nb env remove: elimina la configuración de un env de NocoBase CLI específico."
keywords: "nb env remove,NocoBase CLI,eliminar entorno,quitar configuración"
---

# nb env remove

Elimina un env configurado. Este comando solo borra la configuración del env de CLI; si necesita limpiar la aplicación local, los contenedores y el storage, utilice [`nb app down`](../app/down.md).

## Uso

```bash
nb env remove <name> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<name>` | string | Nombre del entorno a eliminar |
| `--force`, `-f` | boolean | Omite la confirmación y elimina directamente |
| `--verbose` | boolean | Muestra el progreso detallado |

## Ejemplos

```bash
nb env remove staging
nb env remove staging -f
```

## Comandos relacionados

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
