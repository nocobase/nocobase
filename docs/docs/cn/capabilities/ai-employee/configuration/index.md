---
title: 'AI 员工配置参考'
description: '通过 config.yml 配置 NocoBase AI 员工的 LLM、附件存储、Skill 目录和 MCP 服务。'
keywords: 'NocoBase,config.yml,ai.llmServices,ai.storage,ai.skills,ai.mcpServers'
---

# AI 员工配置参考

AI 员工的部署级配置位于应用根目录的 `config.yml` 的 `ai` 节点下。这里用于声明 LLM 和 MCP 连接、凭据引用、存储磁盘和额外 Skill 目录。MCP 服务只能在 `config.yml` 中配置。员工角色和 Tool 代码仍放在应用源码中；用户可调整的员工和模型状态由管理页保存。

## 完整结构

```yaml
ai:
  storage:
    disk:
      - local
  aiEmployee:
    storage:
      disk:
        - ai-files
  skills:
    paths:
      - /srv/nocobase/ai-skills # 部署环境提供的绝对路径
  llmServices:
    openai: # 键就是服务名
      title: OpenAI
      provider: openai
      enabledModels:
        - label: GPT-5.6
          value: gpt-5.6
      enabled: true
      sort: 10
  mcpServers:
    company-search:
      transport: http
      url: https://search.internal/mcp
```

`llmServices` 和 `mcpServers` 都以服务名为键。密钥用 `pnpm nocobase config set --from-env` 写进 `config.yml`，由运行环境注入时在 `server/config/ai.ts` 的 `env` 里声明映射，做法见[快速开始 · 第二步](../quick-start.md#第二步配置密钥并重启)。密钥不要写进任何入库的文件，也不要放到 `config.yml` 的 `client` 块，这个块会下发到浏览器。

`ai.skills.paths` 可以写绝对路径，也可以写相对于应用根目录的路径，不过应用根目录在开发和部署时不是同一个目录：开发时是源码根目录，构建后的服务从 `dist/` 运行，相对路径会解析到 `dist/` 里，而构建不会复制这个目录，于是它被悄悄跳过，也不会有任何提示。构建只会复制应用自己的 `ai/skills`。部署环境请写部署环境自己提供的绝对路径，详见 [注册 Skill](../development/skill.md#skill-怎样被加载)。

## 修改后重启

服务只在启动时读取环境变量、`config.yml` 和 `.env`。修改其中任何一项，都要重启服务才会生效；启动时 LLM 和 MCP 配置会重新同步。修改 Employee、Tool 和 Skill 等静态资源同样要重启服务。

环境变量还要先在启动服务的终端里生效：执行 `source` 重新加载 shell 配置文件，或者重开一个终端，再从这个终端重启服务。已经在运行的进程不会读到新设置的变量。

## 数据所有权

| 配置                    | 谁是权威来源                        | 管理页能做什么                             |
| ----------------------- | ----------------------------------- | ------------------------------------------ |
| `ai.llmServices`        | `config.yml` 中的服务名称和连接结构 | 保留并调整已有服务的 Enabled 和模型列表    |
| `ai.mcpServers`         | `config.yml` 中的服务全集           | 启用服务、查看 Tool 和调整权限，不增删连接 |
| `ai.aiEmployee.storage` | `config.yml`                        | 管理页不修改                               |
| `ai.skills.paths`       | `config.yml`                        | 管理页可把已加载 Skill 绑定给员工          |

## 相关链接

- [LLM 服务](./llm.md) — Provider、模型和连接字段
- [附件存储](./storage.md) — AI Employee 文件磁盘优先级
- [MCP 服务](./mcp.md) — `stdio`、`http` 和 `sse` 配置
- [管理 AI 服务](../management/index.md) — 查看运行时同步结果
- [注册 Skill](../development/skill.md) — Skill 目录的加载顺序和路径解析
