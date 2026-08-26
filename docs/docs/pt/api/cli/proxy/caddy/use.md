---
title: "nb proxy caddy use"
description: "Referência do comando nb proxy caddy use: alterna o driver atual do provider Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Alterna o driver atual do provider Caddy.

## Uso

```bash
nb proxy caddy use <driver>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<driver>` | string | Aceita `local` ou `docker` |

## Exemplos

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Notas

- Este comando salva o resultado em `proxy.caddy-driver`
- Comandos posteriores como `start`, `reload`, `stop`, `status` e `info` passam a usar o driver atual

## Comandos relacionados

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
