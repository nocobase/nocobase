---
title: "AI 开发"
description: "用 AI 辅助开发 NocoBase 插件，一句话描述需求，自动生成前后端代码、数据表、权限配置和国际化。"
keywords: "AI 开发,AI Development,NocoBase AI,插件开发,AI 编程,Skills"
---

# AI 开发

用一句话描述你想要的插件，AI 帮你生成完整的前后端代码——包括数据表、API、前端区块、权限和国际化。你不需要学新的框架或工具，AI 会遵循 NocoBase 插件规范，生成的代码可以直接用。

<!-- 需要一段 30 秒左右的视频：输入一句提示词 → AI 生成水印插件 → 启用后页面出现水印效果 -->

比如，一句提示词就能生成一个完整的水印插件：

```
帮我用 nocobase-plugin-development skill 实现一个 NocoBase 的水印插件，要求：在页面上覆盖半透明水印，显示当前登录用户名，
防止截图泄密。定时检测水印 DOM 是否被删除，被删除则重新生成。
在插件设置页里支持配置水印文字、透明度和字号。
插件名叫 @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

AI 会自动完成：创建插件脚手架、编写前端渲染逻辑和防篡改检测、生成后端设置存储 API、搭建插件设置页面、配置权限和国际化。整个过程你只需要描述需求，做决策，剩下的事情 AI 会自动处理。

想看完整过程？→ [实战：开发水印插件](./watermark-plugin)

:::warning 注意

NocoBase 正在从 `client`（v1）向 `client-v2` 迁移，目前 `client-v2` 还在开发中。AI 开发生成的客户端代码基于 `client-v2`，只能在 `/v2/` 路径下使用，供尝鲜体验，不建议直接上生产环境。

:::

## 快速开始

### 前置条件

- 一个已经跑起来的 NocoBase 开发环境（[安装指南](/cn/get-started/nocobase-cli)）
- 一个支持 AI Agent 的编辑器或 CLI 工具（比如 Claude Code、Codex、Cursor、VS Code + Copilot、Trae 等）

### 安装 Skills

在你的 NocoBase 项目根目录下运行：

```bash
npx skills add nocobase/skills -y
```

Skills 是 AI Agent 理解 NocoBase 插件开发规范的知识包——安装之后，AI 就知道怎么写符合规范的插件代码了。

### 开始开发

直接用自然语言告诉 AI 你想做什么：

```
帮我开发一个 NocoBase 插件，功能是 [你的需求描述]
```

AI 会先分析需求、给你一个开发计划，确认后再开始写代码。生成的插件可以直接启用：

```bash
yarn pm enable <plugin-name>
```

## AI 能帮你做什么

- **插件脚手架** — 生成完整的前后端目录结构
- **数据表定义** — 生成 Collection，支持所有字段类型和关联关系
- **自定义区块** — 生成 BlockModel + 配置面板 + 注册到菜单
- **自定义字段** — 生成 FieldModel + 绑定到字段接口
- **自定义操作** — 生成 ActionModel + 弹窗/确认框
- **插件设置页** — 前端表单 + 后端 API + 存储
- **自定义 API** — Resource Action + 路由注册 + ACL 配置
- **权限配置** — 按角色控制访问
- **国际化** — 自动生成中英文语言包
- **升级脚本** — 生成 Migration，支持 DDL 和数据迁移

每个能力的详细说明和提示词示例 → [支持的能力](./capabilities)

## 相关链接

- [实战：开发水印插件](./watermark-plugin) — 完整的 AI 开发实战案例，从一句话到可用插件
- [支持的能力](./capabilities) — AI 能帮你做的所有事情，附提示词示例
- [插件开发](/cn/plugin-development) — NocoBase 插件开发的完整指南
- [NocoBase CLI](/cn/get-started/nocobase-cli) — 安装和管理 NocoBase 的命令行工具
- [AI 搭建](/cn/ai-builder) — 用 AI 搭建 NocoBase 应用（无需写代码）
