---
title: "nb init"
description: "Referência do comando nb init: inicializa o NocoBase, conecta a uma aplicação existente ou instala uma nova aplicação, e a salva como um env do CLI."
keywords: "nb init,NocoBase CLI,inicialização,env,Docker,npm,Git"
---

# nb init

Inicializa o workspace atual para que o coding agent possa se conectar e usar o NocoBase. O `nb init` pode conectar a uma aplicação existente ou instalar uma nova aplicação via Docker, npm ou Git.

## Uso

```bash
nb init [flags]
```

## Descrição

O `nb init` suporta três modos de prompt:

- Modo padrão: preencha passo a passo no terminal.
- `--ui`: abre um formulário no navegador local para concluir o fluxo guiado.
- `--yes`: pula os prompts e usa valores padrão. Esse modo exige `--env <envName>` e cria uma nova aplicação local.

Por padrão, o `nb init` instala ou atualiza as NocoBase AI coding skills durante a inicialização ou retomada da inicialização. Se você já gerencia as skills por conta própria, ou está executando em CI ou em um ambiente offline, pode usar `--skip-skills` para pular essa etapa.

Se a inicialização for interrompida após a configuração do env ter sido salva, você pode usar `--resume` para continuar:

```bash
nb init --env app1 --resume
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Pula os prompts e usa flags e valores padrão |
| `--env`, `-e` | string | Nome do env para esta inicialização; obrigatório nos modos `--yes` e `--resume` |
| `--ui` | boolean | Abre um assistente visual no navegador; não pode ser usado junto com `--yes` |
| `--verbose` | boolean | Exibe a saída detalhada dos comandos |
| `--skip-skills` | boolean | Pula a instalação ou atualização das NocoBase AI coding skills durante a inicialização |
| `--ui-host` | string | Endereço de bind do serviço local do `--ui`; padrão `127.0.0.1` |
| `--ui-port` | integer | Porta do serviço local do `--ui`; `0` indica alocação automática |
| `--locale` | string | Idioma das mensagens do CLI e da UI: `en-US` ou `zh-CN` |
| `--api-base-url`, `-u` | string | Endereço da API do NocoBase, incluindo o prefixo `/api` |
| `--auth-type`, `-a` | string | Método de autenticação: `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token usado pelo método de autenticação `token` |
| `--resume` | boolean | Reutiliza a configuração de env do workspace já salva para continuar a inicialização |
| `--lang`, `-l` | string | Idioma da aplicação NocoBase após a instalação |
| `--force`, `-f` | boolean | Reconfigura um env existente e substitui recursos de execução conflitantes quando necessário |
| `--app-root-path` | string | Diretório do código-fonte da aplicação npm/Git local; padrão `./<envName>/source/` |
| `--app-port` | string | Porta da aplicação local; padrão `13000`; o modo `--yes` seleciona automaticamente uma porta disponível |
| `--storage-path` | string | Diretório de upload de arquivos e dados do banco de dados gerenciado; padrão `./<envName>/storage/` |
| `--root-username` | string | Nome de usuário do administrador inicial |
| `--root-email` | string | E-mail do administrador inicial |
| `--root-password` | string | Senha do administrador inicial |
| `--root-nickname` | string | Apelido do administrador inicial |
| `--builtin-db`, `--no-builtin-db` | boolean | Define se o banco de dados embutido gerenciado pelo CLI será criado |
| `--db-dialect` | string | Tipo de banco de dados: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Imagem do contêiner do banco de dados embutido |
| `--db-host` | string | Endereço do banco de dados |
| `--db-port` | string | Porta do banco de dados |
| `--db-database` | string | Nome do banco de dados |
| `--db-user` | string | Usuário do banco de dados |
| `--db-password` | string | Senha do banco de dados |
| `--fetch-source` | boolean | Faz o download dos arquivos da aplicação ou pull da imagem Docker antes da instalação |
| `--source`, `-s` | string | Forma de obter o NocoBase: `docker`, `npm` ou `git` |
| `--version`, `-v` | string | Parâmetro de versão: versão npm, tag de imagem Docker ou ref Git |
| `--replace`, `-r` | boolean | Substitui o diretório alvo se ele já existir |
| `--dev-dependencies`, `-D` | boolean | Define se as devDependencies serão instaladas em instalações npm/Git |
| `--output-dir`, `-o` | string | Diretório alvo de download ou diretório onde salvar o tarball do Docker |
| `--git-url` | string | Endereço do repositório Git |
| `--docker-registry` | string | Nome do registry de imagens Docker, sem tag |
| `--docker-platform` | string | Plataforma da imagem Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Define se a imagem Docker será salva como tarball após o pull |
| `--npm-registry` | string | Registry usado para downloads e instalação de dependências npm/Git |
| `--build`, `--no-build` | boolean | Define se haverá build após a instalação de dependências npm/Git |
| `--build-dts` | boolean | Define se serão gerados arquivos de declaração TypeScript no build npm/Git |

## Exemplos

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Comandos relacionados

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
