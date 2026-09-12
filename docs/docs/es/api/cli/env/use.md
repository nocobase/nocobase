---
title: "nb env use"
description: "Referencia del comando nb env use: cambia el env actual de NocoBase CLI."
keywords: "nb env use,NocoBase CLI,cambiar entorno,current env"
---

# nb env use

Cambia el env actual de la CLI. A partir de ese momento, los comandos que omitan `--env` utilizarán este env por defecto.

Cuando session mode está habilitado para la shell o el runtime actual, este cambio solo afecta a la sesión actual.

Cuando session mode no está habilitado, esto vuelve a actualizar el `last env` global. En ese caso, también pueden verse afectados otros terminales o runtimes de agente sin aislamiento de sesión.

## Uso

```bash
nb env use <name>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<name>` | string | Nombre del entorno configurado al que se cambiará |

## Ejemplos

```bash
nb env use local
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
