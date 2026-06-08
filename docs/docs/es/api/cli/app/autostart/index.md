---
title: "nb app autostart"
description: "Referencia del grupo de comandos nb app autostart: active o desactive el inicio automático para envs locales o Docker e inicie todos los envs habilitados de una vez."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Gestiona la configuración de inicio automático de la aplicación.

Este grupo de comandos cubre dos tipos de trabajo:

- activar o desactivar la marca de autoinicio para un env
- iniciar todos los envs que ya tienen autoinicio habilitado

`nb app autostart` solo se aplica a envs con un runtime gestionado por la CLI en la máquina actual, es decir, `local` y `docker`. Si un env es solo una conexión remota a la API, o no es un runtime de aplicación gestionado por la CLI que pueda iniciarse en esta máquina, no puede formar parte de este flujo de autoinicio.

## Uso

```bash
nb app autostart <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Activa la marca de autoinicio para un env |
| [`nb app autostart disable`](./disable.md) | Desactiva la marca de autoinicio para un env |
| [`nb app autostart list`](./list.md) | Muestra el estado de autoinicio de todos los envs |
| [`nb app autostart run`](./run.md) | Inicia todos los envs que tienen autoinicio habilitado |

## Notas

`nb app autostart enable` solo marca un env como permitido para iniciarse automáticamente. No lo integra por sí mismo en el flujo de arranque del sistema. En una configuración real de producción, normalmente todavía necesitas llamar a `nb app autostart run` desde tu propio mecanismo de inicio del host, como `systemd`, un script de arranque de la plataforma de contenedores u otro proceso de arranque que ya uses.

Además, `nb app autostart run` comprueba cada env habilitado uno por uno. Los envs que pueden iniciarse continúan internamente con `nb app start --env <name> --yes`. Los envs que no deberían iniciarse automáticamente en la máquina actual aparecen como `skipped` o `failed` en la tabla de resultados.

## Ejemplos

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Comandos relacionados

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
