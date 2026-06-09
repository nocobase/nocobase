---
title: "nb proxy nginx start"
description: "Iniciar el proxy de Nginx con el driver actual."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Inicia el proxy de Nginx con el driver actual.

## Uso

```bash
nb proxy nginx start
```

## Ejemplos

```bash
nb proxy nginx start
```

## Notas

- Con el driver `local`, este comando inicia el proceso local de Nginx
- Con el driver `docker`, este comando inicia o crea el contenedor Docker
- Si el proxy ya está en ejecución, el comando lo indica

## Comandos relacionados

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
