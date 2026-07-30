---
title: "AI 搭建快速开始"
description: "AI 搭建是让 AI Agent 写业务系统代码，NocoBase 提供认证、数据库、API 和权限作为基座，代码写在 AI Portal 这个应用入口里。"
keywords: "AI 搭建,AI Portal,NocoBase AI,NocoBase 基座,前端开发,React,shadcn/ui,AI Agent,快速开始"
---

# AI 搭建快速开始

**AI 自由发挥，NocoBase 负责可靠性。**

AI 搭建的做法是：你描述想要什么，AI Agent 写业务系统代码，NocoBase 在后面提供认证、数据库、API 和权限。不需要学配置规则，页面想做成什么样就做成什么样。

NocoBase 提供了一个叫做 **AI Portal** 的访问入口，源码放在本地，专门留给 AI Agent 写代码。`nb init` 完成后就会生成一个默认的 AI Portal 入口，名字是 `main`，访问路径 `/x/main/`。

下文出现 Portal 的地方，指的都是这个入口。

## NocoBase 作为基座

写一个业务系统，真正花时间的往往不是页面，而是页面背后的那些东西——用户登录、权限校验、数据表设计、增删改查接口、文件上传、消息通知。这些每个系统都要有，每次都从头做一遍并不划算。

这些能力 NocoBase 都已经提供了：

- **认证体系** — 账号密码登录开箱即用，OIDC、SAML、CAS、LDAP、短信、钉钉、企业微信等方式在服务端启用后，前端接一下就能用
- **数据库与多数据源** — 内置数据表管理，也能连接外部的 MySQL、PostgreSQL 等数据源
- **REST API** — 数据表建好，增删改查接口自动就有了，支持过滤、排序、分页和关联字段
- **权限控制** — 基于角色的 ACL，能细到字段和记录级别，前端可以直接读取当前用户的权限来决定显示什么
- **工作流** — 业务流程自动化，前端触发或者数据变更触发
- **文件存储和通知** — 上传下载、邮件短信站内信

这些能力通过 API 、标准组件等方式暴露出来，AI Agent 直接调用即可。同时， NocoBase 提供了[数据建模](../ai-builder/data-modeling.md)、[权限配置](../ai-builder/acl.md)等一系列 skills 能力，能够让你在描述自己业务需求后，AI Agent 不仅生成前端页面，还能帮你生成数据表、配置权限等操作，完成一个完整的业务系统。

### 为什么是让 AI 写代码搭建

早期我们的实现是引导 AI 使用 NocoBase 内部的区块进行可视化搭建。这条路能走通，不过 AI 需要学习的上下文太多——区块类型、配置结构、联动规则，每一样都得先理解才能动手，调试成本也不低。

后来我们换了个思路：**写前端代码是 AI 最擅长的事情**，可以让它做最擅长的事。NocoBase 作为系统内核的基座，前端交给 AI 自由发挥。同样的需求，速度更快，效果也更好。

AI Portal 就是这个思路的产物——一个专门留给 AI Agent 写代码的应用入口。目前这个入口暂时只支持写 Portal 的前端代码，后续我们也会支持让 AI Agent 写 Portal 的后端代码，让你的业务系统完全由 AI Agent 搭建。

### 两种入口怎么选

一个 NocoBase 应用可以有多个访问入口，但共用同一套数据。入口分两种，区别在于页面是怎么来的：

- **无代码 Portal** — 页面是在界面里通过无代码编辑的方式搭建出来的，产物是保存在数据库里的配置
- **AI Portal** — 页面是写出来的，产物是可以提交到 Git 的源码

看访问路径就能认出来：

```text
/v/<name>    无代码 Portal
/x/<name>    AI Portal
```

具体差别：

| | 无代码 Portal | AI Portal |
| --- | --- | --- |
| 访问路径 | `/v/<name>` | `/x/<name>` |
| 页面从哪来 | 在界面里配置，AI 可以辅助改配置 | React 源码，AI Agent 编写 |
| 产物 | 保存在数据库里的配置 | 可提交到 Git 的源码 |
| 迭代方式 | 在界面里点，或让 AI 改配置 | 改代码，`dev` → `deploy` |
| 版本管理 | 通过[版本控制](../ai-builder/version-control.md)保存快照 | Git，或 NocoBase source storage |
| 界面自由度 | 受区块能力约束，布局和交互有既定范式 | 想做成什么样就可以做成什么样 |
| 现成能力 | 数据看板、日历、看板视图等区块开箱即用 | 需要自己写，或从扩展里装 |
| 上手门槛 | 需要了解 NocoBase 的区块、字段等知识 | 需要对 AI Agent 使用有一定了解 |
| 适合 | 标准增删改查、内部管理后台 | 定制交互、复杂业务系统、特殊视觉要求 |

下面这几种情况更适合[无代码搭建](../ai-builder/index.md)：

