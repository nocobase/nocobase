---
title: "NocoBase CLI"
description: "Referência do NocoBase CLI (comando nb): inicialização, gerenciamento de ambientes, execução da aplicação, código-fonte, banco de dados, plugins, API, autoatualização do CLI e gerenciamento de Skills."
keywords: "NocoBase CLI,nb,linha de comando,referência de comandos,gerenciamento de ambientes,gerenciamento de plugins,API"
---

# NocoBase CLI

## Descrição

O NocoBase CLI (`nb`) é o ponto de entrada por linha de comando do NocoBase, usado para inicializar, conectar e gerenciar aplicações NocoBase em um workspace local.

Ele suporta dois caminhos comuns de inicialização:

- Conectar a uma aplicação NocoBase existente e salvá-la como um env do CLI
- Instalar uma nova aplicação NocoBase via Docker, npm ou Git e depois salvá-la como um env do CLI

Ao criar uma nova aplicação local, [`nb init`](./init.md) também pode instalar ou atualizar as NocoBase AI coding skills. Quando precisar pular essa etapa, você pode usar `--skip-skills`.

## Uso

```bash
nb [command]
```

O comando raiz em si é usado principalmente para exibir ajuda e despachar a chamada para grupos de comandos ou comandos independentes.

## Grupos de comandos (Topics)

Os seguintes grupos de comandos são exibidos em `nb --help`:

| Grupo de comandos | Descrição |
| --- | --- |
| [`nb api`](./api/index.md) | Chamar a API do NocoBase via CLI. |
| [`nb app`](./app/index.md) | Gerenciar o estado de execução da aplicação: iniciar, parar, reiniciar, logs e upgrade. |
| [`nb db`](./db/index.md) | Gerenciar o banco de dados embutido do env selecionado. |
| [`nb env`](./env/index.md) | Gerenciar ambientes, status, detalhes e comandos em tempo de execução do projeto NocoBase. |
| [`nb plugin`](./plugin/index.md) | Gerenciar os plugins do env NocoBase selecionado. |
| [`nb scaffold`](./scaffold/index.md) | Gerar scaffolding de desenvolvimento de plugins NocoBase. |
| [`nb self`](./self/index.md) | Verificar ou atualizar o próprio NocoBase CLI. |
| [`nb skills`](./skills/index.md) | Verificar ou sincronizar as NocoBase AI coding skills do workspace atual. |
| [`nb source`](./source/index.md) | Gerenciar projetos de código-fonte locais: download, desenvolvimento, build e testes. |

## Comandos (Commands)

Comandos independentes expostos diretamente pelo comando raiz atual:

| Comando | Descrição |
| --- | --- |
| [`nb init`](./init.md) | Inicializa o NocoBase para que o coding agent possa se conectar e trabalhar. |

## Visualizar ajuda

Visualizar a ajuda do comando raiz:

```bash
nb --help
```

Visualizar a ajuda de um comando ou grupo de comandos específico:

```bash
nb init --help
nb app --help
nb api resource --help
```

## Exemplos

Inicialização interativa:

```bash
nb init
```

Inicialização usando um formulário no navegador:

```bash
nb init --ui
```

Criar uma aplicação Docker de forma não interativa:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Conectar a uma aplicação existente:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Iniciar a aplicação e atualizar os comandos em tempo de execução:

```bash
nb app start -e app1
nb env update app1
```

Chamar a API:

```bash
nb api resource list --resource users -e app1
```

## Variáveis de ambiente

As seguintes variáveis de ambiente afetam o comportamento do CLI:

| Variável | Descrição |
| --- | --- |
| `NB_CLI_ROOT` | Diretório raiz onde o CLI salva a configuração `.nocobase` e os arquivos da aplicação local. O padrão é o diretório home do usuário atual. |
| `NB_LOCALE` | Idioma das mensagens do CLI e da UI de inicialização local; suporta `en-US` e `zh-CN`. |

Exemplos:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Arquivo de configuração

Arquivo de configuração padrão:

```text
~/.nocobase/config.json
```

Após definir `NB_CLI_ROOT=/your/workspace`, o caminho do arquivo de configuração passa a ser:

```text
/your/workspace/.nocobase/config.json
```

O CLI também é compatível com a leitura de configurações de projeto antigas no diretório de trabalho atual.

O cache de comandos em tempo de execução é salvo em:

```text
.nocobase/versions/<hash>/commands.json
```

Esse arquivo é gerado ou atualizado por [`nb env update`](./env/update.md) e serve para armazenar em cache os comandos em tempo de execução sincronizados a partir da aplicação alvo.

## Links relacionados

- [Início rápido](../../ai/quick-start.mdx)
- [Instalação, upgrade e migração](../../ai/install-upgrade-migration.mdx)
- [Variáveis de ambiente globais](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Desenvolvimento de plugins](../../plugin-development/index.md)
