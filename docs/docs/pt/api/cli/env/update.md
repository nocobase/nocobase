---
title: 'nb env update'
description: 'Referência do comando nb env update: atualiza a configuração salva de API, autenticação, código-fonte, aplicação e banco de dados.'
keywords: 'nb env update,NocoBase CLI,configuração de env,autenticação,banco de dados,código-fonte'
---

# nb env update

`nb env update` atualiza a configuração de um env salvo. Você pode ajustar o endereço da API, o método de autenticação, a origem do código, o caminho local do app, o caminho público, a porta, parâmetros do banco de dados e muito mais. Depois da atualização, a CLI cuida automaticamente das ações de sincronização necessárias.

Se você não passar parâmetros de configuração, a CLI também executa uma nova sincronização com base no estado atual do env.

## Uso

```bash
nb env update [name] [flags]
```

## Opções gerais

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente configurado a ser atualizado. Se omitido, usa o env atual |
| `--verbose` | boolean | Exibe o progresso detalhado |

## Opções de API e autenticação

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | Endereço da API do NocoBase, incluindo o prefixo `/api` |
| `--auth-type` | string | Método de autenticação: `basic`, `token`, `oauth` |
| `--access-token`, `--token`, `-t` | string | API key ou access token usado com autenticação `token`. Depois de salvo, o método muda para `token` |
| `--username` | string | Nome de usuário salvo para autenticação `basic`. Só pode ser usado quando o env atual usa `basic` ou junto com `--auth-type basic` |

## Opções de código-fonte e download

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--source` | string | Origem salva da aplicação: `docker`, `git`, `local`, `npm` |
| `--download-version`, `--version` | string | Parâmetro de versão salvo: tag Docker, versão do pacote npm ou ref Git |
| `--docker-registry` | string | Nome do registro da imagem Docker, sem a tag |
| `--docker-platform` | string | Plataforma da imagem Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--git-url` | string | URL do repositório Git |
| `--npm-registry` | string | Registry usado para downloads npm/Git e instalação de dependências |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Define se instala devDependencies ao instalar via npm/Git |
| `--build` / `--no-build` | boolean | Define se faz build automático após baixar via npm/Git |
| `--build-dts` / `--no-build-dts` | boolean | Define se gera arquivos de declaração TypeScript durante a build |

## Opções da aplicação

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--app-path` | string | Diretório da aplicação. Agora este é o parâmetro recomendado para gerenciar diretórios locais |
| `--app-public-path` | string | Caminho público da aplicação (`APP_PUBLIC_PATH`), como `/` ou `/nocobase/` |
| `--app-port` | string | Porta HTTP da aplicação |
| `--cdn-base-url` | string | URL base do CDN de assets do cliente (`CDN_BASE_URL`) |
| `--app-key` | string | Chave da aplicação (`APP_KEY`) |
| `--timezone` | string | Fuso horário da aplicação (`TZ`) |

## Opções do banco de dados

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Define se usa o banco embutido gerenciado pela CLI |
| `--db-dialect` | string | Tipo de banco: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Imagem do contêiner do banco embutido |
| `--db-host` | string | Endereço do host do banco |
| `--db-port` | string | Porta do banco |
| `--db-database` | string | Nome do banco |
| `--db-user` | string | Usuário do banco |
| `--db-password` | string | Senha do banco |
| `--db-schema` | string | Schema do banco. Normalmente usado apenas com PostgreSQL |
| `--db-table-prefix` | string | Prefixo das tabelas |
| `--db-underscored` / `--no-db-underscored` | boolean | Define se nomes de tabelas e campos usam estilo com underscore |

## Opções de limpeza de configuração

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--unset` | string[] | Limpa um ou mais campos salvos pelo nome canônico da flag. Pode ser repetido e também aceita valores separados por vírgula, como `--unset git-url,username` |

## Observações

:::tip

Se você só quiser que a CLI sincronize novamente o estado mais recente do env atual, basta executar `nb env update` ou `nb env update <name>`. Nenhum parâmetro extra é necessário.

:::

- Depois da atualização, a CLI executa automaticamente a sincronização de acompanhamento necessária
- As outras opções atualizam apenas a configuração salva do env. Elas não reiniciam automaticamente a aplicação nem substituem automaticamente o código-fonte local ou as imagens Docker
- Depois de mudar configurações como `app-path`, `app-port`, `timezone` ou `db-*`, a CLI normalmente pede para executar `nb app restart --env <name>`. Se a mudança envolver o banco embutido gerenciado pela CLI, ela recomendará `nb app restart --env <name> --with-db`
- Depois de mudar configurações como `app-port`, `app-public-path` ou `cdn-base-url`, que afetam a renderização do proxy, execute novamente `nb env proxy nginx` ou `nb env proxy caddy` se você já usa um proxy gerado
- Ao atualizar configurações de código como `source`, `download-version`, `docker-registry`, `git-url` ou `npm-registry`, apenas os valores salvos mudam. O código local existente, as dependências e as imagens não são substituídos automaticamente
- `--access-token` não pode ser usado junto com `--auth-type basic` ou `--auth-type oauth`
- O mesmo campo não pode usar `--unset` e uma atribuição explícita ao mesmo tempo. Por exemplo, você não pode escrever `--unset git-url` e `--git-url ...` juntos
- Se você mudar a autenticação para `basic` ou `oauth`, ou limpar o token, normalmente ainda precisará executar `nb env auth <name>`

## Exemplos

```bash
# Sincronizar novamente o env atual
nb env update

# Sincronizar novamente um env específico
nb env update prod

# Atualizar o endereço da API
nb env update prod --api-base-url http://localhost:13000/api

# Atualizar o token e mudar a autenticação para token
nb env update prod --access-token <token>

# Mudar para autenticação basic, salvar só o usuário e executar nb env auth depois
nb env update prod --auth-type basic --username admin

# Ajustar origem e versão do código, atualizando apenas a configuração salva
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajustar a porta da aplicação e o fuso horário
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Ajustar o caminho público da aplicação. Depois disso, normalmente também é preciso regenerar o proxy
nb env update local --app-public-path /nocobase/

# Salvar uma URL base de CDN para os assets do cliente
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Limpar campos salvos
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Comandos relacionados

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
