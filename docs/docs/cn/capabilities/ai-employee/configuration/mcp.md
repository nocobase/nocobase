---
title: 'MCP 服务配置'
description: '通过 config.yml 配置 stdio、HTTP 和 SSE MCP 服务。'
keywords: 'MCP,Model Context Protocol,stdio,http,sse,config.yml'
---

# MCP 服务配置

MCP 服务只能通过应用根目录的 `config.yml` 配置。`ai.mcpServers` 以对象键作为服务的稳定名称，并以整个配置集合为权威来源；管理页不负责创建、编辑或删除连接。

## Stdio 服务

`stdio` 在 NocoBase Server 进程的运行环境中启动子进程：

```yaml
ai:
  mcpServers:
    filesystem:
      transport: stdio
      command: npx
      args:
        - -y
        - '@modelcontextprotocol/server-filesystem'
        - /srv/nocobase/shared
      # env.MCP_API_KEY 用 config set --from-env 写入
```

`command` 必须在部署环境中可执行，`args` 是字符串数组，`env` 会传给 MCP 子进程。使用最小目录和最小凭据，不要让文件系统 MCP 访问整个主机。

## HTTP 服务

```yaml
ai:
  mcpServers:
    company-search:
      transport: http
      url: https://search.internal/mcp
      # headers.Authorization 用 config set --from-env 写入
```

HTTP 服务使用 `url` 和可选 `headers`。旧服务只支持 Server-Sent Events Transport 时，可以把 `transport` 改为 `sse`，字段仍使用 `url` 和 `headers`。

## 凭据

凭据和 LLM 密钥一样，用 `pnpm nocobase config set --from-env` 写入，例如 `ai.mcpServers.company-search.headers.Authorization`，做法见[快速开始 · 第二步](../quick-start.md#第二步配置密钥并重启)。由运行环境注入时，在 `server/config/ai.ts` 的 `env` 里声明映射。无论哪种方式，设置的都是整个值，所以需要 `Bearer` 前缀的 Header，要写入完整的 `Bearer <token>`。不要把 Token 直接提交到 YAML，也不要把 MCP 密钥放进 `config.yml` 的 `client` 块，这个块会下发到浏览器。

凭据放在 HTTP、SSE 服务的 `headers` 里，或者 `stdio` 服务的 `env` 里，不要写进 `url` 或 `args`。管理接口返回服务配置时，会把名称像密钥的 Header 和环境变量（比如 `Authorization`、`token`、`api_key`）遮住，但 `url` 和 `args` 原样返回，写在查询参数里的 Token 会被每个打开管理页的管理员看到。

所有值，无论是否被遮住，都以明文保存在数据库 `aiMcpClients` 表中这个服务的记录上，也会随数据库备份一起保存。所以给 MCP 服务的凭据只授予它的 Tool 真正需要的权限。

## 重启和诊断

服务重启后会同步新增、更新和删除的服务，并重建 MCP Client。打开设置页侧栏「AI」分组中的「MCP 服务」页（`/settings/ai/mcp-services`），可以启用服务并查看它发现的 Tool。

服务条目里可以写 `enabled`，但它只在服务第一次被创建时生效。之后启用状态以管理页的开关为准，开关和 Tool 权限都保存在数据库中，重启后保持不变。

构建 MCP Client 时（服务启动，或在管理页打开、关闭某个服务时）连不上的服务会被跳过，并在服务端日志里记一条警告，写明服务名称；应用照常启动，其他服务正常连接，只是这个服务的 Tool 暂时不可用。两次构建之间不会自动重试，远程服务恢复之后，在管理页把它关掉再打开，或者重启服务。对话里找不到某个 MCP Tool 时，先看日志里有没有这条警告。

开关和 Tool 权限跟着服务名称走。从 `config.yml` 删掉一个服务会删除它的记录；改名等于删掉旧服务、新建一个服务。两种情况都会丢掉管理员设置过的开关和 Tool 权限：服务按 `config.yml` 的 `enabled` 重新创建，每个 Tool 回到按名称推断的默认权限。

![MCP 服务和 Tool](https://static-docs.nocobase.com/20260914111142-ai-employee-mcp-services.png)

管理页是只读连接视图。需要修改 URL、命令、参数或 Header 时，编辑 `config.yml` 后重启服务。

## 发现的 Tool

MCP 服务发现的 Tool 注册为 `GENERAL` Tool，注册名是 `mcp-<服务名>-<Tool 名>`，比如上面 `company-search` 服务的 `search` Tool 会注册成 `mcp-company-search-search`。服务连上之后所有员工都能用到它；在 Skill 的 `tools`、员工的 `tools` 或会话的 `skillSettings` 中引用时，使用这个完整的注册名。

名称以 `get` 开头的 Tool 默认权限是 `ALLOW`，其他默认 `ASK`。这个默认值只是根据名称推断，可以在管理页逐个调整，详见 [MCP 服务管理](../management/mcp-services.md#设置-tool-权限)。

## 安全建议

- 只连接可信 MCP 服务
- 为远程服务使用最小权限凭据和 TLS
- 为 `stdio` 限制可执行命令、工作目录和文件范围
- 检查每个发现 Tool 的描述和参数，再允许员工使用
- 对写入或外部副作用 Tool 保持 `ASK`

## 相关链接

- [MCP 服务管理](../management/mcp-services.md) — 启用服务、查看 Tool 并调整权限
- [注册 Tool](../development/tool.md) — 了解 Tool 权限
