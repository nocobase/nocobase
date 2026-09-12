---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Após habilitar o plugin de serviço MCP do NocoBase, o aplicativo NocoBase passa a expor uma interface de serviço MCP para que clientes MCP possam acessar e invocar as APIs do NocoBase.

## Endereço do serviço

- Aplicação principal:

  `http(s)://<host>:<port>/api/mcp`

- Sub-aplicação:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Esse endereço utiliza o protocolo de transporte `streamable HTTP`.

## Capacidades oferecidas

### Ferramentas gerais

Podem ser usadas para operar tabelas de dados.

| Nome da ferramenta  | Descrição da função                                                  |
| ------------------- | -------------------------------------------------------------------- |
| `resource_list`     | Obter lista de dados                                                 |
| `resource_get`      | Obter detalhes de um dado                                            |
| `resource_create`   | Criar dado                                                           |
| `resource_update`   | Atualizar dado                                                       |
| `resource_destroy`  | Excluir dado                                                         |
| `resource_query`    | Consultar dados, com suporte a condições complexas, agregação, joins |

### APIs do core do NocoBase e dos plugins

Você pode controlar quais pacotes têm suas APIs expostas pelo MCP através do header `x-mcp-packages`, por exemplo:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Esse header aceita o nome completo do pacote; quando não há scope, ele é completado automaticamente para `@nocobase/`.

Por padrão, nenhum pacote é carregado além das ferramentas gerais. É mais recomendado utilizar a abordagem do [NocoBase CLI](../quick-start.md) para operar outras funcionalidades do sistema.

Pacotes comuns:

| Nome do pacote                         | Descrição da função                                              |
| -------------------------------------- | ---------------------------------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Gerenciar a fonte de dados principal, criar tabelas, campos etc. |
| `@nocobase/plugin-data-source-manager` | Gerenciar fontes de dados, obter informações disponíveis         |
| `@nocobase/plugin-workflow`            | Gerenciar workflows                                              |
| `@nocobase/plugin-acl`                 | Gerenciar papéis e permissões                                    |
| `@nocobase/plugin-users`               | Gerenciar usuários                                               |

Mais pacotes e descrições de APIs relacionadas podem ser conhecidas através do plugin [API documentation](/integration/api-doc).

## Métodos de autenticação

### Autenticação via API Key

Use uma API key criada pelo plugin [API keys](/auth-verification/api-keys/index.md) para chamar a interface do serviço MCP. As permissões são determinadas pelo papel associado à API key.

### Autenticação via OAuth

Use o access token obtido após a autorização OAuth para chamar a interface do serviço MCP. As permissões são determinadas pelo usuário autorizado. Caso o usuário tenha múltiplos papéis, é possível definir o papel ativo na chamada através do header `x-role`.

## Início rápido

### Codex

#### Usando autenticação via API Key

Habilite primeiro o plugin API Keys e crie uma API Key.

```bash
export NOCOBASE_API_TOKEN=<sua_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Usando autenticação via OAuth

Habilite primeiro o plugin IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Usando autenticação via API Key

Habilite primeiro o plugin API Keys e crie uma API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <sua_api_key>"
```

#### Usando autenticação via OAuth

Habilite primeiro o plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Após executar, abra o Claude e faça login no serviço MCP correspondente:

```bash
claude
/mcp
```

### OpenCode

#### Usando autenticação via API Key

Habilite primeiro o plugin API Keys e crie uma API Key. Configure o `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <sua_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Usando autenticação via OAuth

Habilite primeiro o plugin IdP: OAuth. Configure o `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Autenticar login:

```bash
opencode mcp auth nocobase
```

Debug:

```bash
opencode mcp debug nocobase
```
