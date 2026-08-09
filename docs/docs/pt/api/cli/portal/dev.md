---
title: "nb portal dev"
description: "Referência do comando nb portal dev: inicia o modo de desenvolvimento do diretório local de código-fonte de um Portal."
keywords: "nb portal dev,NocoBase CLI,Portal,modo de desenvolvimento,desenvolvimento local"
---

# nb portal dev

Inicia o modo de desenvolvimento do diretório local de código-fonte do Portal indicado. Normalmente é usado depois de executar [`nb portal create`](./create.md) ou [`nb portal pull`](./pull.md).

Ao ser executado, atualiza `.env` e `.env.local` no diretório local de código-fonte e em seguida roda `pnpm dev` nesse mesmo diretório.

## Uso

```bash
nb portal dev <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Nome ou slug do Portal |
| `--env`, `-e` | string | Nome do env da CLI. Se omitido, é usado o env atual |
| `--yes`, `-y` | boolean | Pula a confirmação interativa quando o `--env` informado explicitamente difere do env atual |

## Exemplos

Iniciar o modo de desenvolvimento de um Portal no env atual:

```bash
nb portal dev customer
```

Iniciar o modo de desenvolvimento de um Portal em um env específico:

```bash
nb portal dev customer --env dev --yes
```

## Notas

O `dev` inicia o servidor de desenvolvimento a partir do diretório local de código-fonte do Portal. Ele não cria o registro do Portal nem baixa o código-fonte remoto; se o diretório local de código-fonte não existir, use antes [`nb portal create`](./create.md) ou [`nb portal pull`](./pull.md).

O diretório local de código-fonte precisa conter `package.json`. Envs do tipo `ssh` ainda não suportam iniciar o modo de desenvolvimento de um Portal.

## Comandos relacionados

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
