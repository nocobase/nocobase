---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

启用 NocoBase MCP 服务插件后，NocoBase 应用会对外提供一个 MCP 服务接口，供 MCP 客户端访问和调用 NocoBase 接口。

## 服务地址

- 主应用：

  `http(s)://<host>:<port>/api/mcp`

- 子应用：

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

该地址使用 `streamable HTTP` 传输协议。

## 提供能力

### 通用工具

可用于操作数据表

| 工具名称           | 功能描述                                       |
| ------------------ | ---------------------------------------------- |
| `resource_list`    | 获取数据列表                                   |
| `resource_get`     | 获取数据详情                                   |
| `resource_create`  | 创建数据                                       |
| `resource_update`  | 更新数据                                       |
| `resource_destroy` | 删除数据                                       |
| `resource_query`   | 查询数据，支持复杂查询条件，如聚合、关联查询等 |

### NocoBase 内核及各类插件接口

支持通过请求头 `x-mcp-packages` 控制 MCP 暴露哪些包的接口，例如：

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

该请求头支持传完整包名，未带 scope 时会自动补成 `@nocobase/`。

默认不加载通用工具以外的其他包接口，更推荐使用 [NocoBase CLI](../quick-start.md) 的方式来操作其他系统功能。

常用包说明：

| 包名                                   | 功能描述                                 |
| -------------------------------------- | ---------------------------------------- |
| `@nocobase/plugin-data-source-main`    | 管理主数据源，包括创建数据表、添加字段等 |
| `@nocobase/plugin-data-source-manager` | 管理数据源，获取可用数据源信息           |
| `@nocobase/plugin-workflow`            | 管理工作流                               |
| `@nocobase/plugin-acl`                 | 管理角色和权限                           |
| `@nocobase/plugin-users`               | 管理用户                                 |

更多包和相关接口说明可以通过 [API 文档](/integration/api-doc) 插件了解。

## 鉴权方式

### API Key 认证

通过 [API keys](/auth-verification/api-keys/index.md) 插件创建的 API key 来调用 MCP 服务接口，权限由 API key 所绑定的角色决定。

### OAuth 认证

通过 OAuth 认证授权后获取的 access token 来调用 MCP 服务接口，权限由授权的用户决定。如果用户有多个角色，可以通过请求头 `x-role` 来设置调用角色。

## 快速开始

### Codex

#### 使用 API Key 认证

先启用 API Keys 插件，并创建一个 API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### 使用 OAuth 认证

先启用 IdP: OAuth 插件。

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### 使用 API Key 认证

先启用 API Keys 插件，并创建一个 API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### 使用 OAuth 认证

先启用 IdP: OAuth 插件。

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

执行完成后，打开 Claude，选择对应的 MCP 服务进行登录：

```bash
claude
/mcp
```

### OpenCode

#### 使用 API Key 认证

先启用 API Keys 插件，并创建一个 API Key. 配置 `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### 使用 OAuth 认证

先启用 IdP: OAuth 插件。配置 `opencode.json`:

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

登录认证

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
