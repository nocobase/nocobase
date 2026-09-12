---
title: "nb proxy caddy stop"
description: "Detener el proxy de Caddy con el driver actual."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Detiene el proxy de Caddy con el driver actual.

## Uso

```bash
nb proxy caddy stop
```

## Ejemplos

```bash
nb proxy caddy stop
```

## Notas

- Con el driver `local`, este comando detiene el proceso local de Caddy
- Con el driver `docker`, este comando detiene el contenedor del proxy
- Si el proxy ya está detenido, el comando lo indica

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
