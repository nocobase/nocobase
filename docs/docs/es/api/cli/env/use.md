---
title: "nb env use"
description: "Referencia del comando nb env use: cambia el env actual de NocoBase CLI."
keywords: "nb env use,NocoBase CLI,cambiar entorno,current env"
---

# nb env use

Cambia el env actual de la CLI. A partir de ese momento, los comandos que omitan `--env` utilizarán este env por defecto.

## Uso

```bash
nb env use <name>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<name>` | string | Nombre de un entorno ya configurado |

## Ejemplos

```bash
nb env use local
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
