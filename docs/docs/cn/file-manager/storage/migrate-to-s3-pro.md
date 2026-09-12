---
title: "迁移到 S3 Pro"
description: "将本地存储、Amazon S3、阿里云 OSS、腾讯云 COS 等仅支持公开访问的存储引擎迁移到 S3 Pro，覆盖维护窗口、备份、对象 key 映射、文件迁移、记录更新和风险检查。"
keywords: "S3 Pro,存储迁移,私有访问,文件迁移,本地存储,S3,OSS,COS,NocoBase"
---

# 迁移到 S3 Pro

如果你已经使用了[本地存储](./local.md)、[Amazon S3](./amazon-s3.md)、[阿里云 OSS](./aliyun-oss.md) 或 [腾讯云 COS](./tencent-cos.md)，需要把文件改为私有访问，可以把历史文件迁移到 [S3 Pro](./s3-pro.md)。

迁移需要同时处理三件事：把物理文件或对象复制到新的存储桶、更新文件表里的存储记录、切换以后上传使用的新存储。

:::warning 注意

迁移前务必在测试环境演练一遍，并准备可回滚的数据库备份和文件备份。迁移期间如果继续上传或删除附件，容易出现漏迁、覆盖或记录不一致。

:::

## 适用范围

这篇文档适用于从以下存储引擎迁移到 S3 Pro：

| 原存储引擎 | 历史文件位置 |
| --- | --- |
| 本地存储 | `<documentRoot>/<record.path>/<record.filename>` |
| Amazon S3 | 原 bucket 中的 `join(record.path, record.filename)` |
| 阿里云 OSS | 原 bucket 中的 `join(record.path, record.filename)` |
| 腾讯云 COS | 原 bucket 中的 `join(record.path, record.filename)` |

其中，`record.path` 和 `record.filename` 来自文件记录本身，包括内置的 `attachments` 表和其他文件表。

:::tip 提示

本地存储的 `documentRoot` 以 `storages` 表中该存储的 `options.documentRoot` 为准。默认配置值是 `storage/uploads`，实际绝对路径取决于 NocoBase 运行时的 storage 目录。

:::

## 操作步骤

### 第一步：停写或进入维护窗口

迁移期间先暂停用户上传、更新和删除附件。可以通过维护窗口、临时下线入口、冻结相关业务流程等方式实现。

这一步的目标是让文件记录和物理文件保持静止。如果迁移过程中仍有用户上传或删除文件，那么迁移脚本统计到的记录可能已经不是最新状态。

### 第二步：备份数据库和文件

至少准备两类备份：

1. 数据库备份
2. 原存储中的文件备份或对象快照

对于本地存储，需要备份 `documentRoot` 对应的目录。历史文件的物理路径通常是：

```text
<documentRoot>/<record.path>/<record.filename>
```

对于 Amazon S3、阿里云 OSS、腾讯云 COS，需要确认原 bucket 的对象仍可读取，并记录原存储引擎的 `id`、`name`、`type`、`path`、`baseUrl` 和 `options`。

另外建议导出一份迁移清单，用于回滚和人工核对：

```text
collection
id
oldStorageId
oldPath
oldFilename
oldUrl
newKey
size
mimetype
```

### 第三步：创建并验证 S3 Pro 存储

按 [S3 Pro](./s3-pro.md) 文档创建新的 `s3-pro` 存储。至少确认这些配置可用：

- bucket
- endpoint
- region
- accessKey
- secret
- public / private
- access endpoint
- forcePathStyle
- 文件大小和 MIME 类型规则

创建后先用新存储上传一个测试文件，确认上传、预览、下载、删除都正常。如果目标是私有访问，还要确认访问 URL 是临时签名 URL，并且过期时间符合预期。

:::warning 注意

S3 Pro 使用客户端直传。目标 bucket 需要配置允许 NocoBase 站点上传的 CORS 规则，否则新文件上传会失败。

:::

### 第四步：确定对象 key 映射

历史文件迁移到 S3 Pro 后，建议继续使用原来的相对路径作为 S3 object key：

```text
oldKey = join(record.path, record.filename)
```

比如：

