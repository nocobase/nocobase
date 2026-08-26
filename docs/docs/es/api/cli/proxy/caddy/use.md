---
title: "nb proxy caddy use"
description: "Cambiar el driver actual del proveedor Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Cambia el driver actual del proveedor Caddy.

## Uso

```bash
nb proxy caddy use <driver>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<driver>` | string | Admite `local` o `docker` |

## Ejemplos

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Notas

- Este comando guarda el resultado en `proxy.caddy-driver`
- Los comandos posteriores como `start`, `reload`, `stop`, `status` e `info` usan el driver actual

## Comandos relacionados

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
