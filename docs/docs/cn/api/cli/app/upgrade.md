---
title: "nb app upgrade"
description: "nb app upgrade 命令参考：更新源码或镜像并重启指定 NocoBase 应用。"
keywords: "nb app upgrade,NocoBase CLI,升级,更新,Docker 镜像"
---

# nb app upgrade

升级指定 NocoBase 应用。npm/Git 安装会刷新已保存源码并以 quickstart 重启；Docker 安装会刷新已保存镜像并重建应用容器。

## 用法

```bash
nb app upgrade [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要升级的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--skip-code-update`, `-s` | boolean | 使用已保存的本地源码或 Docker 镜像重启，不重新下载更新 |
| `--version` | string | 覆盖已保存的 `downloadVersion`；升级成功后会把新版本写回 env 配置 |
| `--verbose` | boolean | 显示底层更新和重启命令输出 |

## 示例

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
