---
title: "nb license"
description: "Referencia del comando nb license: gestionar las licencias comerciales y los plugins licenciados de NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Gestiona las licencias comerciales de NocoBase, incluida la activación con una license key existente, los Instance ID, el estado de la licencia y los plugins licenciados.

## Uso

```bash
nb license <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb license activate`](./activate.md) | Activar la licencia comercial del env actual con una license key existente |
| [`nb license id`](./id.md) | Mostrar o generar el ID de instancia del env actual |
| [`nb license status`](./status.md) | Mostrar el estado de la licencia comercial del env actual |
| [`nb license plugins`](./plugins/index.md) | Gestionar los plugins comerciales permitidos por la licencia actual |

## Ejemplos

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Comandos relacionados

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
