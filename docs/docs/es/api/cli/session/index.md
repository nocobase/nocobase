---
title: "nb session"
description: "Referencia del comando nb session: configura e inspecciona `NB_SESSION_ID` para aislar el env actual por shell o runtime de agente."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Gestiona session mode para `NB_SESSION_ID`.

Después de habilitar session mode, `nb env use` y `nb env current` usan primero el contexto actual de la shell o del runtime de agente, en lugar de compartir directamente un único current env global.

## Uso


nb session <command>

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb session setup`](./setup.md) | Instala la integración de shell o runtime para `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Muestra el id de sesión efectivo actual |
| [`nb session remove`](./remove.md) | Elimina la integración de shell o runtime para `NB_SESSION_ID` |

## Cuándo lo necesitas

La recomendación por defecto es ejecutar `nb session setup` una vez al empezar a usar la CLI. Con ello:

- terminal 1 puede usar `env1`
- terminal 2 puede usar `env2` al mismo tiempo
- un runtime de agente también puede mantener su propio current env

Sin session mode, distintas sesiones terminan compartiendo el `last env` global como respaldo, lo que hace más fácil que el trabajo en paralelo se afecte entre sí.

## Comandos relacionados

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
