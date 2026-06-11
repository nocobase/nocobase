---
title: "nb app autostart disable"
description: "Referencia de nb app autostart disable: desactive el inicio automático de la aplicación para un env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Desactiva la marca de inicio automático de la aplicación para un env.

Después de desactivarla, ese env ya no participará en `nb app autostart run`. Este comando no detiene por sí mismo una aplicación que ya esté en ejecución. Si también quieres detener el runtime actual, usa `nb app stop` por separado.

## Uso

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env de la CLI que se quitará del autoinicio. Si se omite, se usa el env actual |
| `--yes`, `-y` | boolean | Omite la confirmación interactiva cuando un `--env` explícito apunta a un env distinto del actual |

## Ejemplos

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Notas

Este comando solo cambia la marca de autoinicio guardada. No detiene directamente la aplicación. Si un env ya no tenía autoinicio habilitado, seguirá en estado deshabilitado.

Igual que con `enable`, la CLI solo comprueba una confirmación entre envs cuando pasas `--env` explícitamente. En terminales no interactivos o flujos con agentes de IA, añade `--yes` tú mismo cuando haga falta.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
