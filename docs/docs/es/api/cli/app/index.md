---
title: "nb app"
description: "Referencia del comando nb app: gestiona el estado de ejecución de la aplicación NocoBase, incluyendo iniciar, detener, reiniciar, registros, limpieza y actualización."
keywords: "nb app,NocoBase CLI,iniciar,detener,reiniciar,registros,actualizar"
---

# nb app

Gestiona el estado de ejecución de la aplicación NocoBase. Los env de npm/Git ejecutan los comandos de la aplicación en el directorio de código fuente local; los env de Docker gestionan el contenedor de aplicación guardado.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb app start`](./start.md) | Inicia la aplicación o el contenedor de Docker |
| [`nb app stop`](./stop.md) | Detiene la aplicación o el contenedor de Docker |
| [`nb app restart`](./restart.md) | Detiene la aplicación y, a continuación, la inicia |
| [`nb app logs`](./logs.md) | Consulta los registros de la aplicación |
| [`nb app down`](./down.md) | Detiene y limpia los recursos de ejecución locales |
| [`nb app upgrade`](./upgrade.md) | Actualiza el código fuente o la imagen y reinicia la aplicación |

## Ejemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
