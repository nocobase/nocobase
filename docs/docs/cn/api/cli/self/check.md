---
title: "nb self check"
description: "nb self check 命令参考：检查已安装 NocoBase CLI 的版本和自更新支持情况。"
keywords: "nb self check,NocoBase CLI,版本检查"
---

# nb self check

检查当前 NocoBase CLI 安装，解析所选 channel 的最新版本，并报告是否支持自更新。

## 用法

```bash
nb self check [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--channel` | string | 对比的发布 channel，默认 `auto`；可选 `auto`、`latest`、`test`、`beta`、`alpha` |
| `--json` | boolean | 输出 JSON |

## 安装方式

`nb self check` 会在运行时检测当前安装方式，不会使用历史的 `self-install-methods.json` 缓存结果。

命令可能输出以下安装方式：

| 安装方式 | 含义 |
| --- | --- |
| `npm-global` | CLI 安装在当前 `npm prefix -g` 目录下 |
| `pnpm-global` | CLI 安装在 pnpm 全局 `node_modules` 目录下 |
| `yarn-global` | CLI 从 `yarn global bin` 启动，或安装在 `yarn global dir` 目录下 |
| `package-local` | CLI 安装在某个本地项目的依赖树里 |
| `source` | CLI 正在从源码仓库运行 |
| `unknown` | 无法匹配到受支持的安装方式 |

`npm-global`、`pnpm-global` 和 `yarn-global` 支持自更新。如果是 `package-local` 或 `source`，则需要更新对应的父项目依赖或源码仓库。

## 示例

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## 相关命令

- [`nb self update`](./update.md)
