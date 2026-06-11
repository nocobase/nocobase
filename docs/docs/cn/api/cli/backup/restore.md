---
title: "nb backup restore"
description: "nb backup restore 命令参考：把本地备份文件恢复到目标 env。"
keywords: "nb backup restore,NocoBase CLI,恢复备份,还原,nbdata"
---

# nb backup restore

把本地备份文件恢复到目标 env。通常来说，这里使用的是 `*.nbdata` 文件。恢复会覆盖目标应用数据，所以 CLI 默认会再做一次确认。

## 用法

```bash
nb backup restore --file <path> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要恢复到的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--file`, `-f` | string | 本地备份文件路径，必填 |
| `--force` | boolean | 确认覆盖应用数据；在非交互终端和 AI agent 会话中必需显式传入 |

## 示例

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

执行前，CLI 会先检查 `--file` 指向的路径是否存在，并确认它是一个普通文件。路径不存在或指向目录时，命令会直接失败。

如果没有传入 `--force`，交互终端会再弹一次确认，明确提示这次恢复会覆盖应用数据。在非交互终端和 AI agent 会话中，如果缺少 `--force`，CLI 会直接拒绝执行，并给出一条可直接复制的重跑提示。如果同时还是跨 env 操作，则通常需要同时传入 `--yes` 和 `--force`。

上传成功后，CLI 会继续等待目标应用重新通过 `__health_check`。也就是说，命令成功返回时，应用通常已经恢复到可访问状态。

## 相关命令

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
