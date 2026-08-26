---
title: "nb app autostart list"
description: "Referencia de nb app autostart list: muestra el estado de autoinicio de todos los envs configurados."
keywords: "nb app autostart list,NocoBase CLI,autostart,lista de envs"
---

# nb app autostart list

Muestra el estado de autoinicio de todos los envs configurados.

La tabla de salida incluye:

- `Current`: marca el env actual con `*`
- `Env`: nombre del env
- `Kind`: tipo de env
- `Source`: tipo de instalación o fuente
- `Autostart`: si el autoinicio está habilitado

## Uso

```bash
nb app autostart list
```

## Ejemplo

```bash
nb app autostart list
```

## Notas

Si aún no hay ningún env guardado, el comando imprime `No environments are configured.`.

Este comando solo muestra el estado guardado en la CLI. No comprueba si una aplicación ya está en ejecución, ni si el flujo de arranque de tu sistema ya llama a `nb app autostart run`. Su propósito principal es mostrar qué envs están marcados para autoinicio en la configuración de la CLI.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
