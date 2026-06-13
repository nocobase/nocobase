---
title: 'nb app'
description: 'Referencia del comando nb app: administra el tiempo de ejecución de la aplicación NocoBase, incluidos inicio, detención, reinicio, registros y actualización.'
keywords: 'nb app,NocoBase CLI,iniciar,detener,reiniciar,registros,actualizar'
---

# nb app

Administra el tiempo de ejecución de la aplicación NocoBase. En npm/Git env, los comandos de la aplicación se ejecutan en el directorio local del código fuente; en Docker env, los contenedores de la aplicación se administran según la configuración guardada.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando                          | Descripción                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Inicia la aplicación o vuelve a crear el contenedor de Docker                            |
| [`nb app stop`](./stop.md)       | Detiene la aplicación o limpia el contenedor de Docker                                   |
| [`nb app restart`](./restart.md) | Primero detiene y luego inicia la aplicación                                             |
| [`nb app autostart`](./autostart/index.md) | Gestiona marcas de autoinicio e inicia todos los envs habilitados |
| [`nb app logs`](./logs.md)       | Ver los registros de la aplicación                                                       |
| [`nb app upgrade`](./upgrade.md) | Detiene la aplicación, reemplaza el código fuente o la imagen y luego la inicia de nuevo |

## Ejemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
