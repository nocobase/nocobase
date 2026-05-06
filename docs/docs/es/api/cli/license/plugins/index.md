---
title: "nb license plugins"
description: "Referencia del comando nb license plugins: consultar o sincronizar los plugins comerciales permitidos por la licencia actual."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Consulta o sincroniza los plugins comerciales permitidos por la licencia actual.

## Uso

```bash
nb license plugins <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb license plugins list`](./list.md) | Mostrar los plugins comerciales asociados a la licencia actual |
| [`nb license plugins sync`](./sync.md) | Sincronizar los plugins comerciales permitidos por la licencia actual |
| [`nb license plugins clean`](./clean.md) | Eliminar los plugins comerciales descargados del env actual |

## Ejemplos

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Comandos relacionados

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
