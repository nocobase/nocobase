---
title: "nb proxy caddy stop"
description: "Referência do comando nb proxy caddy stop: para o proxy Caddy com o driver atual."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Para o proxy Caddy com o driver atual.

## Uso

```bash
nb proxy caddy stop
```

## Exemplos

```bash
nb proxy caddy stop
```

## Notas

- Com o driver `local`, este comando para o processo local do Caddy
- Com o driver `docker`, este comando para o contêiner do proxy
- Se o proxy já estiver parado, o comando informará isso

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