```text
record.path = "avatars"
record.filename = "a-123.png"
oldKey = "avatars/a-123.png"
```

S3 Pro 针对已经落库的文件记录，访问文件时会直接把 `file.filename` 当作完整 object key，不会再拼接 `file.path`。所以迁移后文件记录应更新为：

```text
storageId = <s3-pro-storage-id>
filename = <oldKey>
path = ""
url = ""
```

不要迁移成下面这种形式：

```text
filename = "a-123.png"
path = "avatars"
```

否则 S3 Pro 可能只把 `a-123.png` 当作 object key，导致历史文件访问失败。

生成 object key 时要使用 `/` 作为分隔符，不要使用操作系统的路径分隔符。对于以 `/` 开头的旧路径，也要去掉开头的 `/`。

### 第五步：迁移物理文件或确认对象位置

遍历所有文件表记录，包括内置的 `attachments` 和其他文件表。只处理 `storageId = <old-storage-id>` 的记录。

如果原存储是本地存储，需要把本地文件上传到 S3 Pro 使用的 bucket。如果原存储本来就是 Amazon S3、阿里云 OSS 或腾讯云 COS，并且新的 S3 Pro 配置仍指向同一个 bucket、同一个 endpoint，且访问凭证有权限读取同一批对象，通常不需要复制对象。此时只要确认第四步生成的 `oldKey` 能被 S3 Pro 正确访问即可。

不同原存储的处理方式如下：

| 原存储引擎 | 是否需要复制文件 | 目标 object key |
| --- | --- | --- |
| 本地存储 | 需要上传到 S3 Pro bucket | `join(record.path, record.filename)` |
| Amazon S3 | 复用同一 bucket 时通常不需要；换 bucket、换账号或换区域时需要复制 | `join(record.path, record.filename)` |
| 阿里云 OSS | 复用同一 bucket 时通常不需要；换 bucket、换账号或换区域时需要复制 | `join(record.path, record.filename)` |
| 腾讯云 COS | 复用同一 bucket 时通常不需要；换 bucket、换账号或换区域时需要复制 | `join(record.path, record.filename)` |

以下情况仍然需要复制文件或对象：

- 从本地存储迁移到 S3 Pro
- 换 bucket、换账号、换 region 或换云厂商
- 需要把历史对象从公开 bucket 搬到新的私有 bucket
- 原对象 key 需要重命名或重新组织目录
- 原 bucket 权限策略不适合 S3 Pro 的签名访问或客户端直传
- S3 Pro 无法通过当前 endpoint 和凭证直接访问原对象

正式迁移前先做 dry-run。至少输出：

- 待迁移记录数
- 待迁移总大小
- 本地缺失文件数或源对象缺失数
- 重复 object key 数
- 不能识别 `storageId` 的记录数
- 待人工处理列表

如果出现重复 object key，不要直接覆盖。先比较文件大小、ETag 或 hash，确认它们是否指向同一个文件。不是同一个文件时，需要为其中一条记录生成新的 key，并在后续记录更新时使用这个新 key。

### 第六步：校验目标对象可访问

文件复制完成后，或确认可以复用原云存储 bucket 后，对每条迁移记录执行 S3 HEAD Object 或等价检查，确认 S3 Pro 能通过目标 object key 访问对象。

建议输出这些结果：

- 成功数
- 源文件缺失数
- 上传或复制失败数
- 目标对象缺失数
- 重复 key 数
- 待人工处理列表

不要只看脚本退出码。对象存储可能出现部分失败、重试后成功、同名覆盖、权限可写但不可读等情况，迁移清单和 HEAD Object 校验更可靠。

### 第七步：更新文件记录

确认目标对象全部存在后，再更新文件表记录。只更新文件集合里的文件记录，保留原记录 `id` 不变，不需要更新附件字段产生的多对多关系表。

核心字段如下：

| 字段 | 迁移后取值 |
| --- | --- |
| `storageId` | 新的 S3 Pro 存储 ID |
| `filename` | `join(oldPath, oldFilename)` |
| `path` | 空字符串 |
| `url` | 私有存储填空字符串；公开存储可填公开 URL 或空字符串 |

