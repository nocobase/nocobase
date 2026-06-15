---
title: "nb proxy caddy reload"
description: "Recargar la configuración de Caddy con el driver actual."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Recarga la configuración de Caddy con el driver actual.

## Uso

```bash
nb proxy caddy reload
```

## Ejemplos

```bash
nb proxy caddy reload
```

## Notas

- Este comando suele usarse después de regenerar la configuración
- `reload` requiere que Caddy ya esté en ejecución; si todavía no está iniciado, usa primero `nb proxy caddy start`
- El driver local recarga el Caddy local, y el driver Docker recarga Caddy dentro del contenedor

## Comandos relacionados

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
