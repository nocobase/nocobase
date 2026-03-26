---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

启用 NocoBase MCP 服务插件后，NocoBase 应用会对外提供一个 MCP 服务接口，供 MCP 客户端访问和调用 NocoBase 接口。

## 服务地址

- main 应用：

  `http(s)://<host>:<port>/api/mcp`

- 非 main 应用：

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

该地址使用 `streamable HTTP` 传输协议。

支持通过请求头 `x-mcp-packages` 控制 MCP 暴露哪些包的接口，例如：

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

该请求头支持传完整包名，未带 scope 时会自动补成 `@nocobase/`。默认加载以下包接口：

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## 提供能力

- NocoBase 内核及各类插件接口
- 一个通用 CRUD 工具，可用于操作数据表

## 快速开始

### Codex

#### 使用 API Key 认证

先启用 API Keys 插件，并创建一个 API Key。

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### 使用 OAuth 认证

先启用 IdP: OAuth 插件。

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### 使用 API Key 认证

先启用 API Keys 插件，并创建一个 API Key。

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### 使用 OAuth 认证

先启用 IdP: OAuth 插件。

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

执行完成后，打开 Claude，选择对应的 MCP 服务进行登录：

```bash
claude
/mcp
```

## 配合 Skills 使用

建议配合 NocoBase Skills 一起使用，参考 [NocoBase Skills](../skills/index.md).
