---
title: "nb proxy caddy info"
description: "Referência do comando nb proxy caddy info: mostra o driver atual do provider Caddy, os caminhos de configuração e os detalhes de runtime."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,caminhos,configuração"
---

# nb proxy caddy info

Mostra o driver atual do provider Caddy, os caminhos de configuração e os detalhes de runtime.

## Uso

```bash
nb proxy caddy info
```

## Saída

A saída normalmente inclui estes campos:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` ou `container`
- `image`

Onde:

- com o driver `local`, a saída mostra `caddyBinary`
- com o driver `docker`, a saída mostra `container` e `image`

## Exemplos

```bash
nb proxy caddy info
```

## Comandos relacionados

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
