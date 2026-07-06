---
title: 'nb config set'
description: 'nb config set 命令参考：设置某个 CLI 配置项。'
keywords: 'nb config set,NocoBase CLI,设置配置'
---

# nb config set

设置 CLI 配置项。支持的配置项见 [`nb config`](./index.md)。

## 用法

```bash
nb config set <key> <value>
```

## 参数

| 参数      | 类型   | 说明                                             |
| --------- | ------ | ------------------------------------------------ |
| `<key>`   | string | 配置项名称；支持的值见 [`nb config`](./index.md) |
| `<value>` | string | 配置值，不能为空                                 |

## 示例

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set nb-image-registry dockerhub
nb config set nb-image-registry aliyun
nb config set nb-image-variant full
nb config set nb-image-variant full-no-nginx
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## 说明

- `update.policy` 支持 `prompt`、`auto` 和 `off`，默认值为 `prompt`
- `nb-image-registry` 支持 `dockerhub` 和 `aliyun`，默认值为 `dockerhub`
- `nb-image-variant` 支持 `standard`、`no-nginx`、`full` 和 `full-no-nginx`，默认值为 `full`

## 相关命令

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
