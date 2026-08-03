---
title: "nb portal destroy"
description: "nb portal destroy 命令参考：删除 Portal 记录和对应的部署目录。"
keywords: "nb portal destroy,NocoBase CLI,Portal,删除部署目录,删除记录"
---

# nb portal destroy

删除 Portal 记录和对应的部署目录。

这个命令会影响远端 Portal 记录，也会清理部署目录。开发目录默认保留，只有传入 `--delete-dev-path` 时才会删除。

## 用法

```bash
nb portal destroy <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 跳过确认提示 |
| `--force` | boolean | 忽略缺失的 Portal 记录或部署目录 |
| `--delete-dev-path`, `-D` | boolean | 同时删除 Portal 开发目录 |

## 示例

删除当前 env 中的 Portal：

```bash
nb portal destroy customer --yes
```

删除指定 env 中的 Portal：

```bash
nb portal destroy customer --env dev --yes
```

同时删除开发目录：

```bash
nb portal destroy customer --delete-dev-path --yes
```

忽略已不存在的记录或部署目录：

```bash
nb portal destroy customer --force --yes
```

## 说明

`--force` 适合清理半完成状态：比如远端 Portal 记录已经不存在，但部署目录还在；或者部署目录已被手动删除，但远端记录还需要清理。

## 相关命令

- [`nb portal list`](./list.md)
- [`nb portal info`](./info.md)
