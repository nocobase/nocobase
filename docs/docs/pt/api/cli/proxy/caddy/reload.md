---
title: "nb proxy caddy reload"
description: "Referência do comando nb proxy caddy reload: recarrega a configuração do Caddy com o driver atual."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Recarrega a configuração do Caddy com o driver atual.

## Uso

```bash
nb proxy caddy reload
```

## Exemplos

```bash
nb proxy caddy reload
```

## Notas

- Este comando normalmente é usado depois que você regenera a configuração
- `reload` exige que o Caddy já esteja em execução; se ele ainda não estiver em execução, use primeiro `nb proxy caddy start`
- O driver local recarrega o Caddy local, e o driver Docker recarrega o Caddy dentro do contêiner

## Comandos relacionados

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
