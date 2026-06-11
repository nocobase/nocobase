---
title: "nb license plugins"
description: "Referência do comando nb license plugins: inspecionar ou sincronizar plugins comerciais permitidos pela licença atual."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Inspeciona ou sincroniza plugins comerciais permitidos pela licença atual.

## Uso

```bash
nb license plugins <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb license plugins list`](./list.md) | Exibir plugins comerciais associados à licença atual |
| [`nb license plugins sync`](./sync.md) | Sincronizar plugins comerciais permitidos pela licença atual |
| [`nb license plugins clean`](./clean.md) | Remover plugins comerciais baixados para o env atual |

## Exemplos

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Comandos relacionados

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
