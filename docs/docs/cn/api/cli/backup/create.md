---
title: "nb backup create"
description: "nb backup create 命令参考：通过选中的 env 创建备份，并把备份文件下载到本地。"
keywords: "nb backup create,NocoBase CLI,创建备份,下载备份,nbdata"
---

# nb backup create

通过选中的 env 创建备份，并把备份文件下载到本地。省略 `--output` 时，CLI 会把文件保存到当前工作目录，并沿用远端返回的备份文件名——通常是 `backup_*.nbdata`。

## 用法

```bash
nb backup create [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要创建备份的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--output`, `-o` | string | 下载目标路径。省略时保存到当前目录；如果指向已存在目录，会自动拼上远端备份文件名 |
| `--json-output`, `-j` | boolean | 以 JSON 输出最终结果，字段包括 `env`、`name` 和 `output` |

## 示例

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

创建流程分成两步：先调用目标 env 的 backup API 创建远端备份，然后每 2 秒轮询一次状态；备份完成后，再把文件下载到本地。如果 600 秒后远端仍然返回 `inProgress: true`，命令会超时退出。

`--output` 既可以是文件路径，也可以是已存在的目录路径。CLI 只会把已存在的路径识别为目录；如果路径不存在，就会按目标文件路径处理。

传入 `--json-output` 后，CLI 不再输出进度文本，而是直接打印最终 JSON 结果。这个模式更适合脚本和 agent 链路继续消费。

## 相关命令

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
