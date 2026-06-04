---
title: "nb config set"
description: "nb config set 命令参考：设置某个 CLI 配置项。"
keywords: "nb config set,NocoBase CLI,设置配置"
---

# nb config set

设置 CLI 配置项。当前支持的配置项为 `locale`、`update.policy`、`license.pkg-url`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git` 和 `bin.yarn`。

## 用法

```bash
nb config set <key> <value>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<key>` | string | 配置项名称：`locale`、`update.policy`、`license.pkg-url`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git` 或 `bin.yarn` |
| `<value>` | string | 配置值，不能为空 |

## 示例

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## 说明

设置 `license.pkg-url` 时，CLI 会规范化为以 `/` 结尾的 URL。

`update.policy` 支持 `prompt`、`auto` 和 `off`，默认值为 `prompt`。

## 相关命令

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
