---
title: "nb proxy nginx use"
description: "Cambiar el driver actual del proveedor Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Cambia el driver actual del proveedor Nginx.

## Uso

```bash
nb proxy nginx use <driver>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<driver>` | string | Admite `local` o `docker` |

## Ejemplos

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Notas

- Este comando guarda el resultado en `proxy.nginx-driver`
- Los comandos posteriores como `start`, `reload`, `stop`, `status` e `info` usan el driver actual

## Comandos relacionados

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
