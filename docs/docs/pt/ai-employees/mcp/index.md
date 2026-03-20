---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

Depois de habilitar o plugin NocoBase MCP Server, sua aplicação NocoBase passa a expor um endpoint MCP para que clientes MCP possam acessar e chamar as APIs do NocoBase.

## URL do servidor

- Aplicação principal:

  `http(s)://<host>:<port>/api/mcp`

- Aplicação que não é principal:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Esse endpoint usa o transporte `streamable HTTP`.

## Capacidades

- APIs do núcleo do NocoBase e de seus plugins
- Uma ferramenta CRUD genérica para trabalhar com tabelas de dados

## Início rápido

### Codex

#### Autenticação com API Key

Primeiro, habilite o plugin API Keys e crie uma API key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Autenticação com OAuth

Primeiro, habilite o plugin IdP: OAuth.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Autenticação com API Key

Primeiro, habilite o plugin API Keys e crie uma API key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Autenticação com OAuth

Primeiro, habilite o plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

Depois, abra o Claude e faça login no serviço MCP correspondente:

```bash
claude
/mcp
```

## Uso com Skills

Recomenda-se usar o NocoBase MCP junto com NocoBase Skills. Veja [NocoBase Skills](../skills/index.md).
