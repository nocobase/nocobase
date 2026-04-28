---
title: "nb plugin list"
description: "nb plugin list 命令参考：列出选中 NocoBase env 的插件。"
keywords: "nb plugin list,NocoBase CLI,插件列表"
---

# nb plugin list

列出选中 env 的已安装插件。

## 用法

```bash
nb plugin list [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |

## 示例

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## 相关命令

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
