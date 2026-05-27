---
title: "nb app upgrade"
description: "Referencia del comando nb app upgrade: detiene la aplicación, reemplaza el código fuente o la imagen guardados y vuelve a iniciar la aplicación NocoBase indicada."
keywords: "nb app upgrade,NocoBase CLI,actualización,actualizar,imagen Docker"
---

# nb app upgrade

Actualiza la aplicación NocoBase indicada. La CLI detiene primero la aplicación actual, reemplaza por defecto el código fuente o la imagen guardados, sincroniza los plugins comerciales, vuelve a iniciar la aplicación con quickstart y al final actualiza el runtime del env. Los env de Docker vuelven a crear el contenedor de la aplicación a partir de la configuración guardada del env durante el arranque.

## Uso

```bash
nb app upgrade [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a actualizar; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--force`, `-f` | boolean | Omite la confirmación de la actualización. Es obligatorio pasarlo explícitamente en terminales no interactivos y en sesiones de agentes de IA |
| `--skip-download`, `-s` | boolean | Reinicia usando el código fuente local o la imagen Docker guardados actualmente sin descargar actualizaciones antes; también omite `nb license plugins sync` |
| `--version` | string | Sobrescribe la versión de destino para esta actualización; cuando tiene éxito, la nueva versión se vuelve a guardar en `downloadVersion` dentro de la configuración del env |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de actualización y reinicio |

## Ejemplos

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

Antes de que comience la actualización real, los terminales interactivos también pedirán una confirmación adicional de la actualización, a menos que pase `--force`. En terminales no interactivos y en sesiones de agentes de IA, `nb app upgrade` se negará a continuar sin `--force` y mostrará un comando reutilizable que puede copiar directamente. Si además es una operación cross-env, necesitará tanto `--yes` como `--force`.

De forma predeterminada, `nb app upgrade` ejecuta estos pasos:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start --quickstart`
5. Guarda la nueva `downloadVersion` cuando haga falta
6. `nb env update`

Cuando se pasa `--skip-download`, la CLI omite los pasos 2 y 3 y reinicia directamente el código fuente o la imagen guardados actualmente. Si también se pasa `--version`, la CLI no descargará esa versión en esta ejecución; en su lugar, solo la guardará como nueva `downloadVersion` después de un reinicio correcto para que futuras actualizaciones puedan usarla.

El paso 4 espera a que la aplicación pase `__health_check`. Durante esta espera, la CLI muestra primero una línea de espera y luego una línea de progreso cada 10 segundos hasta que la aplicación esté lista o se agote el tiempo de espera del health check.

Si el último paso `nb env update` falla, la actualización seguirá considerándose correcta. La CLI mostrará una advertencia y le pedirá que ejecute `nb env update <envName>` manualmente después.

## Comandos relacionados

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
