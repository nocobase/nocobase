---
title: '安全与审计'
description: '了解 AI Agent 搭建 NocoBase 时的认证方式、权限控制策略、推荐实践，以及如何追溯每一次操作记录。'
keywords: 'AI 搭建,安全,权限,认证,Token,OAuth,操作记录,审计'
---

# 安全与审计

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

当用户通过 [NocoBase CLI](../ai/quick-start.md) 使用 AI Agent 操作 NocoBase 时，需要重点关注认证、权限控制和审计追溯，以确保操作边界清晰、过程可追踪。

## 认证

AI Agent 连接 NocoBase，主要有两种认证方式：

- **API key 认证**：通过 [API keys](/auth-verification/api-keys/) 插件生成 API Key，配置到 CLI 环境中，后续请求直接使用它访问 API
- **OAuth 认证**：通过浏览器完成一次 OAuth 登录认证，之后以当前用户身份访问 API

两种方式都可以配合 `nb` 命令使用，区别在于身份来源、适用场景和风险控制策略不同。

### API key 认证

API key 主要用于自动化、脚本化和长期运行的任务，例如：

- 让 AI Agent 定时同步数据
- 在开发环境里频繁调用 `nb api`
- 用固定角色执行一类明确、稳定的搭建任务

基本流程如下：

1. 在 NocoBase 中启用 API keys 插件，并创建 API Key
2. 为这个 API Key 绑定专用角色，而不是直接绑定 `root` 或管理员的完整权限
3. 用 `nb env add` 将 API 地址和 Token 保存到 CLI 环境中

例如：

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

配置完成后，AI Agent 就可以通过这个环境执行 API 调用：

```bash
nb api resource list --env local --resource users
```

这种方式稳定，适合自动化，也不需要用户每次重新登录。只要 Token 未失效，持有它的人就可以一直以绑定角色的权限访问系统，因此应特别注意：

- Token 只绑定专用角色
- 只在必要的 CLI 环境中保存
- 定期轮换，不用“永不过期”作为默认选项
- 怀疑泄漏时立即删除并重新生成

更多通用说明可参考 [NocoBase 安全指南](../security/guide.md)。

### OAuth 认证

OAuth 主要用于以当前登录用户身份执行操作的任务，例如：

- 让 AI 帮当前管理员做一次性的配置调整
- 需要将操作归属到明确的登录用户
- 不希望长期保存高权限 Token

基本流程如下：

1. 先添加 CLI 环境，认证方式选择 `oauth`
2. 运行 `nb env auth`
3. 浏览器打开认证页面，登录并完成认证
4. CLI 保存认证信息，后续 `nb api` 请求以当前用户身份访问 NocoBase
5. 如果用户有多个角色，可以通过 `--role` 指定角色

