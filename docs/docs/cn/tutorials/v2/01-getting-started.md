# 第 1 章：认识 NocoBase — 5 分钟跑起来

在这个系列里，我们会从零开始，用 NocoBase 搭建一个**极简的工单系统（HelpDesk）**。整个系统只需要 **2 张[数据表](/data-sources/main/collection)**，不写一行代码，即可实现工单提交、分类管理、变更追踪、权限控制和数据[仪表盘](/data-visualization)。

本章先通过 [Docker](/get-started/installation/docker) 一键部署 NocoBase，完成首次登录，了解[配置模式与使用模式](/get-started/how-nocobase-works)的区别，并预览工单系统的全貌。


## 1.1 NocoBase 是什么

你有没有遇到过这样的场景：

- 团队需要一个内部系统来管理业务，但市面上的软件总是差那么一点
- 找开发团队定制又太贵、太慢，需求还在不断变化
- 用 Excel 凑合，数据越来越乱，协作越来越难

**NocoBase 就是为了解决这个问题而生的。** 它是一个开源的、极易扩展的 **AI 无代码开发平台**。你可以通过配置和拖拽来搭建自己的业务系统，而不需要写代码。

和其他无代码工具相比，NocoBase 有几个核心理念：

- **数据模型驱动**：先定义[数据源](/data-sources)和数据结构，再用[区块](/interface-builder/blocks)展示数据，最后用[操作](/interface-builder/actions)处理数据——界面与数据彻底解耦
- **所见即所得**：页面就是画布，点哪改哪，像搭 Notion 页面一样直观
- **一切皆插件**：所有功能都是[插件](/development/plugin)，类似 WordPress，按需安装、灵活扩展
- **AI 融入业务**：内置 [AI 员工](/ai-employees/quick-start)，可以执行分析、翻译、录入等任务，真正融入你的工作流
- **开源 + 私有部署**：核心代码完全开源，数据完全在你自己的服务器上


## 1.2 安装 NocoBase

NocoBase 支持多种安装方式，我们选择最简单的 **[Docker 安装](/get-started/installation/docker)**。

### 前提条件

你的电脑上需要装好 [Docker](https://docs.docker.com/get-docker/) 和 Docker Compose，并确保 Docker 服务正在运行。Windows / Mac / Linux 都支持。

### 第一步：下载配置文件

打开终端（Windows 用 PowerShell，Mac 用 Terminal），执行：

```bash
# 创建项目目录并进入
mkdir my-project && cd my-project

# 下载 docker-compose.yml（默认使用 PostgreSQL）
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **其他数据库？** 把上面链接中的 `postgres` 替换为 `mysql` 或 `mariadb` 即可。
> 也可选择不同版本：`latest`（稳定版）、`beta`（测试版）、`alpha`（开发版），详见 [官方安装文档](https://docs.nocobase.com/get-started/installation/docker)。
>
> | 数据库 | 下载链接 |
> |--------|---------|
> | PostgreSQL（推荐） | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### 第二步：启动

```bash
# 拉取镜像
docker compose pull

# 后台启动（首次会自动执行安装）
docker compose up -d

# 查看日志，确认启动成功
docker compose logs -f app
```

看到下面这行输出，就说明启动成功了：

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### 第三步：登录

打开浏览器访问 `http://localhost:13000`，使用默认账号登录：

- **账号**：`admin@nocobase.com`
- **密码**：`admin123`

> 首次登录后，请及时修改默认密码。


## 1.3 认识界面

登录成功后，你会看到一个干净的初始界面。别着急，我们先认识两个最重要的概念。

### 配置模式 vs 使用模式

NocoBase 的界面有两种模式：

| 模式 | 说明 | 谁用 |
|------|------|------|
| **使用模式** | 普通用户日常使用的界面 | 所有人 |
| **配置模式** | 搭建和调整界面的设计模式 | 管理员 |

切换方式：点击右上角的 **「[界面配置](/get-started/how-nocobase-works)（UI Editor）」** 按钮（一个荧光笔图标）。

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

开启配置模式后，你会发现页面上很多元素周围出现了**橙色的高亮框**——这表示它们是可以配置的。每个可配置元素的右上角都会出现一个小图标，点击即可进行设置。

我们找一个 demo 系统看看效果：

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

如上图所示：[菜单](/interface-builder/menus)、表格操作栏、[页面](/interface-builder/pages)下方都出现了橙色的提示，点击可以进行下一步的创建选项。

> **记住这个规律**：在 NocoBase 里，想修改画面，就进入配置模式，找到它右上角的小图标，点击即可。

### 界面的基本结构

NocoBase 的界面由三个区域组成：

```
┌──────────────────────────────────────────┐
│            顶部导航栏                      │
├──────────┬───────────────────────────────┤
│          │                               │
│  左侧    │         内容区域               │
│  菜单    │    （放置各种区块）              │
│（group）│                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **顶部导航栏**：放置一级菜单，切换不同模块
- **左侧菜单（group）**：如果是分组菜单，会包含这种二级菜单，组织页面层级
- **内容区域**：页面的主体，放置各种**区块（Block）**来展示和操作数据

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

现在还是空的，没关系——从下一章开始，我们就要往里面填内容了。


## 1.4 我们要搭建什么

在接下来的教程中，我们会一步步搭建一个 **IT 工单系统**，它可以做到：

- ✅ 提交工单：[用户](/users-permissions/user)填写标题、描述、选择分类和优先级
- ✅ 工单列表：按状态、分类筛选，一目了然
- ✅ [权限](/users-permissions/role)控制：普通用户只看自己的工单，管理员看全部
- ✅ 数据看板：实时统计工单分布和趋势
- ✅ 数据操作日志（内置）

整个系统只需要 **2 张数据表**：

| 数据表 | 作用 | 自定义字段数 |
|--------|------|--------|
| 工单分类 | 工单的类别（如：网络问题、软件故障） | 2 个 |
| 工单 | 核心表，记录每一条工单 | 7-8 个 |

没看错，就 2 张表。像用户、权限、文件管理，甚至部门、邮件、操作日志等通用能力，NocoBase 都有现成的插件提供，无需重复造轮子。我们只需要专注于自己的业务数据。


## 小结

这一章我们完成了：

1. 了解了 NocoBase 是什么——一个开源无代码平台
2. 用 Docker 一键安装并启动了 NocoBase
3. 认识了界面的两种模式（配置模式/使用模式）和基本布局
4. 预览了我们要搭建的工单系统蓝图

**下一章**，我们就要动手了——进入数据源管理，创建我们的第一张数据表。这是整个系统的骨架，也是 NocoBase 最核心的能力。

我们下章见！

## 相关资源

- [Docker 安装详解](/get-started/installation/docker) — 完整安装选项与环境变量说明
- [系统要求](/get-started/system-requirements) — 硬件和软件环境要求
- [NocoBase 是如何工作的](/get-started/how-nocobase-works) — 数据源、区块、操作等核心概念
