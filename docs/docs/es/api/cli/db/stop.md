---
title: 'nb db stop'
description: 'Referencia del comando nb db stop: detiene el contenedor de base de datos integrado del env especificado.'
keywords: 'nb db stop,NocoBase CLI,detener base de datos,Docker'
---

# nb db stop

Detiene el contenedor de base de datos integrado del env especificado. Este comando solo se aplica a los entornos con la base de datos integrada administrada por CLI habilitada.

## Uso

```bash
nb db stop [flags]
```

## Parámetros

| Parámetro     | Tipo    | Descripción                                                                                           |
| ------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nombre del env de CLI cuya base de datos integrada se debe detener; si se omite, se usa el env actual |
| `--verbose`   | boolean | Muestra la salida del comando Docker subyacente                                                       |

## Ejemplos

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