如果 S3 Pro 是私有存储，`url` 必须为空。S3 Pro 对非公开存储保存记录时也会清空 `url`，访问文件时会动态生成临时签名 URL。

:::warning 注意

建议在事务中批量更新记录，并把第二步导出的迁移清单保存到迁移完成之后。回滚时需要用这份清单把 `storageId`、`path`、`filename` 和 `url` 改回旧值。

:::

### 第八步：切换以后上传使用的存储

历史记录更新完成后，还要切换新文件的上传目标。

需要检查三类配置：

1. 默认存储引擎：如果附件字段或文件表没有指定存储，则会使用默认存储。需要把新的 S3 Pro 存储设为默认。
2. 附件字段：如果某些附件字段配置了 `options.storage = <old-storage-name>`，需要改成新的 S3 Pro 存储 `name`。
3. 文件表：如果某些文件表配置了旧存储引擎，也需要改成新的 S3 Pro 存储 `name`。

这里使用的是存储引擎的 `name`，不是 `id`。历史文件记录里的 `storageId` 才使用存储引擎 ID。

### 第九步：重启或刷新缓存

文件管理器会缓存 `storages` 配置。通过 NocoBase 界面或资源 API 更新存储配置时，通常会触发 `reloadStorages`。如果你是直接改数据库，迁移完成后需要重启应用，或确保已经触发存储缓存刷新。

如果你直接修改了附件字段或文件表的元数据配置，也建议重启应用，确保集合配置、字段配置和前端缓存都使用新存储。

### 第十步：抽样验证并保留旧文件

迁移完成后至少验证这些场景：

- 附件字段中查看、预览、下载历史文件
- 文件表中查看、预览、下载历史文件
- 图片缩略图或预处理参数
- Office 文件预览等依赖外部服务读取 URL 的能力
- 新上传文件的保存、预览、下载和删除
- 删除文件记录后的对象删除行为

旧存储中的文件不要马上删除。建议保留到业务方确认、备份周期覆盖、访问日志没有异常之后，再分批清理旧文件。

## 风险点

### 写入期间的数据不一致

迁移期间如果仍有用户上传或删除文件，可能出现对象已复制但记录被删除、记录已更新但对象还在旧存储、或新上传文件没有进入迁移清单等问题。默认做法是进入维护窗口。

### S3 Pro 的 object key 规则不同

迁移后 `filename` 应保存完整 object key，`path` 应为空。这个规则跟本地存储和内置 S3 / OSS / COS 的历史记录形态不同，是迁移里最容易出错的地方。

### URL 可访问性变化

从公开访问存储迁移到私有 S3 Pro 后，历史公开 URL 可能不再长期有效。NocoBase 内部读取文件会动态生成临时签名 URL，不过外部系统里已经保存的旧 URL 不会自动改写。

如果有第三方系统、邮件模板、导出文件或富文本内容直接保存了旧 URL，需要单独评估替换策略。

:::warning 注意

如果 Markdown（Vditor）字段内容中已经保存了文件 URL，需要单独处理这些内容。S3 Pro 私有访问生成的是临时签名 URL，会过期，目前不支持把这类私有链接长期存储在 Markdown（Vditor）字段中使用。

如果这些字段必须继续引用文件，建议先保留公开访问的文件地址。

:::

### 预览服务和私有文件

某些预览能力依赖外部服务访问文件 URL。私有 S3 Pro 会生成临时签名 URL，通常可以访问，但会受到签名过期时间、网络可达性、bucket 权限和服务端缓存影响。

如果文件非常敏感，需要重新评估是否允许外部预览服务读取这些文件。

### 直接改数据库不会触发所有钩子

如果用 SQL 或自写脚本直接更新 `storages`、集合配置、字段配置和文件记录，NocoBase 的部分缓存刷新和保存钩子不会自动执行。更新完成后要重启应用，并重新验证存储配置。

### 删除行为会指向新存储

文件记录的 `storageId` 更新为 S3 Pro 后，后续删除文件记录时，NocoBase 会尝试删除新 bucket 中的对象。旧存储中的对象不会随之删除，需要单独清理。
