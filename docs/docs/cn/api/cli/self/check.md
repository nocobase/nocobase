---
title: "nb self check"
description: "nb self check 命令参考：检查已安装 NocoBase CLI 的版本和自更新支持情况。"
keywords: "nb self check,NocoBase CLI,版本检查"
---

# nb self check

检查当前 NocoBase CLI 安装，解析所选 channel 的最新版本，并报告是否支持自动自更新。

## 用法

```bash
nb self check [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--channel` | string | 对比的发布 channel，默认 `auto`；可选 `auto`、`latest`、`beta`、`alpha` |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## 相关命令

- [`nb self update`](./update.md)
