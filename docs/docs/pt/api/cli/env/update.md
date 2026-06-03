---
title: 'nb env update'
description: 'Referência do comando nb env update: atualiza a configuração salva de API, autenticação, código-fonte, aplicação e banco de dados.'
keywords: 'nb env update,NocoBase CLI,configuração de env,autenticação,banco de dados,código-fonte'
---

# nb env update

`nb env update` é usado para atualizar a configuração de um env salvo. Você pode usá-lo para ajustar o endereço da API, o método de autenticação, a origem do código-fonte, o caminho da aplicação local, a porta, os parâmetros do banco de dados e muito mais. Depois que a atualização for concluída, a CLI tratará automaticamente os passos subsequentes necessários com base nas mudanças.

Se você não fornecer parâmetros de configuração, a CLI também fará uma nova sincronização com base no estado atual do env.

## Uso

```bash
nb env update [name] [flags]
```

## Opções gerais

| Opção       | Tipo    | Descrição                                                                          |
| ----------- | ------- | ---------------------------------------------------------------------------------- |
| `[name]`    | string  | Nome do ambiente configurado a ser atualizado; se omitido, o env atual será usado. |
| `--verbose` | boolean | Exibe o progresso detalhado.                                                       |

## Opções de API e autenticação

| Opção                             | Tipo   | Descrição                                                                                                                                                                 |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | Endereço da API do NocoBase, incluindo o prefixo `/api`.                                                                                                                  |
| `--auth-type`                     | string | Método de autenticação: `basic`, `token`, `oauth`.                                                                                                                        |
| `--access-token`, `--token`, `-t` | string | API key ou access token usado pela autenticação `token`. Depois de salvo, o método de autenticação será alterado para `token`.                                            |
| `--username`                      | string | Nome de usuário salvo para a autenticação `basic`. Só pode ser usado quando o env atual usa autenticação `basic`, ou quando `--auth-type basic` é passado ao mesmo tempo. |

## Opções de código-fonte e download

| Opção                                          | Tipo    | Descrição                                                                     |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `--source`                                     | string  | Origem salva da aplicação: `docker`, `git`, `local`, `npm`.                   |
| `--download-version`, `--version`              | string  | Parâmetro de versão salvo: tag do Docker, versão do pacote npm ou ref do Git. |
| `--docker-registry`                            | string  | Nome do registro da imagem Docker, sem a tag.                                 |
| `--docker-platform`                            | string  | Plataforma da imagem Docker: `auto`, `linux/amd64`, `linux/arm64`.            |
| `--git-url`                                    | string  | URL do repositório Git.                                                       |
| `--npm-registry`                               | string  | Registry usado para downloads npm/Git e instalação de dependências.           |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Se deve instalar devDependencies ao instalar via npm/Git.                     |
| `--build` / `--no-build`                       | boolean | Se deve construir automaticamente após baixar via npm/Git.                    |
| `--build-dts` / `--no-build-dts`               | boolean | Se deve gerar arquivos de declaração TypeScript durante a build.              |

## Opções da aplicação

| Opção        | Tipo   | Descrição                                                                                                  |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Diretório da aplicação. Agora, este é o parâmetro recomendado por padrão para gerenciar diretórios locais. |
| `--app-port` | string | Porta HTTP da aplicação.                                                                                   |
| `--app-key`  | string | Chave da aplicação (`APP_KEY`).                                                                            |
| `--timezone` | string | Fuso horário da aplicação (`TZ`).                                                                          |

## Opções do banco de dados

| Opção                                      | Tipo    | Descrição                                                           |
| ------------------------------------------ | ------- | ------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | Se deve usar o banco de dados embutido gerenciado pela CLI.         |
| `--db-dialect`                             | string  | Tipo de banco de dados: `postgres`, `mysql`, `mariadb`, `kingbase`. |
| `--builtin-db-image`                       | string  | Imagem do contêiner do banco de dados embutido.                     |
| `--db-host`                                | string  | Endereço do host do banco de dados.                                 |
| `--db-port`                                | string  | Porta do banco de dados.                                            |
| `--db-database`                            | string  | Nome do banco de dados.                                             |
| `--db-user`                                | string  | Nome de usuário do banco de dados.                                  |
| `--db-password`                            | string  | Senha do banco de dados.                                            |
| `--db-schema`                              | string  | Schema do banco de dados. Normalmente só é usado pelo PostgreSQL.   |
| `--db-table-prefix`                        | string  | Prefixo das tabelas.                                                |
| `--db-underscored` / `--no-db-underscored` | boolean | Se os nomes das tabelas e dos campos usam estilo com sublinhado.    |

## Opções de limpeza de configuração

| Opção     | Tipo     | Descrição                                                                                                                                                    |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--unset` | string[] | Limpa um ou mais campos salvos pelo nome canônico do flag. Suporta repetição e também valores separados por vírgula, por exemplo `--unset git-url,username`. |

## Observações

:::tip

Se você só quiser que a CLI sincronize novamente com base no estado mais recente do env atual, basta executar `nb env update` ou `nb env update <name>`. Nenhum parâmetro extra é necessário.

:::

- Depois que a atualização for concluída, a CLI lidará automaticamente com qualquer sincronização de acompanhamento necessária com base nas mudanças feitas desta vez
- As outras opções apenas atualizam a configuração salva do env; elas não reiniciam automaticamente a aplicação nem substituem automaticamente o código-fonte local ou as imagens Docker
- Depois de modificar configurações como `app-path`, `app-port`, `timezone` ou `db-*`, a CLI normalmente solicitará que você execute `nb app restart --env <name>` em seguida; se a mudança envolver o banco de dados embutido gerenciado pela CLI, ela solicitará que você use `nb app restart --env <name> --with-db`
- Ao atualizar configurações de código-fonte como `source`, `download-version`, `docker-registry`, `git-url` ou `npm-registry`, apenas os valores salvos são alterados. O código-fonte local existente, as dependências e as imagens não são substituídos automaticamente
- `--access-token` não pode ser usado junto com `--auth-type basic` ou `--auth-type oauth`
- O mesmo campo não pode ser usado ao mesmo tempo com `--unset` e com um valor explícito. Por exemplo, você não pode escrever `--unset git-url` e `--git-url ...` ao mesmo tempo
- Se você mudar o método de autenticação para `basic` ou `oauth`, ou limpar o token, normalmente ainda precisará executar `nb env auth <name>` depois

## Exemplos

```bash
# Sincronizar novamente o env atual com base no estado mais recente
nb env update

# Sincronizar novamente o env especificado com base no estado mais recente
nb env update prod

# Atualizar o endereço da API
nb env update prod --api-base-url http://localhost:13000/api

# Atualizar o token e mudar o método de autenticação para token
nb env update prod --access-token <token>

# Mudar para autenticação basic, salvar apenas o nome de usuário e executar nb env auth depois
nb env update prod --auth-type basic --username admin

# Ajustar a origem e a versão do código-fonte, atualizando apenas a configuração salva
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajustar a porta da aplicação e o fuso horário, e reiniciar a aplicação depois
nb env update local --app-port 13080 --timezone Asia/Shanghai

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
