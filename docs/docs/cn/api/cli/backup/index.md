---
title: "nb backup"
description: "nb backup 命令参考：创建 NocoBase 备份并下载到本地，或把本地备份文件恢复到目标 env。"
keywords: "nb backup,NocoBase CLI,备份,恢复,nbdata"
---

# nb backup

创建或恢复 NocoBase 备份。`nb backup create` 会在目标 env 中创建远端备份，再把备份文件下载到本地；`nb backup restore` 会把本地备份文件上传到目标 env，并等待应用重新就绪。

## 用法

```bash
nb backup <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb backup create`](./create.md) | 创建备份并下载到本地 |
| [`nb backup restore`](./restore.md) | 把本地备份文件恢复到目标 env |

## 示例

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## 说明

执行前，CLI 会先检查目标 env 是否暴露了备份相关的运行时命令。缺少命令时会自动刷新一次 runtime 缓存；如果刷新后仍然缺少 `nb api backup ...` 能力，说明目标 env 还没有开启或同步 backup/restore 能力，这时需要先处理目标应用本身。

其中：

- `nb backup create` 依赖 `nb api backup create`、`nb api backup status` 和 `nb api backup download`
- `nb backup restore` 依赖 `nb api backup restore-upload`

## 相关命令

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
