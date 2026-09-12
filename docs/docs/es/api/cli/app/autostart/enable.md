---
title: "nb app autostart enable"
description: "Referencia de nb app autostart enable: active el inicio automático de la aplicación para un env local o Docker."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Activa la marca de inicio automático de la aplicación para un env.

Esta marca solo se aplica a envs `local` o `docker` cuyo runtime está gestionado por la CLI en la máquina actual. No inicia la aplicación de inmediato. En su lugar, añade el env al conjunto que después podrá arrancarse mediante `nb app autostart run`.

## Uso

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env de la CLI que se añadirá al autoinicio. Si se omite, se usa el env actual |
| `--yes`, `-y` | boolean | Omite la confirmación interactiva cuando un `--env` explícito apunta a un env distinto del actual |

## Ejemplos

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Notas

La CLI solo comprueba si el env de destino es distinto del env actual cuando pasas `--env` explícitamente. En terminales interactivos pedirá confirmación primero. En terminales no interactivos o flujos con agentes de IA, debes añadir `--yes` tú mismo, o cambiar antes al env objetivo con `nb env use <name>`.

Si el env objetivo no es un runtime `local` o `docker` gestionado por la CLI en la máquina actual, el comando falla y no guarda la marca de autoinicio.

## Comandos relacionados

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
