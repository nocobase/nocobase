---
title: "nb app autostart run"
description: "Referencia de nb app autostart run: inicia todos los envs que tienen habilitado el inicio automático de la aplicación."
keywords: "nb app autostart run,NocoBase CLI,autostart,inicio por lotes"
---

# nb app autostart run

Inicia todos los envs que tienen habilitado el inicio automático de la aplicación.

Este comando suele llamarse después de que el sistema host arranca, mediante tu propio mecanismo de inicio. La CLI lee todos los envs guardados, filtra los que tienen autoinicio habilitado e intenta iniciarlos uno por uno.

## Uso

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Tipo | Descripción |
| --- | --- | --- |
| `--verbose` | boolean | Muestra la salida de arranque sin procesar de los comandos locales o Docker subyacentes |

## Ejemplos

```bash
nb app autostart run
nb app autostart run --verbose
```

## Notas

Si ningún env tiene autoinicio habilitado, el comando imprime `No environments have app autostart enabled.`.

Durante la ejecución, la CLI procesa cada env habilitado uno por uno:

- los envs que pueden iniciarse aparecen como `started`
- los envs que no deberían iniciarse automáticamente en la máquina actual aparecen como `skipped`
- los envs que fallan durante el arranque aparecen como `failed`

Internamente, este comando llama a `nb app start --env <name> --yes`. Si pasas `--verbose`, esa opción también se reenvía al flujo subyacente de arranque.

Si algún resultado es `failed`, el comando termina con error e imprime `Some app autostart envs failed to start.`. Así, los fallos quedan visibles en `systemd`, CI u otros mecanismos de inicio del host.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
