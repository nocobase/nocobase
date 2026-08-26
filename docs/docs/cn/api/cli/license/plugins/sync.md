---
title: "nb license plugins sync"
description: "nb license plugins sync 命令参考：同步指定 env 当前授权允许使用的商业插件。"
keywords: "nb license plugins sync,NocoBase CLI,同步商业插件"
---

# nb license plugins sync

同步当前 license key 允许使用的商业插件。

## 用法

```bash
nb license plugins sync [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--dry-run` | boolean | 仅预览变更，不实际安装、升级或删除插件 |
| `--version` | string | 要同步的 registry 版本或 dist-tag；默认使用当前工作区版本 |
| `--skip-if-no-license` | boolean | 当前 env 没有保存 license key 时跳过，不报错、不退出 |
| `--verbose` | boolean | 输出每个插件的详细同步日志 |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## 说明

如果未显式指定 `--version`，CLI 会自动推断当前 app 版本，并据此决定下载哪个 registry 版本的商业插件。

`--skip-if-no-license` 只会放过“当前 env 没有保存 license key”这一种情况。其他错误，例如 license key 缺少 registry 凭据、registry 登录失败或插件下载失败，仍然会正常报错。

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
