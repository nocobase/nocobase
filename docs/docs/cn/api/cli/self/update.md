---
title: "nb self update"
description: "nb self update 命令参考：更新全局 npm、pnpm 或 yarn 安装的 NocoBase CLI。"
keywords: "nb self update,NocoBase CLI,更新,自更新"
---

# nb self update

当当前 CLI 由标准全局 npm、pnpm 或 yarn 安装管理时，更新已安装的 NocoBase CLI。

## 用法

```bash
nb self update [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--channel` | string | 更新到的发布 channel，默认 `auto`；可选 `auto`、`latest`、`test`、`beta`、`alpha` |
| `--yes`, `-y` | boolean | 跳过更新确认 |
| `--json` | boolean | 输出 JSON |
| `--skills` | boolean | 同时刷新全局安装的 NocoBase AI coding skills |
| `--verbose` | boolean | 显示详细更新输出 |

## 更新行为

`nb self update` 会先在运行时检测当前安装方式，不会使用历史的 `self-install-methods.json` 缓存结果。

如果有新版本，命令会使用当前全局 CLI 安装对应的包管理器更新：

| 安装方式 | 更新命令 |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

交互式确认默认选择 yes。脚本里可以使用 `--yes` 跳过确认。

## 示例

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## 相关命令

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
