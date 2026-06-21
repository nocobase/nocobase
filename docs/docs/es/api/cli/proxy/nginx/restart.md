---
title: "nb proxy nginx restart"
description: "Reiniciar el proxy de Nginx con el driver actual."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Reinicia el proxy de Nginx con el driver actual.

## Uso

```bash
nb proxy nginx restart
```

## Ejemplos

```bash
nb proxy nginx restart
```

## Notas

- Este comando primero detiene el proxy y luego lo vuelve a iniciar
- Con `local` o `docker`, actúa sobre el proceso local o el contenedor Docker del driver actual

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
