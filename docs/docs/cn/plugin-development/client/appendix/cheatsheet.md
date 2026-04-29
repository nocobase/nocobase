---
title: "插件开发速查表"
description: "NocoBase 插件开发速查表：做什么 → 在哪个文件 → 调什么 API，快速定位代码放在哪里。"
keywords: "速查表,Cheatsheet,注册方式,文件位置,NocoBase"
---

# 插件开发速查表

写插件的时候经常会想"这个东西到底该写在哪个文件、调哪个 API"。这张速查表帮你快速定位。

## 插件目录结构

通过 `yarn pm create @my-project/plugin-name` 创建插件，会自动生成以下目录结构。不要手动创建目录，避免遗漏注册步骤导致插件不生效。详见 [编写第一个插件](../../write-your-first-plugin)。

```bash
plugin-name/
├── src/
│   ├── client-v2/              # 客户端代码（v2）
│   │   ├── plugin.tsx          # 客户端插件入口
│   │   ├── locale.ts           # useT / tExpr 翻译 hook
│   │   ├── models/             # FlowModel（区块、字段、操作）
│   │   └── pages/              # 页面组件
│   ├── client/                 # 客户端代码（v1，兼容）
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # 服务端代码
│   │   ├── plugin.ts           # 服务端插件入口
│   │   └── collections/        # 数据表定义
│   └── locale/                 # 多语言翻译文件
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # 根目录入口（构建产物指向）
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## 客户端：我想做什么 → 怎么写

| 我想做什么 | 写在哪个文件 | 调什么 API | 文档 |
| --- | --- | --- | --- |
| 注册一个页面路由 | `plugin.tsx` 的 `load()` | `this.router.add()` | [Router](../router) |
| 注册一个插件设置页 | `plugin.tsx` 的 `load()` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| 注册一个自定义区块 | `plugin.tsx` 的 `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → 区块扩展](../flow-engine/block) |
| 注册一个自定义字段 | `plugin.tsx` 的 `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → 字段扩展](../flow-engine/field) |
| 注册一个自定义操作 | `plugin.tsx` 的 `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → 操作扩展](../flow-engine/action) |
| 让内部表出现在区块的数据表选择中 | `plugin.tsx` 的 `load()` | `mainDS.addCollection()` | [Collections 数据表](../../server/collections) |
| 翻译插件的文案 | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n 国际化](../component/i18n) |

## 服务端：我想做什么 → 怎么写

| 我想做什么 | 写在哪个文件 | 调什么 API | 文档 |
| --- | --- | --- | --- |
| 定义一张数据表 | `server/collections/xxx.ts` | `defineCollection()` | [Collections 数据表](../../server/collections) |
| 扩展已有数据表 | `server/collections/xxx.ts` | `extendCollection()` | [Collections 数据表](../../server/collections) |
| 注册自定义接口 | `server/plugin.ts` 的 `load()` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| 配置接口权限 | `server/plugin.ts` 的 `load()` | `this.app.acl.allow()` | [ACL 权限控制](../../server/acl) |
| 插件安装时写入初始数据 | `server/plugin.ts` 的 `install()` | `this.db.getRepository().create()` | [Plugin 插件](../../server/plugin) |

## FlowModel 速查

| 我想做什么 | 继承什么基类 | 关键 API |
| --- | --- | --- |
| 做一个纯展示区块 | `BlockModel` | `renderComponent()` + `define()` |
| 做一个绑定数据表的区块（自定义渲染） | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| 做一个完整表格区块（在内置表格基础上定制） | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| 做一个字段展示组件 | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| 做一个操作按钮 | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## 翻译方法速查

| 场景 | 用什么 | 从哪里导入 |
| --- | --- | --- |
| Plugin `load()` 里 | `this.t('key')` | Plugin 基类自带 |
| React 组件里 | `const t = useT(); t('key')` | `locale.ts` |
| FlowModel 静态定义（`define()`、`registerFlow()`） | `tExpr('key')` | `locale.ts` |

## 常见 API 调用速查

| 我想做什么 | 在 Plugin 里 | 在组件里 |
| --- | --- | --- |
| 发 API 请求 | `this.context.api.request()` | `ctx.api.request()` |
| 获取翻译 | `this.t()` | `useT()` |
| 获取日志 | `this.context.logger` | `ctx.logger` |
| 注册路由 | `this.router.add()` | — |
| 页面导航 | — | `ctx.router.navigate()` |
| 打开弹窗 | — | `ctx.viewer.dialog()` |

## 相关链接

- [客户端开发概述](../index.md) — 学习路径和快速索引
- [Plugin 插件](../plugin) — 插件入口和生命周期
- [常见问题 & 排错指南](./faq) — 踩坑排查
- [Router 路由](../router) — 页面路由注册
- [FlowEngine → 区块扩展](../flow-engine/block) — BlockModel 系列基类
- [FlowEngine → 字段扩展](../flow-engine/field) — FieldModel 开发
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel 开发
- [Collections 数据表](../../server/collections) — defineCollection 和字段类型
- [i18n 国际化](../component/i18n) — 翻译文件写法
- [ResourceManager 资源管理](../../server/resource-manager) — 自定义 REST API
- [ACL 权限控制](../../server/acl) — 权限配置
- [Plugin 插件（服务端）](../../server/plugin) — 服务端插件生命周期
- [编写第一个插件](../../write-your-first-plugin) — 插件骨架创建
