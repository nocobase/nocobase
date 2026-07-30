---
title: "nb portal"
description: "Referência do comando nb portal: gerenciar workspaces de Portal, incluindo configuração, criação, desenvolvimento, sincronização de código-fonte, deploy e exclusão."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` gerencia workspaces de Portal. Um Portal pode ter seu próprio código-fonte frontend, caminho de entrada e saída de deploy; este grupo conecta o registro do Portal no NocoBase ao workspace local e ao source storage.

O fluxo típico é criar um workspace local, iniciar o modo de desenvolvimento, enviar alterações de source para o source storage e depois buildar e fazer deploy. Se você vai assumir um Portal existente, primeiro faça `pull` para o ambiente local.

## Uso

```bash
nb portal <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb portal config`](./config.md) | Atualiza a configuração de source do workspace Portal local e sincroniza com o registro remoto quando possível |
| [`nb portal create`](./create.md) | Cria um workspace Portal local a partir de um template e cria ou atualiza o registro do Portal |
| [`nb portal deploy`](./deploy.md) | Compila e faz deploy do workspace Portal especificado |
| [`nb portal destroy`](./destroy.md) | Exclui o registro do Portal e o workspace local |
| [`nb portal dev`](./dev.md) | Inicia o modo de desenvolvimento para o workspace Portal especificado |
| [`nb portal info`](./info.md) | Mostra detalhes do registro Portal especificado e do workspace local |
| [`nb portal list`](./list.md) | Lista registros Portal e o status de sincronização do workspace local |
| [`nb portal pull`](./pull.md) | Baixa o source do Portal do source storage para o workspace local |
| [`nb portal push`](./push.md) | Envia alterações locais do source do Portal para o source storage |

## Fluxo típico

Criar um Portal chamado `customer`:

```bash
nb portal create customer -e dev --yes
```

Iniciar o modo de desenvolvimento local:

```bash
nb portal dev customer -e dev --yes
```

Inspecionar o workspace local e o registro remoto:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Enviar o source e fazer deploy:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Assumir um Portal existente:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Trocar o source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Ao criar um Portal, escolha onde o código-fonte será gerenciado:

| Modo | Descrição |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

The Portal name and source configuration are written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Modo | Descrição |
| --- | --- |
| `local` | The workspace is independent of app storage. Source and deployment output are synced through APIs. |
| `docker` | The workspace does not depend on a Docker volume. Source and deployment output are synced through APIs. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

`create` defaults to a portal-named child of the current directory. The first `pull` uses the same location; if the current directory already contains `portal.config.json`, `pull` uses the current directory directly:

```text
<current-directory>/<portal>
```

`dev`, `push`, `deploy`, `config`, `destroy`, `info`, and `list` use the current directory as the local Portal workspace by default. Pass `--dir <path>` to any of these commands to select a workspace explicitly; relative paths are resolved from the current directory. The CLI does not derive the local workspace from the env `storagePath`.

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Parâmetro | Descrição |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Comandos relacionados

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
