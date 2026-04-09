---
pkg: '@nocobase/plugin-migration-manager'
title: "迁移管理"
description: "运维管理迁移：将应用配置从一环境迁移至另一环境，支持仅结构、覆盖、Upsert、插入忽略重复、跳过等迁移规则，依赖备份管理插件。"
keywords: "迁移管理,Migration,应用配置迁移,迁移规则,Upsert,数据库迁移,运维管理,NocoBase"
---
# 迁移管理

## 介绍

迁移管理插件用于将应用配置从一个环境（例如 Staging）迁移到另一个环境（例如 PROD）。

**核心区别：**

- **迁移管理：** 侧重于迁移特定的应用配置、数据表结构或部分数据。
- **[备份管理器](../backup-manager/index.mdx)：** 侧重于全量数据的备份与还原。

## 安装

依赖 [备份管理](../backup-manager/index.mdx) 插件，请确保已经安装并激活。

## 流程与原理

将主数据库的数据表及数据，根据迁移规则，从一个应用迁移至另一个应用。需要注意的是不迁移外部数据库和子应用的数据。

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## 迁移规则

### 内置规则

支持以下五种迁移规则：

- **仅结构：** 只同步数据表结构，不涉及数据的插入或更新。
- **覆盖（清空并重新插入）：** 清空现有表记录，然后插入新数据。
- **插入或更新 (Upsert)：** 根据主键判断，记录存在则更新，不存在则插入。
- **插入时忽略重复：** 插入新记录，如果主键冲突则忽略（不更新现有记录）。
- **跳过：** 对该表不做任何处理。

**备注：**
- 覆盖、插入或更新、插入时忽略重复也会同步表结构的变化。
- 自增 ID 作为主键 or 无主键的表不支持 "插入或更新" 和 "插入时忽略重复"。

### 详细设计

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### 配置界面

配置迁移规则

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

启用独立规则

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

选择独立规则以及按当前独立规则处理的数据表

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## 迁移文件

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### 新建迁移

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### 执行迁移

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

#### 环境变量检测

应用环境变量检测（了解何为 [环境变量](../variables-and-secrets/index.md)）

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

如果.env中的 `DB_UNDERSCORED` 、`USE_DB_SCHEMA_IN_SUBAPP` 、`DB_TABLE_PREFIX` 、`DB_SCHEMA` 、 `COLLECTION_MANAGER_SCHEMA` 不一致，则会弹窗提示不能够继续迁移

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

如果缺失动态配置的环境变量或密钥就会弹窗提示用户，要在这里填写需要新增的环境变量或密钥，然后继续

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

#### 插件检测

应用插件检测，如果当前环境缺少插件就会弹窗提示，此时也可以选择继续迁移

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## 迁移日志与存储

执行完迁移后，服务器上会保存执行日志文件，可以在线查看或下载。

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

在线查看执行日志文件时，还可以下载迁移数据结构时执行的SQL。

![20251227164116](https://static-docs.nocobase.com/20251227164116.png)

点击 `过程` 按钮可以查看已完成迁移执行过程

![c065716cfbb7655f5826bf0ceae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0ceae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

### 关于 `storage` 目录

迁移管理主要处理数据库记录。`storage` 目录中的部分数据（如日志、备份历史、请求日志等）不会被自动迁移。

- 如果需要在新环境保留这些文件，你需要手动拷贝 `storage` 目录下的相关文件夹。

## 回滚

执行迁移前，系统会自动创建备份。

### 回滚原则

1.  **停止服务：** 在开始回滚前停止应用，防止新的数据写入。
2.  **版本匹配：** NocoBase 内核版本（Docker 镜像）**必须**与备份文件生成时的版本一致。
3.  **全新环境还原：** 如果当前数据库或存储已损坏，仅还原镜像版本可能不够。最稳妥的做法是**在全新的应用实例（新数据库和存储）中**使用正确的内核镜像还原备份。

### 回滚流程

#### 场景 A：迁移任务执行失败
如果仅是迁移任务执行出错，但内核版本未变，请直接使用 [备份管理器](../backup-manager/index.mdx) 还原迁移前自动创建的备份。

#### 场景 B：系统损坏或内核升级失败
如果升级或迁移导致系统无法运行，需要回滚到稳定状态：
1.  **停止应用：** 停止当前的容器服务。
2.  **准备全新环境：** 准备一个新的空库和空存储环境。
3.  **部署目标版本：** 将 Docker 镜像标签改回*备份生成时*的版本。
4.  **还原备份：** 在这个干净的环境中通过 [备份管理器](../backup-manager/index.mdx) 执行还原。
5.  **切换流量：** 更新网关/负载均衡，将流量指向这个恢复后的全新实例。

![20251227164004](https://static-docs.nocobase.com/20251227164004.png)

## 命令行

### `yarn nocobase migration generate`

```bash
Usage: nocobase migration generate [options]

Options:
  --title [title]    migration title
  --ruleId <ruleId>  migration rule id
```

示例

```bash
yarn nocobase migration generate --ruleId=1
```

### `yarn nocobase migration run`

```bash
Usage: nocobase migration run [options] <filePath>

Arguments:
  filePath           migration file path

Options:
  --skip-backup      skip backup
  --var [var]        variable (default: [])
  --secret [secret]  secret (default: [])
```

示例

```bash
yarn nocobase migration run /your/path/migration_1775658568158.nbdata \
  && --var A=a --var B=b \
  && --secret C=c --secret D=d
```

## 最佳实践

### 推荐部署流程 (蓝绿切换)

为了确保零停机或极短停机时间，并获得最高安全性，建议使用双环境切换方案：

1.  **准备阶段 (Staging)：** 在 Staging 环境中创建迁移文件。
2.  **安全备份 (PROD-A)：** 为当前生产环境 (PROD-A) 创建全量备份。
3.  **并行部署 (PROD-B)：** 部署一个*全新的、空库*的生产实例 (PROD-B)，使用目标内核版本。
4.  **还原与迁移：**
    *   将 PROD-A 的备份还原到 PROD-B。
    *   在 PROD-B 中执行来自 Staging 的迁移文件。
5.  **验证：** 在 PROD-A 仍在服务的过程中，对 PROD-B 进行详尽测试。
6.  **切换流量：** 更新 Nginx/网关，将流量从 PROD-A 指向 PROD-B。
    *   *如遇问题，可瞬间切回 PROD-A。*

### 数据一致性与停机维护

目前 NocoBase 不支持零停机迁移。为了避免备份或迁移过程中产生数据不一致：
- **关闭网关/入口：** 强烈建议在开始备份或迁移前停止用户访问。你可以通过 Nginx 或网关配置 **503 维护页面**，向用户提示系统正在维护中，并防止新的数据写入。
- **手动数据同步：** 如果在迁移期间用户继续在旧版本中产生数据，这些数据需要后续手动同步。
