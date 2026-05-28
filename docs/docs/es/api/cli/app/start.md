---
title: "nb app start"
description: "Referencia del comando nb app start: inicia la aplicación NocoBase del env indicado y, en los env de Docker, vuelve a crear el contenedor de la aplicación a partir de la configuración guardada."
keywords: "nb app start,NocoBase CLI,iniciar aplicación,Docker,pm2"
---

# nb app start

Inicia la aplicación NocoBase del env indicado. Las instalaciones npm/Git ejecutan los comandos de la aplicación local; las instalaciones Docker vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env.

## Uso

```bash
nb app start [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a iniciar; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
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
nb app start --env local --verbose
nb app start --env local-docker
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

De forma predeterminada, los env locales se inician en segundo plano y los env de Docker vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env. Siempre que la CLI tenga que esperar a que la aplicación esté lista, comprobará `__health_check`: primero mostrará una línea de espera y después una línea de progreso cada 10 segundos hasta que la aplicación esté disponible o se agote el tiempo.

Si pasa `--no-daemon` para un env local, la aplicación se ejecutará en primer plano. En ese caso, la CLI no seguirá esperando la comprobación de disponibilidad después del arranque.

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
