---
title: "nb proxy nginx stop"
description: "Detener el proxy de Nginx con el driver actual."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Detiene el proxy de Nginx con el driver actual.

## Uso

```bash
nb proxy nginx stop
```

## Ejemplos

```bash
nb proxy nginx stop
```

## Notas

- Con el driver `local`, este comando detiene el proceso local de Nginx
- Con el driver `docker`, este comando detiene el contenedor del proxy
- Si el proxy ya está detenido, el comando lo indica

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
