---
title: "支持的能力"
description: "AI 开发支持的所有能力：脚手架、数据表、区块、字段、操作、设置页、API、权限、国际化、升级脚本。"
keywords: "AI 开发,能力,插件开发,脚手架,数据表,区块,字段,操作,权限,国际化"
---

# 支持的能力

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 开发插件快速开始](./index.md) 完成了环境准备。

:::

AI 开发插件的能力基于 [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development) Skill 实现。如果你已经通过 [NocoBase CLI](../ai/quick-start.md) 初始化（`nb init`），这个 Skill 会自动安装。

下面列出了 AI 目前能帮你做的所有事情。每个能力都附有提示词示例，你可以直接复制、改改需求描述就能用。

:::warning 注意

- NocoBase 正在从 `client`（v1）向 `client-v2` 迁移，目前 `client-v2` 还在开发中。AI 开发生成的客户端代码基于 `client-v2`，只能在 `/v2/` 路径下使用，供尝鲜体验，不建议直接上生产环境。
- AI 生成的代码不一定 100% 正确，建议在启用前先 review 一遍。如果运行时遇到问题，可以把错误信息发给 AI，让它继续排查和修复——通常几轮对话就能解决。
- 推荐使用 GPT 或 Claude 系列的大模型进行开发，效果最好。其他大模型也能用，不过生成质量可能会有差异。

:::

## 最佳实践

- **明确告诉 AI 要创建或改造一个 NocoBase 插件，并提供插件名**——比如「请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-rating」。不提供插件名的话，AI 可能不知道往哪里生成代码。
- **提示词里明确指定使用 nocobase-plugin-development skill**——比如「请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件……」。这样 AI Agent 能直接读取 Skills 的能力，避免进入 plan 模式而忽略 Skills。
- **在 NocoBase 源码仓库的根目录下运行 AI Agent**——这样 AI 能自动找到项目结构、依赖和已有插件。如果你不在源码根目录，需要额外告诉 AI Agent 源码仓库的路径。

## 快速索引

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

## 插件脚手架

AI 可以根据你的需求描述，生成一个完整的 NocoBase 插件目录结构——包括前后端入口文件、类型定义和基础配置。

提示词示例：

```
帮我创建一个 NocoBase 插件，插件名叫 @my-scope/plugin-todo
```

AI 会执行 `yarn pm create @my-scope/plugin-todo` 并生成标准目录：

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## 数据表定义

AI 支持生成所有 NocoBase 字段类型的 Collection 定义，包括关联关系（一对多、多对多等）。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-order，
然后在里面定义一张"订单"表，字段包括：订单编号（自增）、客户名称（字符串）、
金额（小数）、状态（单选：待处理/处理中/已完成）、创建时间。
订单和客户是多对一关系。
```

AI 会生成 `defineCollection` 定义，包含字段类型、默认值、关联配置等。

## 自定义区块

区块是 NocoBase 前端最核心的扩展方式。AI 可以帮你生成区块模型、配置面板和菜单注册。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-simple-block，
做一个自定义展示区块（BlockModel），用户可以在配置面板里输入 HTML 内容，
区块把这些 HTML 渲染出来。把这个区块注册到「添加区块」菜单里。
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

AI 会生成 `BlockModel`、通过 `registerFlow` + `uiSchema` 创建配置面板，并注册到「添加区块」菜单。

完整示例参考 [做一个自定义展示区块](../plugin-development/client/examples/custom-block)。

## 自定义字段组件

如果 NocoBase 内置的字段渲染组件不满足需求，AI 可以帮你做一个自定义的显示组件，替换默认的字段渲染方式。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-rating，
做一个自定义字段显示组件（FieldModel），将 integer 类型的字段渲染成星星图标，
支持 1-5 分，点击星星可以直接修改评分值并保存到数据库。
```

