---
title: "nb db stop"
description: "Referencia del comando nb db stop: detiene el contenedor de la base de datos integrada del env indicado."
keywords: "nb db stop,NocoBase CLI,detener base de datos,Docker"
---

# nb db stop

Detiene el contenedor de la base de datos integrada del env indicado. Este comando solo es aplicable a los env con la base de datos integrada gestionada por el CLI habilitada.

## Uso

```bash
nb db stop [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI cuya base de datos integrada se detiene; si se omite, se utiliza el env actual |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de Docker |

## Ejemplos

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