- 页面结构非常标准，就是常规的表格加表单，配置一下比写代码更快
- 需要让不写代码的业务人员自己调整页面
- 想用 NocoBase 内置的区块能力，比如数据看板、日历视图、看板视图

而非上述场景，我们会更推荐用 AI Portal 的方式来搭建应用。当然，两种也可以混用：内部管理后台用无代码 Portal 快速配好，对外的客户门户用 AI Portal 精细定制——它们在同一个应用里，共用一套数据和用户体系。

## 前置条件

- NocoBase >= 3.0.0-alpha.3
- Node.js >= 22
- pnpm——Portal 模板用它安装依赖和启动开发服务
- 安装了 `nocobase cli` 的 alpha 版本（**注意：目前只支持 alpha 版本**）
  - `npm install -g @nocobase/cli@alpha`
  - 并且已经通过 `nb init --ui` 完成初始化的 NocoBase 应用，详见 [AI Agent 接入指南](../ai/quick-start.md)
- 一个 AI Agent，比如 Claude Code、Codex、Cursor

:::tip 提示

NocoBase CLI 在初始化过程中会自动安装 NocoBase Skills，其中的 `nocobase-portal-manage` 负责 Portal 相关的操作，不需要手动安装。

:::

## 第一步：确认你已经有一个 AI Portal

先确认默认的 `main` 确实在：

```bash
nb portal list
```

<!-- 需要一张 nb portal list 输出的截图，展示 main portal 的名称、访问 URL、Portal 类型和本地同步状态 -->

输出里会列出 Portal 名称、访问 URL、Portal 类型、source storage、本地路径和同步状态。

如果你想看得更细，比如本地源码目录到底在哪：

```bash
nb portal info main
```

## 第二步：启动开发模式

```bash
nb portal dev main
```

开发服务默认跑在 `http://localhost:5173`。这一步会先刷新本地源码目录里的 `.env` 和 `.env.local`，再执行 `pnpm dev`。

<!-- 需要一张 Portal 开发服务启动后浏览器里默认页面的截图 -->

模板自带了一个基于 NocoBase `users` 数据表的用户管理页面，可以直接登录进去看看效果——它同时也是你让 AI 参考的最好样例。

## 第三步：让 AI 改一个页面

进到 Portal 的源码目录（位置就是上一步 `nb portal list` 输出里的本地路径），在那里打开 AI Agent，比如 Claude Code、Codex、Cursor，然后输入提示词：

```
加一个客户管理页面，
包含客户列表、按名称搜索，点击某一行打开详情抽屉
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

AI 会读一遍现有的页面和扩展，照着模板的约定写新页面，然后你在 `http://localhost:5173` 里就能看到效果。

想了解怎么跟 AI Agent 高效协作，请参阅 [与 AI Agent 协作搭建](./agent-workflow.md)。

## 第四步：部署

本地改好之后，把源码推送到 source storage，再构建部署：

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

<!-- 需要一张部署完成后访问 /x/main/ 看到新页面的截图 -->

部署完成后访问 `/x/main/`，就能看到刚才的改动了。

至此一个完整的循环就跑通了——描述需求、AI 写代码、本地看效果、推送部署。

## 需要更多入口时

一个应用可以有多个 Portal。比如内部员工用一个、外部客户用另一个，两个入口的页面和权限完全独立，但共用同一套数据：

```bash
nb portal create customer
```

新建的 Portal 同样通过 `nb portal dev` 开发、`nb portal deploy` 部署。它有自己独立的源码目录，用 `nb portal info customer` 查到位置后进去开 AI Agent 即可。详细说明请参阅 [部署与源码管理](./deploy.md)。

## 接下来

- [与 AI Agent 协作搭建](./agent-workflow.md) — 提示词怎么写、AI 改错了怎么回退
- [项目结构与技术栈](./project-structure.md) — 模板的目录约定和常用命令
- [部署与源码管理](./deploy.md) — 把 Portal 源码纳入 Git，以及多环境部署

## 相关链接

- [与 AI Agent 协作搭建](./agent-workflow.md) — 用自然语言驱动 AI 编写 Portal 页面
- [项目结构与技术栈](./project-structure.md) — 模板的目录约定和常用命令
- [数据与 API](./data-api.md) — 通过 REST API 读写业务数据
- [认证与权限](./auth-acl.md) — 复用 NocoBase 的认证体系和 ACL
- [标准组件与扩展](./components.md) — shadcn/ui 组件基座和扩展机制
- [部署与源码管理](./deploy.md) — 开发、推送、部署的完整流程
- [AI Agent 接入指南](../ai/quick-start.md) — 安装 NocoBase CLI 并完成初始化
- [AI 无代码搭建快速开始](../ai-builder/index.md) — 不写代码的另一种搭建方式
- [版本控制](../ai-builder/version-control.md) — 无代码搭建的版本快照
- [`nb portal` 命令参考](../api/cli/portal/index.md) — 所有 Portal 命令的完整参数说明
