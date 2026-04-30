---
title: "nb app start"
description: "Referencia del comando nb app start: inicia la aplicación NocoBase o el contenedor de Docker del env indicado."
keywords: "nb app start,NocoBase CLI,iniciar aplicación,Docker,pm2"
---

# nb app start

Inicia la aplicación NocoBase del env indicado. Las instalaciones npm/Git ejecutan los comandos de la aplicación local; las instalaciones Docker inician el contenedor de aplicación guardado.

## Uso

```bash
nb app start [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a iniciar; si se omite, se utiliza el env actual |
| `--quickstart` | boolean | Inicio rápido de la aplicación |
| `--port`, `-p` | string | Sobrescribe el `appPort` de la configuración del env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Si ejecutar en modo daemon; activado por defecto |
| `--instances`, `-i` | integer | Número de instancias en ejecución |
| `--launch-mode` | string | Forma de inicio: `pm2` o `node` |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes locales o de Docker |

## Ejemplos

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
