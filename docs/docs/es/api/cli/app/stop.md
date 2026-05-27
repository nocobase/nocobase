---
title: "nb app stop"
description: "Referencia del comando nb app stop: detiene la aplicación NocoBase del env indicado y, en los env de Docker, elimina el contenedor de la aplicación."
keywords: "nb app stop,NocoBase CLI,detener aplicación,Docker"
---

# nb app stop

Detiene la aplicación NocoBase del env indicado. Las instalaciones npm/Git detienen el proceso local de la aplicación; las instalaciones Docker eliminan el contenedor de aplicación guardado.

## Uso

```bash
nb app stop [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a detener; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes locales o de Docker |

## Ejemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
