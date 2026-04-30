---
title: "nb db"
description: "Referencia del comando nb db: consulta o gestiona el estado de ejecución de la base de datos integrada del env seleccionado."
keywords: "nb db,NocoBase CLI,base de datos integrada,Docker,estado de la base de datos"
---

# nb db

Consulta o gestiona la base de datos integrada gestionada por el CLI. Para los env que no disponen de un contenedor de base de datos gestionado por el CLI, `nb db ps` también muestra estados como `external` o `remote`.

## Uso

```bash
nb db <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb db ps`](./ps.md) | Consultar el estado de ejecución de la base de datos integrada |
| [`nb db start`](./start.md) | Iniciar el contenedor de la base de datos integrada |
| [`nb db stop`](./stop.md) | Detener el contenedor de la base de datos integrada |
| [`nb db logs`](./logs.md) | Consultar los registros del contenedor de la base de datos integrada |

## Ejemplos

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
