---
title: "nb app stop"
description: "Referencia del comando nb app stop: detiene la aplicación NocoBase o el contenedor de Docker del env indicado."
keywords: "nb app stop,NocoBase CLI,detener aplicación,Docker"
---

# nb app stop

Detiene la aplicación NocoBase del env indicado. Las instalaciones npm/Git detienen el proceso local de la aplicación; las instalaciones Docker detienen el contenedor de aplicación guardado.

## Uso

```bash
nb app stop [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a detener; si se omite, se utiliza el env actual |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes locales o de Docker |

## Ejemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
