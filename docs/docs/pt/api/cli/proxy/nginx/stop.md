---
title: "nb proxy nginx stop"
description: "Referência do comando nb proxy nginx stop: para o proxy Nginx com o driver atual."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Para o proxy Nginx com o driver atual.

## Uso

```bash
nb proxy nginx stop
```

## Exemplos

```bash
nb proxy nginx stop
```

## Notas

- Com o driver `local`, este comando para o processo local do Nginx
- Com o driver `docker`, este comando para o contêiner do proxy
- Se o proxy já estiver parado, o comando informará isso

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
