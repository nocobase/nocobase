---
title: "nb proxy nginx start"
description: "Referência do comando nb proxy nginx start: inicia o proxy Nginx com o driver atual."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Inicia o proxy Nginx com o driver atual.

## Uso

```bash
nb proxy nginx start
```

## Exemplos

```bash
nb proxy nginx start
```

## Notas

- Com o driver `local`, este comando inicia o processo local do Nginx
- Com o driver `docker`, este comando inicia ou cria o contêiner Docker
- Se o proxy já estiver em execução, o comando informará isso

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
