---
title: "nb app logs"
description: "Referencia del comando nb app logs: consulta los registros de la aplicación NocoBase del env indicado."
keywords: "nb app logs,NocoBase CLI,registros de aplicación,Docker logs,pm2 logs"
---

# nb app logs

Consulta los registros de la aplicación. Las instalaciones npm/Git leen los registros de pm2; las instalaciones Docker leen los registros del contenedor de Docker.

## Uso

```bash
nb app logs [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI cuyos registros se consultan; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--tail` | integer | Número de líneas recientes que se muestran antes de seguir los registros; por defecto `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Si seguir los nuevos registros de forma continua |

## Ejemplos

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
