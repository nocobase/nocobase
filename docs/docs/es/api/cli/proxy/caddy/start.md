---
title: "nb proxy caddy start"
description: "Iniciar el proxy de Caddy con el driver actual."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

Inicia el proxy de Caddy con el driver actual.

## Uso

```bash
nb proxy caddy start
```

## Ejemplos

```bash
nb proxy caddy start
```

## Notas

- Con el driver `local`, este comando inicia el proceso local de Caddy
- Con el driver `docker`, este comando inicia o crea el contenedor Docker
- Si el proxy ya está en ejecución, el comando lo indica

## Comandos relacionados

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
