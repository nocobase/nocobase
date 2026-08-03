---
title: "项目结构与技术栈"
description: "AI Portal 模板的技术栈、目录约定、环境变量和常用命令，帮你判断 AI 写的代码放对了地方。"
keywords: "AI Portal,项目结构,技术栈,React,Vite,Refine,Tailwind CSS,shadcn/ui,环境变量"
---

# 项目结构与技术栈

:::tip 前置条件

阅读本页前，请确保你已按照 [AI Portal 搭建快速开始](./index.md) 跑通了第一个 Portal。

:::

日常开发大部分交给 AI 就行。不过了解一下模板的结构，你就能判断 AI 写的代码有没有放对地方，遇到问题也更容易定位。

## 技术栈

Portal 模板基于 `@nocobase/portal-template-default`，源码在 [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default)。

| 技术 | 用途 |
| --- | --- |
| React 19 + TypeScript | 前端框架 |
| Vite | 开发服务和构建工具 |
| [Refine](https://refine.dev/docs/) | 数据层框架，处理资源、路由、表单和权限 |
| Tailwind CSS 4 | 样式方案 |
| [shadcn/ui](https://ui.shadcn.com/) | 组件基座，源码归项目所有 |
| lucide | 图标库 |
| pnpm | 包管理器 |

这套组合是当前 AI 最熟悉的前端技术栈，让 AI 写起来准确率更高。

Portal 目前是一个纯前端工程，业务逻辑通过 NocoBase 的 API、标准组件等完成。后续会支持让 AI Agent 也写 Portal 的后端代码。

## 目录结构

```text
src/
├── app/            路由与扩展装载
├── pages/          登录、注册、忘记密码等页面
├── components/     组件
│   ├── ui/         shadcn/ui 组件基座
│   ├── app-shell/  布局、导航、加载状态
│   ├── auth/       认证相关组件
│   └── ...
├── extensions/     扩展，装完即用
├── lib/            NocoBase 客户端封装和 ACL 逻辑
├── providers/      Refine 的各种 provider
├── hooks/          自定义 hook
└── locales/        国际化文案
```

几个关键位置：

- **`src/app/routes.tsx`** — 路由结构。已登录和未登录两套路由分开，扩展提供的路由会自动挂进来
- **`src/app/extensions.tsx`** — 扩展装载逻辑，用 `import.meta.glob` 扫描 `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — Refine 的 data provider，把 Refine 的查询语法翻译成 NocoBase 的 API 参数
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`，所有请求的底层封装
- **`src/components/ui/`** — 60 多个 shadcn/ui 组件，直接用就行

业务页面通常写在 `src/extensions/` 下，一个功能模块一个目录。详见[标准组件与扩展](./components.md)。

## 关键文件

| 文件 | 作用 |
| --- | --- |
| `AGENTS.md` | 给 AI Agent 的开发约定，你也可以往里补自己项目的规则 |
| `components.json` | shadcn/ui 配置，包括样式风格、图标库和路径别名 |
| `.env` / `.env.local` | 环境变量，`nb portal dev` 和 `deploy` 会自动刷新 |
| `vite.config.ts` | 构建配置，包含开发时的 API 代理 |

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `NOCOBASE_API_URL` | NocoBase REST API 根地址，**必须带 `/api` 后缀**。同源部署通常是 `/api` |
| `NOCOBASE_PORTAL_BASE` | Portal 挂载的公共路径。本地开发用 `/`，构建时用实际部署路径比如 `/x/main/` |
| `NOCOBASE_AUTHENTICATOR` | 认证器名称，默认 `basic` |
| `NOCOBASE_API_TOKEN` | 开发用的临时 token，不要提交真实值 |
| `API_CLIENT_STORAGE_PREFIX` | token 存储前缀，服务端定制过的话要保持一致 |
| `API_CLIENT_STORAGE_TYPE` | token 存储方式，默认 `localStorage` |
| `API_CLIENT_SHARE_TOKEN` | 是否共享 token，默认 `false` |

这几个变量 `nb portal dev` 和 `nb portal deploy` 会自动写好，通常不用手动改。只有在服务端定制过认证存储方式时，才需要对齐后三个。

开发时如果 `NOCOBASE_API_URL` 填的是绝对地址，Vite 会自动配一个代理把请求转过去，不用自己处理跨域。

## 常用命令

日常开发用得上的就这几个，依赖安装、环境变量刷新、构建这些都由 CLI 在背后处理：

| 命令 | 作用 |
| --- | --- |
| `nb portal list` | 看看当前应用有哪些 Portal |
| `nb portal info <portal>` | 查 Portal 的开发路径、部署路径和访问地址 |
| `nb portal create <portal>` | 基于模板创建一个新 Portal 的开发工作区 |
| `nb portal pull <portal>` | 把远端的 Portal 源码拉到本地开发工作区 |
| `nb portal dev <portal>` | 启动本地开发服务，改代码实时看效果 |
| `nb portal push <portal>` | 把本地源码变更推送到远端 |
| `nb portal deploy <portal>` | 构建并部署，让改动对用户生效 |
| `nb portal config <portal>` | 调整 source storage、Git 配置和开发工作区路径 |
| `nb portal destroy <portal>` | 删除 Portal 记录和已部署的文件 |

每个命令的完整参数见 [`nb portal` 命令参考](../../api/cli/portal/index.md)。

## 开发工作区在哪

Portal 的开发工作区默认放在你执行 `nb portal create` 或 `nb portal pull` 时所在的目录下：

```text
./<portal>
```

创建或拉取时可以用 `--path` 指定到别处。构建后的部署产物是另一个位置，放在目标应用的 storage 下，由 `nb portal deploy` 负责同步，平时不用管。

不确定当前 Portal 的开发工作区在哪，直接查：

```bash
nb portal info main
```

## 相关链接

- [AI Portal 搭建快速开始](./index.md) — 跑通第一个由 AI 编写的前端入口
- [标准组件与扩展](./components.md) — shadcn/ui 组件基座和扩展机制
- [部署与源码管理](./deploy.md) — 构建部署流程和 source storage
- [与 AI Agent 协作搭建](./agent-workflow.md) — 用自然语言驱动 AI 编写页面
- [`nb portal info`](../../api/cli/portal/info.md) — 查看 Portal 的开发工作区位置
