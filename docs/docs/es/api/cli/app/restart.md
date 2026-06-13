---
title: "nb app restart"
description: "Referencia del comando nb app restart: reinicia la aplicación NocoBase del env indicado; cuando corresponda, la CLI primero sincroniza los plugins comerciales permitidos por la licencia actual, luego los env locales completan automáticamente la preparación de instalación o actualización durante el reinicio y, en los env de Docker, se vuelve a crear el contenedor de la aplicación a partir de la configuración guardada."
keywords: "nb app restart,NocoBase CLI,reiniciar aplicación,Docker"
---

# nb app restart

Detiene y, a continuación, inicia la aplicación NocoBase del env indicado. Cuando corresponda, la CLI primero sincroniza los plugins comerciales permitidos por la licencia actual. Después, los env locales reutilizan el flujo de `nb app stop` y `nb app start` y, de forma predeterminada, completan automáticamente la preparación de instalación o actualización antes de volver a iniciar; los env de Docker primero eliminan el contenedor actual y después vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env.

## Uso

```bash
nb app restart [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a reiniciar; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de detención e inicio |

## Ejemplos

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

De forma predeterminada, cuando corresponda, la CLI primero ejecuta `nb license plugins sync --skip-if-no-license` para sincronizar los plugins comerciales permitidos por la licencia actual. Después, los env locales completan automáticamente la preparación de instalación o actualización necesaria antes de volver a iniciar, y los env de Docker completan ese paso antes de recrear el contenedor. Siempre que la CLI tenga que esperar a que la aplicación esté lista, comprobará `__health_check`: primero mostrará una línea de espera y después una línea de progreso cada 10 segundos hasta que la aplicación esté disponible o se agote el tiempo.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
