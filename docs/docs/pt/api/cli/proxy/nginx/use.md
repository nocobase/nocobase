---
title: "nb proxy nginx use"
description: "Referência do comando nb proxy nginx use: alterna o driver atual do provider Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Alterna o driver atual do provider Nginx.

## Uso

```bash
nb proxy nginx use <driver>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<driver>` | string | Aceita `local` ou `docker` |

## Exemplos

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Notas

- Este comando salva o resultado em `proxy.nginx-driver`
- Comandos posteriores como `start`, `reload`, `stop`, `status` e `info` passam a usar o driver atual

## Comandos relacionados

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
