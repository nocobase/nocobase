# NocoBase Skills

> [!WARNING]
> NocoBase Skills 仍处于草稿阶段，仅供参考，后续可能随时调整和迭代。

[NocoBase Skills](https://github.com/nocobase/skills) 提供了一组可复用的 NocoBase Skills，可用于 Codex、Claude Code、OpenCode 等 coding agent CLI，帮助你更高效地完成安装、数据建模、界面搭建和工作流配置等任务。

## 安装

1. 安装一个 coding agent CLI。例如 Codex、Claude Code 或 OpenCode。

2. 通过 [skills.sh](https://skills.sh/) 安装 Skills。

安装该仓库中的全部 NocoBase Skills：

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## 推荐使用流程

1. 安装 NocoBase（如果已经安装可以跳过）。

可以直接让 agent 帮你完成：

```text
Install and start NocoBase.
```

2. 配置 NocoBase MCP Server。

也可以直接让 agent 帮你配置：

```text
Set up NocoBase MCP connection.
```

也可以手动配置，参考：[NocoBase MCP](../mcp/index.md)

3. 开始进行数据建模和业务搭建。

例如，你可以直接告诉 agent：

```text
I am building a CRM, design and create collections.
```

完成 MCP 连接后，大部分 NocoBase API 都可以通过 MCP tools 调用。
