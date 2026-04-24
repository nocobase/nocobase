---
title: "实战：开发水印插件"
description: "用 AI 一句话开发一个 NocoBase 水印插件：页面覆盖水印、防篡改检测、可配置水印参数。"
keywords: "AI 开发,水印插件,NocoBase 插件,实战案例,AI 编程"
---

# 实战：开发水印插件

这个案例展示怎么用一句话让 AI 开发一个完整的 NocoBase 水印插件——从创建脚手架到启用验证，全程由 AI 完成。

## 最终效果

插件启用后：

- NocoBase 页面上覆盖半透明水印，显示当前登录用户名
- 水印无法通过删除 DOM 移除——定时检测会自动重新生成
- 在「插件配置」里可以调整水印文字、透明度和字号

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## 前置条件

:::tip 前置阅读

- [NocoBase CLI](../ai/quick-start.md) — 安装和启动 NocoBase
- [AI 开发插件快速开始](./index.md) — 安装 Skills

:::

确保你已经：

1. 有一个跑起来的 NocoBase 开发环境（NocoBase CLI 初始化时会自动安装 NocoBase Skills）
2. 打开了支持 AI Agent 的编辑器（比如 Claude Code、Codex、Cursor 等）

:::warning 注意

- NocoBase 正在从 `client`（v1）向 `client-v2` 迁移，目前 `client-v2` 还在开发中。AI 开发生成的客户端代码基于 `client-v2`，只能在 `/v2/` 路径下使用，供尝鲜体验，不建议直接上生产环境。
- AI 生成的代码不一定 100% 正确，建议在启用前先 review 一遍。如果运行时遇到问题，可以把错误信息发给 AI，让它继续排查和修复——通常几轮对话就能解决。

:::

## 开始

在你的 NocoBase 项目根目录下，把下面的提示词发给 AI：

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

## AI 做了什么

AI 收到需求后，会按以下步骤自动执行：

### 1. 分析需求并确认计划

AI 会先分析这个插件需要哪些 NocoBase 扩展点，然后给你一个开发计划。比如：

> **服务端：**
> - 一张 `watermarkSettings` 数据表，存储水印配置（文字、透明度、字号）
> - 一个自定义 API，读写水印配置
> - ACL 配置，登录用户可读，管理员可写
>
> **客户端：**
> - 插件设置页，用表单配置水印参数
> - 水印渲染逻辑，读取配置后在页面覆盖水印
> - 防篡改检测，定时器监控水印 DOM

确认计划后，AI 开始写代码。

<!-- 需要一张 AI 输出开发计划的终端截图 -->

### 2. 创建插件脚手架

```bash
yarn pm create @my-project/plugin-watermark
```

AI 在 `packages/plugins/@my-project/plugin-watermark/` 下生成了标准的插件目录结构。

### 3. 编写服务端代码

AI 会生成以下文件：

- **数据表定义** — `watermarkSettings` 表，包含 `text`、`opacity`、`fontSize` 字段
- **自定义 API** — 读取和更新水印配置的接口
- **ACL 配置** — 登录用户可读取水印配置，管理员可修改

<!-- 需要一张终端截图，展示 AI 正在生成服务端代码的过程 -->

### 4. 编写客户端代码

- **插件设置页** — 一个 Ant Design 表单，配置水印文字、透明度（滑块）、字号
- **水印渲染** — 在页面上创建全屏 canvas/div 覆盖层，显示当前登录用户名
- **防篡改检测** — `MutationObserver` + 定时器双重保障，DOM 被删除会立即重新生成

<!-- 需要一张终端截图，展示 AI 正在生成客户端代码的过程 -->

### 5. 国际化

AI 自动生成中英文语言包，不需要你额外操作：

- `src/locale/zh-CN.json` — 中文翻译
- `src/locale/en-US.json` — 英文翻译

### 6. 启用插件

```bash
yarn pm enable @my-project/plugin-watermark
```

启用后，打开 NocoBase 页面，你就能看到水印覆盖在内容上方了。

<!-- 需要一段视频：从输入提示词 → AI 生成代码 → 启用插件 → 页面出现水印 → 打开设置页调整参数 → 水印跟着变化 的完整流程 -->

## 整个过程花了多久

从输入提示词到插件可用，大概 **3-5 分钟**。AI 完成了以下工作：

| 工作              | 手动开发预估 | AI 完成     |
| ----------------- | ------------ | ----------- |
| 创建脚手架        | 2 分钟       | 自动        |
| 数据表 + API      | 20 分钟      | 自动        |
| 插件设置页        | 30 分钟      | 自动        |
| 水印渲染 + 防篡改 | 40 分钟      | 自动        |
| ACL 配置          | 10 分钟      | 自动        |
| 国际化            | 15 分钟      | 自动        |
| **合计**          | **~2 小时**  | **~5 分钟** |


## 想做更多的插件？

水印插件主要涉及前端渲染和简单的后端存储。如果你想了解 AI 还能帮你做哪些事——比如自定义区块、复杂的数据表关联、工作流扩展等——可以看看 [支持的能力](./capabilities)。

## 相关链接

- [AI 开发插件快速开始](./index.md) — 快速开始和能力总览
- [支持的能力](./capabilities) — AI 能帮你做的所有事情，附提示词示例
- [插件开发](../plugin-development/index.md) — NocoBase 插件开发的完整指南
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
