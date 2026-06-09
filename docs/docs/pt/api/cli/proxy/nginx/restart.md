---
title: "nb proxy nginx restart"
description: "Referência do comando nb proxy nginx restart: reinicia o proxy Nginx com o driver atual."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Reinicia o proxy Nginx com o driver atual.

## Uso

```bash
nb proxy nginx restart
```

## Exemplos

```bash
nb proxy nginx restart
```

## Notas

- Este comando primeiro para o proxy e depois o inicia novamente
- Com `local` ou `docker`, ele atua sobre o processo local ou sobre o contêiner Docker do driver atual

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
