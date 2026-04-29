---
title: "AI 开发插件快速开始"
description: "用 AI 辅助开发 NocoBase 插件，一句话描述需求，自动生成前后端代码、数据表、权限配置和国际化。"
keywords: "AI 开发,AI Development,NocoBase AI,插件开发,AI 编程,Skills,快速开始"
---

# AI 开发插件快速开始

AI 开发插件是 NocoBase 提供的 AI 辅助插件开发能力——你可以用自然语言描述需求，AI 会自动生成完整的前后端代码，包括数据表、API、前端区块、权限和国际化。提供更加现代化、更加高效的插件开发体验。

AI 开发插件的能力基于 [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development) Skill 实现。如果你已经通过 NocoBase CLI 初始化（`nb init`），这个 Skill 会自动安装。

## 快速开始

如果你已经安装过 [NocoBase CLI](../ai/quick-start.md)，可以跳过这一步。

### 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），即可自动完成安装和配置：

```
帮我安装 NocoBase CLI 并完成初始化：https://docs.nocobase.com/cn/ai/ai-quick-start.md （请直接访问链接内容）
```

### 手动安装

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

浏览器会自动打开可视化配置页面，引导你安装 NocoBase Skills、配置数据库并启动应用。详细步骤请参阅[快速开始](../ai/quick-start.md)。

:::warning 注意

- NocoBase 正在从 `client`（v1）向 `client-v2` 迁移，目前 `client-v2` 还在开发中。AI 开发生成的客户端代码基于 `client-v2`，只能在 `/v2/` 路径下使用，供尝鲜体验，不建议直接上生产环境。
- AI 生成的代码不一定 100% 正确，建议在启用前先 review 一遍。如果运行时遇到问题，可以把错误信息发给 AI，让它继续排查和修复——通常几轮对话就能解决。
- 推荐使用 GPT 或 Claude 系列的大模型进行开发，效果最好。其他大模型也能用，不过生成质量可能会有差异。

:::

## 从一句话到一个完整插件

安装完成后，你可以直接用自然语言告诉 AI 你想开发什么插件。下面是几个真实场景，感受一下 AI 开发插件的能力。

### 一句话开发水印插件

一句提示词，AI 就能帮你生成一个完整的水印插件——包括前端渲染逻辑、防篡改检测、后端设置存储 API 和插件设置页面。

```
帮我用 nocobase-plugin-development skill 开发一个 NocoBase 的水印插件，
要求：在页面上覆盖半透明水印，显示当前登录用户名，防止截图泄密。
定时检测水印 DOM 是否被删除，被删除则重新生成。
在插件设置页里支持配置水印文字、透明度和字号。
插件名叫 @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

整个过程你只需要描述需求、做决策，剩下的事情 AI 自动处理。想看完整过程？→ [实战：开发水印插件](./watermark-plugin)

### 一句话做一个自定义字段组件

想让 integer 字段显示成星星评分？告诉 AI 你想要的展示效果，它会帮你生成自定义的 FieldModel，替换默认的字段渲染组件。

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-rating，
做一个自定义字段显示组件（FieldModel），将 integer 类型的字段渲染成星星图标，
支持 1-5 分，点击星星可以直接修改评分值并保存到数据库。
```

![Rating 组件展示效果](https://static-docs.nocobase.com/20260422170712.png)

想了解更多能力的用法，请参阅 [支持的能力](./capabilities)。

## AI 能帮你做什么

| 我想要……           | AI 能帮你做                                         |
| ------------------ | --------------------------------------------------- |
| 创建一个新插件     | 生成完整脚手架，包括前后端目录结构                  |
| 定义数据表         | 生成 Collection 定义，支持所有字段类型和关联关系    |
| 做一个自定义区块   | 生成 BlockModel + 配置面板 + 注册到「添加区块」菜单 |
| 做一个自定义字段   | 生成 FieldModel + 绑定到字段接口                    |
| 添加自定义操作按钮 | 生成 ActionModel + 弹窗/抽屉/确认框                 |
| 做一个插件设置页   | 生成前端表单 + 后端 API + 存储                      |
| 写自定义 API       | 生成 Resource Action + 路由注册 + ACL 配置          |
| 配置权限           | 生成 ACL 规则，按角色控制访问                       |
| 多语言支持         | 自动生成中英文语言包                                |
| 写升级脚本         | 生成 Migration，支持 DDL 和数据迁移                 |

每个能力的详细说明和提示词示例 → [支持的能力](./capabilities)

## 相关链接

- [实战：开发水印插件](./watermark-plugin) — 完整的 AI 开发插件实战案例，从一句话到可用插件
- [支持的能力](./capabilities) — AI 能帮你做的所有事情，附提示词示例
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase CLI 参考](../api/cli/) — 所有命令的完整参数说明
- [插件开发](../plugin-development/index.md) — NocoBase 插件开发的完整指南
- [AI 搭建快速开始](../ai-builder/index.md) — 用 AI 搭建 NocoBase 应用（无需写代码）
