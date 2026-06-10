---
title: "nb proxy caddy restart"
description: "Referência do comando nb proxy caddy restart: reinicia o proxy Caddy com o driver atual."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Reinicia o proxy Caddy com o driver atual.

## Uso

```bash
nb proxy caddy restart
```

## Exemplos

```bash
nb proxy caddy restart
```

## Notas

- Este comando primeiro para o proxy e depois o inicia novamente
- Com `local` ou `docker`, ele atua sobre o processo local ou sobre o contêiner Docker do driver atual

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
