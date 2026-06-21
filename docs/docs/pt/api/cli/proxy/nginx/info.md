---
title: "nb proxy nginx info"
description: "Referência do comando nb proxy nginx info: mostra o driver atual do provider Nginx, os caminhos de configuração e os detalhes de runtime."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,caminhos,configuração"
---

# nb proxy nginx info

Mostra o driver atual do provider Nginx, os caminhos de configuração e os detalhes de runtime.

## Uso

```bash
nb proxy nginx info
```

## Saída

A saída normalmente inclui estes campos:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` ou `container`
- `image`

Onde:

- com o driver `local`, a saída mostra `nginxBinary`
- com o driver `docker`, a saída mostra `container` e `image`

## Exemplos

```bash
nb proxy nginx info
```

## Comandos relacionados

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
