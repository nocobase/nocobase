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
| `--skip-code-update`, `-s` | boolean | 使用已保存的本地源码或 Docker 镜像重启，不重新下载更新 |
| `--verbose` | boolean | 显示底层更新和重启命令输出 |

## 示例

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## 相关命令

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
