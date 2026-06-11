---
title: "nb config"
description: "nb config 命令参考：管理 NocoBase CLI 的默认配置项。"
keywords: "nb config,NocoBase CLI,配置,默认配置"
---

# nb config

管理 CLI 默认配置。当前支持的配置项大致分成这几类：

- CLI 自身：`locale`、`update.policy`、`license.pkg-url`
- Docker 运行：`docker.network`、`docker.container-prefix`
- 外部可执行文件：`bin.docker`、`bin.caddy`、`bin.git`、`bin.nginx`、`bin.yarn`
- 代理生成：`proxy.nb-cli-root`、`proxy.upstream-host`、`proxy.nginx-driver`、`proxy.caddy-driver`

## 常用配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `locale` | 按 CLI 当前规则解析 | 覆盖 CLI 使用的语言 |
| `update.policy` | `prompt` | 启动时更新策略：`prompt`、`auto` 或 `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | 覆盖商业扩展包下载地址 |
| `docker.network` | `nocobase` | CLI 管理的 Docker 应用默认网络 |
| `docker.container-prefix` | `nb` | CLI 管理的 Docker 容器默认前缀 |
| `bin.docker` | `docker` | 覆盖 Docker 可执行文件路径 |
| `bin.caddy` | `caddy` | 覆盖 Caddy 可执行文件路径 |
| `bin.git` | `git` | 覆盖 Git 可执行文件路径 |
| `bin.nginx` | `nginx` | 覆盖 Nginx 可执行文件路径 |
| `bin.yarn` | `yarn` | 覆盖 Yarn 可执行文件路径 |
| `proxy.nb-cli-root` | CLI root（通常是当前用户 Home 目录） | 把 `.nocobase` 路径映射到代理进程实际看到的根目录 |
| `proxy.upstream-host` | `127.0.0.1` | 代理回源到 NocoBase 应用时使用的主机地址 |
| `proxy.nginx-driver` | `local` | `nb proxy nginx` 默认使用的运行方式 |
| `proxy.caddy-driver` | `local` | `nb proxy caddy` 默认使用的运行方式 |

## 用法

```bash
nb config <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb config get`](./get.md) | 读取某个配置项的生效值 |
| [`nb config set`](./set.md) | 设置某个配置项 |
| [`nb config delete`](./delete.md) | 删除某个显式配置项 |
| [`nb config list`](./list.md) | 列出当前显式设置过的配置项 |

## 示例

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## 相关命令

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
