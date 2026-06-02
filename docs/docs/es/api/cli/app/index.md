---
title: "nb app"
description: "Referencia del comando nb app: gestiona el estado de ejecución de la aplicación NocoBase, incluyendo iniciar, detener, reiniciar, registros, limpieza y actualización."
keywords: "nb app,NocoBase CLI,iniciar,detener,reiniciar,registros,actualizar"
---

# nb app

Gestiona el estado de ejecución de la aplicación NocoBase. Los env de npm/Git ejecutan los comandos de la aplicación en el directorio de código fuente local; los env de Docker gestionan los contenedores de la aplicación a partir de la configuración guardada del env.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb app start`](./start.md) | Inicia la aplicación o vuelve a crear el contenedor de Docker |
| [`nb app stop`](./stop.md) | Detiene la aplicación o elimina el contenedor de Docker |
| [`nb app restart`](./restart.md) | Detiene la aplicación y, a continuación, la inicia |
| [`nb app logs`](./logs.md) | Consulta los registros de la aplicación |
| [`nb app down`](./down.md) | Detiene y limpia los recursos de ejecución locales |
| [`nb app destroy`](./destroy.md) | Elimina los recursos de runtime gestionados, los datos de storage y la configuración guardada del env |
| [`nb app upgrade`](./upgrade.md) | Detiene la aplicación, reemplaza el código fuente o la imagen y vuelve a iniciarla |

## Ejemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app down --env app1 --all --force
nb app destroy --env app1 --force
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
