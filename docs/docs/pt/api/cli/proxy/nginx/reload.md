---
title: "nb proxy nginx reload"
description: "Referência do comando nb proxy nginx reload: recarrega a configuração do Nginx com o driver atual."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Recarrega a configuração do Nginx com o driver atual.

## Uso

```bash
nb proxy nginx reload
```

## Exemplos

```bash
nb proxy nginx reload
```

## Notas

- Este comando normalmente é usado depois que você regenera a configuração
- `reload` exige que o Nginx já esteja em execução; se ele ainda não estiver em execução, use primeiro `nb proxy nginx start`
- O driver local recarrega o Nginx local, e o driver Docker recarrega o Nginx dentro do contêiner

## Comandos relacionados

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
