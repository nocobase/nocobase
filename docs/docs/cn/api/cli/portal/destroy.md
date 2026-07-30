---
title: "nb portal destroy"
description: "nb portal destroy 命令参考：删除 Portal 记录和对应的本地源码目录。"
keywords: "nb portal destroy,NocoBase CLI,Portal,删除本地源码目录,删除记录"
---

# nb portal destroy

删除 Portal 记录和对应的本地源码目录。

这个命令会影响远端 Portal 记录，也会清理本地源码目录。执行前建议先确认 Portal slug 和目标 env。

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
| `--force` | boolean | 忽略缺失的 Portal 记录或本地源码目录 |

## 示例

删除当前 env 中的 Portal：

```bash
nb portal destroy customer --yes
```

删除指定 env 中的 Portal：

```bash
nb portal destroy customer --env dev --yes
```

忽略已不存在的记录或源码目录：

```bash
nb portal destroy customer --force --yes
```

## 说明

`--force` 适合清理半完成状态：比如远端 Portal 记录已经不存在，但本地源码目录还在；或者本地源码目录已被手动删除，但远端记录还需要清理。

## 相关命令

- [`nb portal list`](./list.md)
- [`nb portal info`](./info.md)
