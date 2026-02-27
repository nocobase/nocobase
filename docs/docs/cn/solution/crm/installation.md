# 如何安装

> **备份文件和 SQL 文件正在完善中，马上上线，敬请期待！**

> **注意**：当前 CRM 方案运行于 NocoBase 2.0 beta，但业务逻辑仍沿用 1.x 版本，仅供预览。后续版本将进行彻底重构。

> 当前版本采用**备份还原**的形式进行部署。在后续版本中，我们可能会更换为**增量迁移**的形式，以便于将解决方案集成到您已有的系统中。

为了让您能够快速体验 CRM 方案，我们提供了两种还原方式。请根据您的用户版本和技术背景选择最适合您的一种。

在开始之前，请确保：

- 您已经有了一个基础的 NocoBase 运行环境。关于主系统的安装，请参考更详细的[官方安装文档](https://docs-cn.nocobase.com/welcome/getting-started/installation)。
- NocoBase 版本 **2.0.0 及以上**
- 您已经下载了 CRM 的相应文件：
  - **备份文件**：nocobase_crm.nbdata - 适用于方法一（正在完善中，马上上线）
  - **SQL文件**：nocobase_crm.zip - 适用于方法二（正在完善中，马上上线）

**重要说明**：
- 本方案基于 **PostgreSQL 16** 数据库制作，请确保您的环境使用 PostgreSQL 16。
- **DB_UNDERSCORED 不能为 true**：请检查您的 `docker-compose.yml` 文件，确保 `DB_UNDERSCORED` 环境变量未设置为 `true`，否则会与方案备份冲突导致还原失败。

---

## 方法一：使用备份管理器还原（推荐专业/企业版用户）

这种方式通过 NocoBase 内置的"[备份管理器](https://docs-cn.nocobase.com/handbook/backups)"（专业/企业版）插件进行一键还原，操作最简单。

### 操作步骤

**第 1 步：开启"备份管理器"插件**

1. 登录您的 NocoBase 系统。
2. 进入 **`插件管理`** 。
3. 找到并启用 **`备份管理器`** 插件。

**第 2 步：从本地备份文件还原**

1. 启用插件后，刷新页面。
2. 进入左侧菜单的 **`系统管理`** -> **`备份管理器`**。
3. 点击右上角的 **`从本地备份还原`** 按钮。
4. 将下载的备份文件拖拽到上传区域。
5. 点击 **`提交`**，耐心等待系统完成还原。

### 注意事项

* **专业/企业版限定**："备份管理器"是企业级插件，仅专业/企业版用户可用。
* **商业插件匹配**：请确保您已拥有并开启了方案所需的商业插件。

---

## 方法二：直接导入 SQL 文件（通用）

这种方式通过直接操作数据库来还原数据，适用于所有 NocoBase 用户。

### 操作步骤

**第 1 步：准备一个干净的数据库**

为您即将导入的数据准备一个全新的、空的数据库。

**第 2 步：将 `.sql` 文件导入数据库**

* **通过命令行（Docker 示例）**：

  ```bash
  # 将 sql 文件复制到容器内
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # 进入容器执行导入指令
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```

* **通过数据库客户端**：使用 DBeaver、Navicat、pgAdmin 等工具连接数据库，执行 SQL 文件。

**第 3 步：连接数据库并启动应用**

配置 NocoBase 启动参数，使其指向导入了数据的数据库，然后启动服务。

---

## 更多帮助

详细的还原教程请参考：[NocoBase CRM Demo 部署指南](https://www.nocobase.com/cn/tutorials/nocobase-crm-demo-deployment-guide)
