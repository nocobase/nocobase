---
title: 部署
description: 选择独立部署或 Hub 部署，并完成配置、发布与运维。
---

# 部署

NocoBase 3 支持独立部署应用，也支持通过 Hub 统一管理应用的发布与运行。

## Hub 是什么

Hub 是 NocoBase 的应用部署与管理平台。开发者把应用构建成部署包，上传到 Hub；有权限的管理人员可以在网页中选择版本、填写运行配置、发起部署，并查看状态和日志。应用上线后，也可以在 Hub 中更新版本、启动、停止或发起回滚。

例如，你已经开发了一个 CRM 应用：

- **不使用 Hub**：把 CRM 的部署包放到服务器，配置数据库和密钥，通过 Node.js 或 Docker 启动。后续更新由你维护服务器上的代码或镜像，也可以交给 app-installer 完成安装、升级和回退。
- **使用 Hub**：先准备一个可用的 Hub，在其中创建 CRM 的应用记录，上传部署包并发起部署。后续通过 Hub 页面或 CLI 发布新版本。

Hub 支持管理一个或多个应用，供开发和运维人员使用。业务用户通过各应用自己的地址访问业务功能。

## Hub 与业务应用有什么关系

Hub 自身需要安装在服务器上。平台管理员完成安装后，应用开发者可以使用它发布业务应用；如果团队已经有 Hub，你只需要准备应用和发布权限。

```text
开发者：构建 CRM 部署包 → 上传到 Hub → 配置并部署
管理人员：进入 Hub → 查看版本、部署结果、运行状态和日志
业务用户：打开 CRM 地址 → 使用客户、订单等业务功能
```

同一台服务器可以提供两个不同用途的地址，例如 `https://apps.example.com/hub/` 用于管理平台，`https://apps.example.com/crm/` 用于使用业务应用。Hub 的管理账号和权限，与 CRM 内的业务账号和数据权限分别维护。

## 选择部署方式

| 方式                     | 适用情况                                                                         | 文档入口                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 独立部署                 | 自行管理应用进程、容器和发布流程                                                 | [运行配置](./configuration)、[打包和运行](./standalone)；使用容器时继续阅读 [Docker 部署](./docker) |
| 独立部署 + app-installer | 不使用 Hub 和容器，由安装器在服务器上安装部署包，负责 pm2 运行、升级、备份和回退 | [运行配置](./configuration) → [app-installer](./app-installer)                                      |
| 使用 Hub                 | 通过 Hub 统一管理应用版本、配置、部署记录和启停                                  | [部署 Hub 平台](./hub) → [使用 Hub 发布应用](./hub-publishing)；已有 Hub 可直接阅读后者             |

## 交给 AI Agent

以上各页的步骤都可以由 AI Agent 执行。开始前按对应页面准备好服务器、数据库和凭据，AI Agent 拿不到的东西它无法自己补上。

### 会话位置

- **发布到 Hub**：在应用源码根目录开启会话，应用自带的 `nocobase-deployment` Skill（同步在 `.agents/skills/` 下）负责构建、上传与验证，步骤见[使用 Hub 发布应用](./hub-publishing)。
- **独立部署（Node.js 或 Docker）**：同样在应用源码根目录开启会话，构建部署包或镜像。服务器上的操作需要 AI Agent 能通过 SSH 访问服务器，或在服务器上另开一个会话接手，步骤见[打包和运行](./standalone)和 [Docker 部署](./docker)。
- **app-installer**：构建机上的会话负责构建部署包。服务器上的安装、升级与回退由全局的 `nocobase-app-installer` Skill 负责，先执行 `npx skills add nocobase/nocobase3 --skill nocobase-app-installer -g` 安装，步骤见 [app-installer](./app-installer)。
- **安装 Hub**：用安装器安装时同样由全局的 `nocobase-app-installer` Skill 负责；用 Docker 安装时按[部署 Hub 平台](./hub)，在一个 NocoBase 应用目录中开启会话，由应用自带的部署 Skill 执行。

### 需要说明的信息

- 部署方式：Hub、独立部署（Node.js 或 Docker）或 app-installer。
- 访问地址：例如 `https://apps.example.com/crm/`。
- 数据库：沿用现有数据库、新建空库，还是从备份恢复。
- 本次操作：首次部署、更新版本、回滚或恢复。

凭据不要写在对话中。数据库密码和 Hub API Key 写入 `.env` 或运行配置文件后，告知其位置即可。示例：

```text
把这个应用部署到 Hub：https://apps.example.com/hub，应用 ID 是 crm，访问地址是 https://apps.example.com/crm/。
这是首次部署，使用 PostgreSQL，数据库已经建好，连接信息在项目根目录的 runtime.yml 里。
部署前先告诉我要执行的命令，完成后给我部署报告。
```

### 验收要求

要求 AI Agent 在报告中给出部署的版本、迁移结果、[初始化与验收](./standalone#初始化与验收)中每一项的结论，以及跳过的检查项。进程启动不代表应用可用，自己再打开正式地址登录一次。

## 上线后维护

数据备份、恢复步骤和常见问题处理，见[备份恢复与排障](./operations)。
