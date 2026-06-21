# 第 1 章：初识 NocoBase

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 快速体验

首先，我们推荐你快速体验 NocoBase，了解它的强大功能。你可以在 [在线 Demo](https://demo-cn.nocobase.com/new) 填写邮箱和相关信息，点击开通。即可收到为期 2 天的体验系统，包含全部商业插件：

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

收到 NocoBase 官方邮件之后，可以先行探索，感受 NocoBase 的灵活强大。可以在体验系统中随意操作，不需要有任何顾虑。

## 1.2 NocoBase 的基本界面

欢迎进入 NocoBase！初次使用时，界面可能会让你感到有些陌生，不知道从何开始。别担心，让我们一步步熟悉主要的功能区域，帮助你快速上手。

### 1.2.1 **界面配置**

当你首次进入 NocoBase，会看到一个简洁直观的主界面。右上角是[**界面配置**](https://docs-cn.nocobase.com/handbook/ui/ui-editor)按钮，点击后系统会切换到界面配置模式。这是你搭建系统页面的主要工作区。

![界面配置模式](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**操作步骤：**

1. **进入配置模式**：点击右上角的“界面配置”按钮，进入配置模式。
2. **添加[菜单](https://docs-cn.nocobase.com/handbook/ui/menus)页面**：
   - 点击“添加菜单项”。
   - 输入菜单名称（例如“测试页面”），然后点击确认。
   - 系统会自动创建并跳转到新建的测试页面。

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **创建[区块](https://docs-cn.nocobase.com/handbook/ui/blocks)**：
   - 在测试页面，点击“创建区块”按钮。
   - 从区块类型中选择一个数据区块，例如“表格区块”。
   - 连接一个数据表，如系统内置的“用户”表。
   - 选择你希望展示的字段，点击确认。
4. 这样，一个展示用户列表的表格区块就完成了！

![创建区块](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

是不是非常简单？NocoBase 的区块设计灵感来源于 Notion，但功能更加强大，能够支持构建更复杂的系统。接下来的教程中，我们将深入探索各类区块的功能，敬请期待！

### 1.2.2 **插件管理器**

插件是扩展 NocoBase 功能的重要工具。在[**插件管理器**](https://docs-cn.nocobase.com/handbook/plugin-manager)中，你可以查看、安装、启用或禁用各种插件，满足不同的业务需求。

通过使用插件扩展，可以扩展实现一些方便或意想不到的功能集成，更加方便你的创作与开发。

![插件管理器](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**操作步骤：**

1. **查看已安装插件**：点击“插件管理器”，你会看到当前所有已安装的插件列表。
2. **激活插件**：
   - 找到你需要的插件，例如“主题编辑器”插件。
   - 点击“开启”按钮，激活插件。
3. **测试插件功能**：
   - 激活“主题编辑器”后，在右上角个人中心，可以快速更改系统主题。
     ![更改系统主题](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - 在设置中心里，你会看到主题编辑器界面，可以在这里个性化调整系统主题，如更改颜色、字体等。
     ![主题编辑器界面](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **设置页面**

**设置页面**集成了系统和部分插件的各项设置选项，帮助你全面管理 NocoBase 的各个方面。

![设置页面](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**一些常用的插件配置项，如：**

- [**数据源管理**](https://docs-cn.nocobase.com/handbook/data-source-manager)：管理所有数据表，配置主数据库或外部数据库。
- [**系统设置**](https://docs-cn.nocobase.com/handbook/system-settings)：修改系统名称、Logo、语言等基础信息。
- [**用户和权限**](https://docs-cn.nocobase.com/handbook/users)：管理用户账户，配置不同角色的权限。
- [**插件设置**](https://docs-cn.nocobase.com/handbook/plugin-manager)：针对已安装的插件，进行详细配置和管理。

### 1.2.4 **版本信息与支持**

在界面的右上角，你会看到 **NocoBase 的版本信息**。如果在使用过程中遇到任何疑问，欢迎访问**主页**和**用户手册**获取帮助。

![版本信息](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **个人中心菜单**

个人中心菜单位于界面右上角，可以进行**个人信息修改** 和 **角色切换**，以及一些重要的系统操作。
当然，一些插件也会对这里的能力进行扩展。

![个人中心菜单](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 安装 NocoBase

决定深入使用 NocoBase 后，我们需要将其安装到你的电脑或服务器上。NocoBase 提供了多种安装方式，选择适合你的方法，轻松开始无代码开发之旅。

### 1.3.1 **安装方式**

1. **Docker 安装（推荐）**

   - **优势**：快速、简便，适合熟悉 Docker 的用户。
   - **版本选择**：
     - **main & latest 版本**：这是截至目前最稳定的版本，适合大多数用户使用。
     - **next 版本**：内测版，适合想要体验新特性的用户。请注意，此版本可能尚不完全稳定，建议在重要数据备份后使用。
   - **操作步骤**：
     - 参考[官方安装指南](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose)，按照步骤使用 Docker Compose 部署 NocoBase。
2. **Create-NocoBase-App 安装**

   - **适合人群**：前端开发者或熟悉 npm 的用户。
   - **操作步骤**：
     - 参考[安装指南](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app)，通过 npm 包进行安装。
3. **源码安装**

   - **适合人群**：需要对 NocoBase 进行深度定制的开发者。
   - **操作步骤**：
     - 参考[安装指南](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone)，从 GitHub 克隆源码，并按照自定义需求进行安装。

### 1.3.2 **详细安装指南（以 Docker 举例）**

无论选择哪种安装方式，都可以在 **NocoBase 安装文档**中找到详细的步骤和说明。以下是 Docker 安装的简要步骤，帮助你快速上手：

1. **安装 Docker**：确保你的系统已经安装了 Docker。如果尚未安装，可以访问 [Docker 官网](https://www.docker.com/)下载并安装。
2. **获取 Docker Compose 文件**：

   - 打开终端或命令行工具。
   - 创建 nocobase 目录，创建 Docker Compose 配置。

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. 进入 `docker-compose.yml` 之后，粘贴下方的配置，根据需要调整并保存文件

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # 应用的密钥，用于生成用户 token 等
          # 如果 APP_KEY 修改了，旧的 token 也会随之失效
          # 可以是任意随机字符串，并确保不对外泄露
          - APP_KEY=your-secret-key
          # 数据库类型，支持 postgres, mysql, mariadb, sqlite
          - DB_DIALECT=postgres
          # 数据库主机，可以替换为已有的数据库服务器 IP
          - DB_HOST=postgres
          # 数据库名
          - DB_DATABASE=nocobase
          # 数据库用户
          - DB_USER=nocobase
          # 数据库密码
          - DB_PASSWORD=nocobase
          # 时区
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # 如果使用已有数据库服务，可以不启动 postgres
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **启动 NocoBase**：
   - 在 nocobase 目录下运行以下命令启动服务：

```bash
docker-compose up -d
```

- 这将下载必要的镜像并启动 NocoBase 服务。

5. **访问 NocoBase**：
   - 打开浏览器，访问 `http://localhost:13000`（根据配置可能有所不同），即可看到 NocoBase 的登录界面。

完成以上步骤后，你就成功安装并启动了 NocoBase！接下来，你可以按照教程中的指导，开始搭建自己的应用系统。

---

通过以上步骤的引导，希望你能顺利熟悉 NocoBase 的基本界面和安装过程。在[接下来的章节（第二章：设计任务管理系统）](https://www.nocobase.com/cn/tutorials/task-tutorial-system-design)中，我们将进一步探索 NocoBase 的强大功能，帮助你构建出功能丰富的应用程序。让我们一起迈出下一步，开启无代码开发的新旅程吧！
