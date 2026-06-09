---
title: "nb env update"
description: "Referência do comando nb env update: atualize a configuração salva de API, autenticação, código-fonte, aplicação e banco de dados."
keywords: "nb env update,NocoBase CLI,configuração de env,autenticação,banco de dados,código-fonte"
---

# nb env update

`nb env update` atualiza a configuração de um env salvo. Você pode usá-lo para ajustar o endereço da API, o método de autenticação, a origem do código-fonte, o caminho local da aplicação, o caminho público, a porta, os parâmetros do banco de dados e muito mais. Quando a atualização termina, a CLI trata automaticamente as etapas de acompanhamento necessárias de acordo com as mudanças.

Se você não passar nenhum parâmetro de configuração, a CLI ainda executará uma resincronização com base no estado atual do env.

## Uso

```bash
nb env update [name] [flags]
```

## Opções comuns

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do env configurado a ser atualizado. Se omitido, o env atual será usado |
| `--verbose` | boolean | Mostra o progresso em detalhes |

## Opções de API e autenticação

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL da API do NocoBase, incluindo o prefixo `/api` |
| `--auth-type` | string | Método de autenticação: `basic`, `token` ou `oauth` |
| `--access-token`, `--token`, `-t` | string | API key ou access token usado com autenticação `token`. Ao salvar, o tipo de autenticação também muda para `token` |
| `--username` | string | Nome de usuário salvo para autenticação `basic`. Use apenas quando o env atual já usa `basic`, ou junto com `--auth-type basic` |

## Opções de origem e download

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--source` | string | Origem salva da aplicação: `docker`, `git`, `local` ou `npm` |
| `--download-version`, `--version` | string | Seletor de versão salvo: tag Docker, versão de pacote npm ou ref Git |
| `--docker-registry` | string | Nome do registry da imagem Docker, sem a tag |
| `--docker-platform` | string | Plataforma da imagem Docker: `auto`, `linux/amd64` ou `linux/arm64` |
| `--git-url` | string | URL do repositório Git |
| `--npm-registry` | string | Registry usado para downloads npm ou Git e instalação de dependências |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Se deve instalar `devDependencies` para origens npm ou Git |
| `--build` / `--no-build` | boolean | Se deve executar build automaticamente após download npm ou Git |
| `--build-dts` / `--no-build-dts` | boolean | Se deve gerar arquivos de declaração TypeScript durante o build |

## Opções da aplicação

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--app-path` | string | Diretório da aplicação. Agora esta é a forma recomendada de gerenciar o caminho local da aplicação |
| `--app-public-path` | string | Caminho público da aplicação (`APP_PUBLIC_PATH`), como `/` ou `/nocobase/` |
| `--app-port` | string | Porta HTTP da aplicação |
| `--cdn-base-url` | string | URL base do CDN para assets estáticos do cliente (`CDN_BASE_URL`) |
| `--app-key` | string | Chave da aplicação (`APP_KEY`) |
| `--timezone` | string | Fuso horário da aplicação (`TZ`) |

## Opções do banco de dados

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Se deve usar o banco de dados embutido gerenciado pela CLI |
| `--db-dialect` | string | Tipo de banco de dados: `postgres`, `mysql`, `mariadb` ou `kingbase` |
| `--builtin-db-image` | string | Imagem de container usada para o banco de dados embutido |
| `--db-host` | string | Host do banco de dados |
| `--db-port` | string | Porta do banco de dados |
| `--db-database` | string | Nome do banco de dados |
| `--db-user` | string | Nome de usuário do banco de dados |
| `--db-password` | string | Senha do banco de dados |
| `--db-schema` | string | Schema do banco de dados. Normalmente isso é usado apenas com PostgreSQL |
| `--db-table-prefix` | string | Prefixo de tabela |
| `--db-underscored` / `--no-db-underscored` | boolean | Se nomes de tabelas e campos usam estilo com underscore |

## Limpeza de configuração

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--unset` | string[] | Limpa um ou mais campos salvos pelo nome do flag. Você pode repetir a opção ou passar uma lista separada por vírgulas, como `--unset git-url,username` |

## Notas

:::tip

Se você só quer que a CLI ressincronize com base no estado mais recente do env atual, basta executar `nb env update` ou `nb env update <name>` sem opções extras.

:::

- Quando a atualização termina, a CLI trata automaticamente qualquer sincronização de acompanhamento necessária com base nas mudanças feitas desta vez
- As outras opções apenas atualizam a configuração salva do env. Elas não reiniciam automaticamente a aplicação nem substituem o código-fonte local ou as imagens Docker
- Depois de modificar configurações como `app-path`, `app-port`, `timezone` ou `db-*`, a CLI normalmente pedirá para você executar `nb app restart --env <name>`; se a mudança envolver o banco de dados embutido gerenciado pela CLI, ela pedirá `nb app restart --env <name> --with-db`
- Depois de modificar configurações como `app-port`, `app-public-path` ou `cdn-base-url` que afetam o resultado do reverse proxy, execute novamente `nb proxy nginx generate` ou `nb proxy caddy generate` se você já usa uma configuração de proxy gerada
- Ao atualizar configurações de origem como `source`, `download-version`, `docker-registry`, `git-url` ou `npm-registry`, apenas os valores salvos são alterados. O código-fonte local, as dependências e as imagens existentes não são substituídos automaticamente
- `--access-token` não pode ser usado junto com `--auth-type basic` ou `--auth-type oauth`
- O mesmo campo não pode ser usado ao mesmo tempo com `--unset` e com um valor explícito. Por exemplo, não use `--unset git-url` junto com `--git-url ...`
- Se você mudar o método de autenticação para `basic` ou `oauth`, ou limpar o token, normalmente precisará executar `nb env auth <name>` depois

## Exemplos

```bash
# Ressincronizar o env atual com base no estado salvo mais recente
nb env update

# Ressincronizar um env específico
nb env update prod

# Atualizar a URL da API
nb env update prod --api-base-url http://localhost:13000/api

# Atualizar o token e mudar o tipo de autenticação para token
nb env update prod --access-token <token>

# Mudar para autenticação basic, salvar o nome de usuário e executar nb env auth depois
nb env update prod --auth-type basic --username admin

# Atualizar a origem e a versão salvas sem substituir o código local ainda
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajustar a porta da aplicação e o fuso horário, e reiniciar depois
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Ajustar o caminho público e regenerar o proxy depois, se necessário
nb env update local --app-public-path /nocobase/

# Salvar a URL base do CDN para assets do cliente
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
