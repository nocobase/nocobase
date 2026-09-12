---
title: "nb proxy nginx reload"
description: "Recargar la configuración de Nginx con el driver actual."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Recarga la configuración de Nginx con el driver actual.

## Uso

```bash
nb proxy nginx reload
```

## Ejemplos

```bash
nb proxy nginx reload
```

## Notas

- Este comando suele usarse después de regenerar la configuración
- `reload` requiere que Nginx ya esté en ejecución; si todavía no está iniciado, usa primero `nb proxy nginx start`
- El driver local recarga el Nginx local, y el driver Docker recarga Nginx dentro del contenedor

## Comandos relacionados

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
