---
title: "nb app start"
description: "Referencia del comando nb app start: inicia la aplicación NocoBase del env indicado; cuando corresponda, la CLI primero sincroniza los plugins comerciales permitidos por la licencia actual, luego los env locales completan automáticamente la preparación de instalación o actualización antes del arranque y, en los env de Docker, se vuelve a crear el contenedor de la aplicación a partir de la configuración guardada."
keywords: "nb app start,NocoBase CLI,iniciar aplicación,Docker,pm2"
---

# nb app start

Inicia la aplicación NocoBase del env indicado. Cuando corresponda, la CLI primero sincroniza los plugins comerciales permitidos por la licencia actual. Después, las instalaciones npm/Git completan automáticamente la preparación de instalación o actualización antes de ejecutar los comandos de la aplicación local; las instalaciones Docker vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env.

## Uso

```bash
nb app start [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a iniciar; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes locales o de Docker |

## Ejemplos

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

De forma predeterminada, cuando corresponda, la CLI primero ejecuta `nb license plugins sync --skip-if-no-license` para sincronizar los plugins comerciales permitidos por la licencia actual. Después, los env locales completan automáticamente la preparación de instalación o actualización necesaria antes de iniciarse en segundo plano, y los env de Docker vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env. Siempre que la CLI tenga que esperar a que la aplicación esté lista, comprobará `__health_check`: primero mostrará una línea de espera y después una línea de progreso cada 10 segundos hasta que la aplicación esté disponible o se agote el tiempo.

## Scripts hook

Si el env actual guardó un hook con `nb init --hook-script`, `nb app start` ejecuta `afterAppStart(context)` después de que la app arranca realmente y supera `__health_check`. Los env instalados usan `context.phase = 'app-start'` y `context.command = 'app:start'`. Si la app ya está en ejecución, este comando no ejecuta el hook.

Para env preparados creados con `--prepare-only`, el primer `nb app start` ejecuta primero `beforeAppInstall(context)`, completa la primera instalación y el arranque, y luego ejecuta `afterAppStart(context)`. Ambos hooks reciben `context.phase = 'init'` y `context.command = 'app:start'`.

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
