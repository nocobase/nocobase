---
title: "nb env list"
description: "Referencia del comando nb env list: lista los env configurados de NocoBase CLI."
keywords: "nb env list,NocoBase CLI,lista de entornos,API Base URL"
---

# nb env list

Lista todos los env configurados.

Este comando solo muestra la configuración guardada. Usa [`nb env status`](./status.md) cuando quieras revisar el estado.

## Uso


nb env list

## Salida

La tabla de salida incluye el marcador del entorno actual, nombre, tipo, `API Base URL`, tipo de autenticación y versión de runtime.

- `Current` marca con `*` el env actualmente efectivo
- `API Base URL` muestra la dirección API guardada
- `Runtime` muestra la información de versión de runtime en caché

## Ejemplos


nb env list

## Comandos relacionados

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
