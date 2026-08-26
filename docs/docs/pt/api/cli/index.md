---
title: 'NocoBase CLI'
description: 'Referência da NocoBase CLI (comando `nb`): inicialização, backup e restauração, configuração, gerenciamento de ambientes, tempo de execução do aplicativo, código-fonte, banco de dados, plugins, licença comercial, API, autoatualização da CLI e gerenciamento de Skills.'
keywords: 'NocoBase CLI,nb,linha de comando,referência de comandos,backup,restauração,gerenciamento de ambientes,gerenciamento de plugins,licença comercial,API'
---

# NocoBase CLI

## Descrição

A NocoBase CLI (`nb`) é o ponto de entrada de linha de comando do NocoBase, usada para inicializar, conectar e gerenciar aplicações NocoBase em um workspace local.

Ela oferece suporte a dois caminhos comuns de inicialização:

- Conectar-se a uma aplicação NocoBase existente e salvá-la como um env da CLI
- Instalar uma nova aplicação NocoBase via Docker, npm ou Git e depois salvá-la como um env da CLI

Ao criar uma nova aplicação local, [`nb init`](./init.md) também pode instalar ou atualizar NocoBase AI coding skills. Se precisar pular essa etapa, use `--skip-skills`.

## Uso

```bash
nb [command]
```

O comando raiz em si é usado principalmente para exibir ajuda e encaminhar chamadas para grupos de comandos ou comandos independentes.

## Grupos de comandos (Topics)

Os seguintes grupos de comandos são exibidos em `nb --help`:

| Grupo de comandos                    | Descrição                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | Chama APIs do NocoBase pela CLI.                                                                                 |
| [`nb app`](./app/index.md)           | Gerencia o runtime da aplicação: iniciar, parar, reiniciar, logs e atualização.                                  |
| [`nb backup`](./backup/index.md)     | Cria backups e faz download para o ambiente local, ou restaura um arquivo de backup local para o env de destino. |
| [`nb config`](./config/index.md)     | Gerencia a configuração padrão da CLI.                                                                           |
| [`nb db`](./db/index.md)             | Gerencia o banco de dados embutido do env selecionado.                                                           |
| [`nb env`](./env/index.md)           | Gerencia ambientes de projeto NocoBase, o env atual, status, detalhes e comandos de runtime.                     |
| [`nb license`](./license/index.md)   | Gerencia licenças comerciais e plugins licenciados.                                                              |
| [`nb plugin`](./plugin/index.md)     | Gerencia plugins do env NocoBase selecionado.                                                                    |
| [`nb scaffold`](./scaffold/index.md) | Gera scaffolding para desenvolvimento de plugins NocoBase.                                                       |
| [`nb self`](./self/index.md)         | Verifica ou atualiza a própria NocoBase CLI.                                                                     |
| [`nb session`](./session/index.md)   | Configura `NB_SESSION_ID` para que o env atual fique isolado por shell ou agent runtime.                         |
| [`nb skills`](./skills/index.md)     | Verifica ou sincroniza as NocoBase AI coding skills do workspace atual.                                          |
| [`nb source`](./source/index.md)     | Gerencia projetos locais de código-fonte: baixar, desenvolver, compilar e testar.                                |

## Comandos

Comandos independentes atualmente expostos diretamente pelo comando raiz:

| Comando                | Descrição                                                                    |
| ---------------------- | ---------------------------------------------------------------------------- |
| [`nb init`](./init.md) | Inicializa o NocoBase para que o coding agent possa se conectar e trabalhar. |

## Ver ajuda

Ver a ajuda do comando raiz:

```bash
nb --help
```

Ver a ajuda de um comando ou grupo de comandos:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Exemplos

Inicialização interativa:

```bash
nb init
```

Inicializar usando um formulário no navegador:

```bash
nb init --ui
```

Criar uma aplicação Docker de forma não interativa:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Conectar-se a uma aplicação existente:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Ressincronizar o status do env após iniciar a aplicação:

```bash
nb app start -e app1
nb env update app1
```

Chamar a API:

```bash
nb api resource list --resource users -e app1
```

Ver a configuração padrão da CLI:

```bash
nb config list
nb config get docker.network
```

Ver o status da licença comercial:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Criar e baixar um backup:

```bash
nb backup create -e app1 --output ./backups
```

Restaurar um backup local:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Variáveis de ambiente

As seguintes variáveis de ambiente afetam o comportamento da CLI:

| Variável        | Descrição                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `NB_CLI_ROOT`   | Diretório raiz onde a CLI salva a configuração `.nocobase` e os arquivos da aplicação local. O padrão é o diretório home do usuário atual. |
| `NB_LOCALE`     | Idioma dos prompts da CLI e idioma da UI de inicialização local. Suporta `en-US` e `zh-CN`.                                                |
| `NB_SESSION_ID` | ID da sessão do shell atual ou do agent runtime. Quando definido, `nb env use` e `nb env current` ficam isolados por sessão.               |

Exemplo:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Arquivo de configuração

Arquivo de configuração padrão:

```text
~/.nocobase/config.json
```

Depois de definir `NB_CLI_ROOT=/your/workspace`, o caminho do arquivo de configuração passa a ser:

```text
/your/workspace/.nocobase/config.json
```

A CLI também é compatível com a leitura da configuração antiga de project no diretório de trabalho atual.

O cache em nível de sessão do env atual é salvo em:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

O último env usado globalmente é salvo no campo `lastEnv` de `config.json`. Quando não há `NB_SESSION_ID`, a CLI recorre a esse valor global.

O cache de comandos de runtime é salvo em:

```text
.nocobase/versions/<hash>/commands.json
```

Este arquivo é gerado ou atualizado por [`nb env update`](./env/update.md) e é usado para armazenar em cache os comandos de runtime sincronizados da aplicação de destino.

## Links relacionados

- [Início rápido](../../ai/quick-start.mdx)
- [Variáveis de ambiente globais](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Desenvolvimento de plugins](../../plugin-development/index.md)
