---
title: "nb portal deploy"
description: "Referência do comando nb portal deploy: compila e faz deploy do workspace Portal especificado."
keywords: "nb portal deploy,NocoBase CLI,Portal,compilar,deploy"
---

# nb portal deploy

Compila e faz deploy do workspace Portal especificado. Normalmente é usado quando o desenvolvimento local foi concluído e você precisa atualizar o Portal no env de destino.

Durante a execução, o comando primeiro atualiza `.env` e `.env.local` no workspace e depois executa `pnpm build`. O artefato de build deve conter `dist/client/index.html`.

## Uso

```bash
nb portal deploy <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Nome ou slug do Portal |
| `--env`, `-e` | string | Nome do env da CLI. Se omitido, usa o env atual |
| `--no-install` | boolean | Ignora `pnpm install` antes do build |
| `--yes`, `-y` | boolean | Ignora a confirmação interativa quando o `--env` explícito aponta para um env diferente do atual |

## Exemplos

Fazer deploy de um Portal no env atual:

```bash
nb portal deploy customer
```

Fazer deploy de um Portal em um env específico:

```bash
nb portal deploy customer --env dev --yes
```

Ignorar a instalação de dependências e apenas refazer o build e o deploy:

```bash
nb portal deploy customer --no-install
```

## Notas

`deploy` é voltado para workspaces de desenvolvimento de Portal que já existem. Se ainda não houver um workspace local, crie-o primeiro com [`nb portal create`](./create.md) ou use [`nb portal pull`](./pull.md) para buscar do source storage.

O deploy compila o Portal a partir do caminho de desenvolvimento registrado na configuração do env da CLI e sincroniza os artefatos de build com o diretório de deploy no storage da aplicação de destino.

O deploy não modifica o source storage nem as configurações de Git. Essas configurações são atualizadas no registro remoto do Portal por [`nb portal config`](./config.md).

## Comandos relacionados

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