![Rating 组件展示效果](https://static-docs.nocobase.com/20260422170712.png)

AI 会生成自定义的 `FieldModel`，替换 integer 字段的默认渲染组件。

## 自定义操作

操作按钮可以出现在区块顶部（collection 级别）、表格每行的操作列（record 级别），或者两个位置同时出现。点击后可以弹出提示、打开表单弹窗、调用 API 等。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-simple-action，
做三个自定义操作按钮（ActionModel）：
1. 一个 collection 级别的按钮，出现在区块顶部，点击后弹出成功提示
2. 一个 record 级别的按钮，出现在表格每行的操作列，点击后显示当前记录的 ID
3. 一个 both 级别的按钮，同时出现在两个位置，点击后弹出信息提示
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

AI 会生成 `ActionModel`，通过 `ActionSceneEnum` 控制按钮出现的位置，通过 `registerFlow({ on: 'click' })` 处理点击事件。

完整示例参考 [做一个自定义操作按钮](../plugin-development/client/examples/custom-action)。

## 插件设置页

很多插件需要一个设置页面让用户配置参数——比如第三方服务的 API Key、Webhook 地址等。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-settings-page，
做一个插件设置页，在「插件配置」菜单下注册一个「外部服务配置」入口，包含两个 Tab：
1.「API 配置」Tab：表单包含 API Key（字符串，必填）、API Secret（密码，必填）、Endpoint（字符串，选填），通过后端 API 保存到数据库
2.「关于」Tab：展示插件名称和版本信息
前端用 Ant Design 表单组件，后端定义 externalApi:get 和 externalApi:set 两个接口。
```

![插件设置页效果](https://static-docs.nocobase.com/20260415160006.png)

AI 会生成前端设置页组件、后端 Resource Action、数据表定义和 ACL 配置。

完整示例参考 [做一个插件设置页](../plugin-development/client/examples/settings-page)。

## 自定义 API

如果内置的 CRUD 接口不够用，AI 可以帮你写自定义的 REST API。下面是一个前后端联动的完整示例——后端定义数据表和 API，前端做自定义区块展示数据。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-todo，
做一个前后端联动的 Todo 数据管理插件：
1. 后端定义一张 todoItems 表，字段包括 title（字符串）、completed（布尔）、priority（字符串，默认 medium）
2. 前端做一个自定义 TableBlock，只显示 todoItems 的数据
3. priority 字段用彩色 Tag 展示（high 红色、medium 橙色、low 绿色）
4. 加一个"新建 Todo"按钮，点击弹出表单创建记录
5. 已登录用户可以进行所有 CRUD 操作
```

![Todo 数据管理插件效果](https://static-docs.nocobase.com/20260408164204.png)

AI 会生成服务端 Collection 定义、Resource Action、ACL 配置，以及客户端的 `TableBlockModel`、自定义 `FieldModel` 和 `ActionModel`。

完整示例参考 [做一个前后端联动的数据管理插件](../plugin-development/client/examples/fullstack-plugin)。

## 权限配置

AI 会自动为生成的 API 和资源配置合理的 ACL 规则。你也可以在提示词里明确指定权限需求：

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-todo，
定义一张 todoItems 数据表（title、completed、priority 字段），
权限要求：已登录用户可以查看、创建和编辑，只有 admin 角色可以删除。
```

AI 会在服务端通过 `this.app.acl.allow()` 配置对应的访问规则。

## 国际化

AI 默认会生成中英文两个语言包（`zh-CN.json` 和 `en-US.json`），你不需要额外提。

如果有其他语言需求：

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-order，
需要支持中文、英文和日文三个语言包
```

## 升级脚本

当插件需要更新数据库结构或迁移数据时，AI 可以帮你生成 Migration 脚本。

提示词示例：

```
请你用 nocobase-plugin-development skill 帮我给 NocoBase 插件 @my-scope/plugin-order 写一个升级脚本，
给"订单"表新增一个"备注"字段（长文本，选填），并且把现有订单的备注字段默认填上"无"。
```

AI 会生成带版本号的 Migration 文件，包含 DDL 操作和数据迁移逻辑。

## 相关链接

- [AI 开发插件快速开始](./index.md) — 快速开始和能力总览
- [实战：开发水印插件](./watermark-plugin) — 完整的 AI 开发插件实战案例
- [插件开发](../plugin-development/index.md) — NocoBase 插件开发的完整指南
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
