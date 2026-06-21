---
title: "nb proxy caddy restart"
description: "Reiniciar el proxy de Caddy con el driver actual."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Reinicia el proxy de Caddy con el driver actual.

## Uso

```bash
nb proxy caddy restart
```

## Ejemplos

```bash
nb proxy caddy restart
```

## Notas

- Este comando primero detiene el proxy y luego lo vuelve a iniciar
- Con `local` o `docker`, actúa sobre el proceso local o el contenedor Docker del driver actual

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
