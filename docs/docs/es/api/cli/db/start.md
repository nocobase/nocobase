---
title: "nb db start"
description: "Referencia del comando nb db start: inicia el contenedor de la base de datos integrada del env indicado."
keywords: "nb db start,NocoBase CLI,iniciar base de datos,Docker"
---

# nb db start

Inicia el contenedor de la base de datos integrada del env indicado. Este comando solo es aplicable a los env con la base de datos integrada gestionada por el CLI habilitada.

## Uso

```bash
nb db start [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI cuya base de datos integrada se inicia; si se omite, se utiliza el env actual |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de Docker |

## Ejemplos

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Comandos relacionados

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
