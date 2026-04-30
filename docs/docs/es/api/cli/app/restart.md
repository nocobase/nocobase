---
title: "nb app restart"
description: "Referencia del comando nb app restart: reinicia la aplicación NocoBase o el contenedor de Docker del env indicado."
keywords: "nb app restart,NocoBase CLI,reiniciar aplicación,Docker"
---

# nb app restart

Detiene y, a continuación, inicia la aplicación NocoBase del env indicado.

## Uso

```bash
nb app restart [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a reiniciar; si se omite, se utiliza el env actual |
| `--quickstart` | boolean | Iniciar rápidamente la aplicación tras la detención |
| `--port`, `-p` | string | Sobrescribe el `appPort` de la configuración del env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Si ejecutar en modo daemon tras la detención; activado por defecto |
| `--instances`, `-i` | integer | Número de instancias en ejecución tras la detención |
| `--launch-mode` | string | Forma de inicio: `pm2` o `node` |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de detención e inicio |

## Ejemplos

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