例如：

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` 会启动浏览器登录流程。成功后，CLI 会把认证信息保存到当前环境配置中，之后就可以继续让 AI Agent 调用 `nb api`。

在当前默认实现下：

- OAuth 访问令牌有效期为 **10 分钟**
- OAuth 刷新令牌有效期为 **30 天**

CLI 会在访问令牌临近过期时，优先使用刷新令牌自动刷新会话；如果刷新令牌已过期、不可用，或者服务端未返回刷新令牌，则需要重新执行 `nb env auth`。

OAuth 的特点是请求通常以当前登录用户及其角色上下文执行，审计记录也更容易对应到实际操作者。这种方式更适合人工参与、需要确认身份的操作。

### 推荐实践

推荐按以下原则选择：

- **开发、测试、自动化任务**：优先用 API key，但务必绑定专用角色
- **生产环境、人工参与、需要强身份归属**：优先用 OAuth
- **高风险操作**：即使技术上可以用 Token，也建议改用 OAuth，并由具备相应权限的用户完成认证后执行

如果没有明确要求，可以按以下默认原则处理：

- **默认用 OAuth**
- **只有在明确需要自动化、无人值守或批量执行时，才使用 API key**

## 权限控制

AI Agent 本身没有“额外权限”，它能做什么，完全取决于当前使用的身份和角色。

也就是说：

- 用 API key 访问时，权限边界由这个 Token 绑定的角色决定
- 用 OAuth 访问时，权限边界由当前登录用户和当前角色决定

AI 不会绕过 NocoBase 的 ACL 体系。如果一个角色没有某个数据表、字段、页面或插件配置权限，AI Agent 即使知道对应命令，也无法成功执行。

### 角色与权限策略

推荐为 AI Agent 单独准备一个角色，而不是复用现有管理员角色。

这个角色通常只需要开放以下范围内的权限：

- 允许操作哪些数据表
- 允许执行哪些动作，例如查看、创建、更新、删除
- 是否允许访问某些页面或菜单
- 是否允许进入系统设置、插件管理、权限配置等高风险区域

例如，你可以创建一个 `ai_builder_editor` 角色，只允许它：

- 管理 CRM 相关的数据表
- 编辑指定页面
- 触发部分工作流
- 不允许修改角色权限
- 不允许启用、禁用、安装插件
- 不允许删除关键数据表

如果需要让 AI 协助配置权限，可以配合 [权限配置](./acl.md) 完成，但仍建议先由人工确定权限边界。

### 最小权限原则

最小权限原则在 AI 搭建场景中尤其重要，可以采用以下做法：

1. 先为 AI 创建专用角色
2. 初始只开放查看权限
3. 根据任务逐步补充创建、编辑等必要权限
4. 对删除、权限修改、插件管理等高风险操作保持人工控制

例如：

- 用于内容录入的 AI，只需要目标数据表的查看和创建权限
- 用于页面搭建的 AI，只需要相关页面和 UI 配置权限
- 用于数据建模的 AI，只给测试环境开放表结构修改权限，不直接给生产环境

不建议直接将 `root`、`admin` 或具备全局系统配置能力的角色绑定给 AI Agent。这种做法虽然部署简单，但会显著扩大权限暴露面。

## 日志

在 AI 搭建场景中，日志用于支持操作追溯与问题定位。

重点关注以下两类日志：

- **请求日志**：记录接口请求的路径、方法、状态码、耗时和请求来源等信息
- **审计日志**：记录关键资源操作的执行主体、操作对象、结果和相关元数据

通过 `nb api` 发起请求时，CLI 会自动附带 `x-request-source: cli` 请求头，服务端可据此识别该请求来自 CLI。

### 请求日志

请求日志用于记录接口调用信息，包括请求路径、响应状态、耗时和来源标记。

日志文件通常位于：

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

在 `nb api` 调用场景下，请求日志里会带上：

- `req.header.x-request-source`

据此可以区分 CLI 请求与普通浏览器请求。

关于请求日志目录和字段说明，可参考 [NocoBase 服务端日志](../log-and-monitor/logger/index.md)。

### 审计日志

审计日志用于记录关键操作的执行主体、目标资源、执行结果和相关请求信息。

对于已纳入审计范围的操作，日志中会记录：

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

例如，当 AI 通过 CLI 调用 `collections:apply`、`fields:apply` 或其他已启用审计的写操作时，审计日志中会记录 `x-request-source: cli`，便于区分界面操作与 CLI 发起的操作。

关于审计日志的详细说明，可参考 [审计日志](../security/audit-logger/index.md)。

## 安全建议

以下是几条更适合 AI 搭建场景的实践建议：

- 不要给 AI Agent 直接绑定 `root`、`admin` 或全局系统配置角色
- 为 AI Agent 创建专用角色，并按任务拆分权限边界
- API key 定期轮换，避免长期复用同一个高权限 Token
- 先在测试环境验证数据建模、页面结构和工作流变更，再同步到生产环境
- 启用并定期检查请求日志和审计日志，确保关键操作可追溯
- 对删除数据、修改权限、启停插件、调整系统配置这类高风险操作，建议人工确认后再执行
- 如果 AI 需要长期运行，优先拆分为多个低权限环境，避免集中使用单一高权限环境

## 相关链接

- [AI 搭建快速开始](./index.md) — 安装和环境准备
- [环境管理](./env-bootstrap) — 环境检查、添加环境和故障诊断
- [权限配置](./acl.md) — 配置角色、权限策略和风险评估
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase 安全指南](../security/guide.md) — 更全面的安全配置建议
- [NocoBase 服务端日志](../log-and-monitor/logger/index.md) — 请求日志目录和字段说明
- [审计日志](../security/audit-logger/index.md) — 审计记录字段和使用说明
- [NocoBase MCP](../ai/mcp/index.md) — 通过 MCP 协议连接 AI Agent
