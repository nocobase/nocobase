---
title: "nb app upgrade"
description: "nb app upgrade 命令参考：先停止应用，再下载并替换源码或镜像，然后升级并启动指定 NocoBase 应用。"
keywords: "nb app upgrade,NocoBase CLI,升级,更新,Docker 镜像"
---

# nb app upgrade

升级指定 NocoBase 应用。CLI 会先停止当前应用，默认重新下载并替换已保存的源码或镜像，然后同步商业插件、升级并启动应用，并在最后刷新 env runtime。Docker env 的启动阶段会按已保存配置重建应用容器。

## 用法

```bash
nb app upgrade [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要升级的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--force`, `-f` | boolean | 跳过升级确认。在非交互终端和 AI agent 会话中必需显式传入 |
| `--skip-download`, `-s` | boolean | 跳过源码或镜像下载，直接基于当前已保存的本地源码或 Docker 镜像执行升级并启动；同时跳过 `nb license plugins sync` |
| `--version` | string | 覆盖本次 upgrade 的目标版本；升级成功后会把新版本写回 env 配置中的 `downloadVersion` |
| `--verbose` | boolean | 显示底层更新和重启命令输出 |

## 示例

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

在真正开始升级前，交互终端还会再做一次升级确认，除非你显式传入 `--force`。在非交互终端和 AI agent 会话中，如果没有 `--force`，`nb app upgrade` 会直接拒绝执行，并输出一条可直接复制的重跑命令。如果同时还是跨 env 操作，则需要同时传入 `--yes` 和 `--force`。

默认流程下，`nb app upgrade` 会依次执行：

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. 在需要时保存新的 `downloadVersion`
6. `nb env update`

如果传入 `--skip-download`，CLI 会跳过第 2 步和第 3 步，直接基于当前已保存的源码或镜像执行升级并启动。此时如果同时传入 `--version`，CLI 不会在本次升级中下载该版本，而是在成功后仅把它保存为新的 `downloadVersion`，供后续升级或恢复使用。

第 4 步会按当前代码状态自动完成必要的升级准备，再等待应用通过 `__health_check`。等待期间，CLI 会先输出一条等待日志，之后每 10 秒输出一条进度提示，直到应用就绪或超时。

如果最后的 `nb env update` 失败，upgrade 仍然视为成功，但 CLI 会给出 warning，并提示你后续单独执行 `nb env update <envName>`。

## Hook 脚本

如果当前 env 通过 `nb init --hook-script` 保存了 hook，`nb app upgrade` 会把 upgrade 生命周期传给 hook。npm/Git source 在刷新源码并执行依赖安装前，会运行 `beforeDependencyInstall(context)`，此时 `context.phase = 'upgrade'`，`context.command = 'app:upgrade'`。

随后应用升级启动阶段会运行 `beforeAppInstall(context)`，并在应用启动且通过 `__health_check` 后运行 `afterAppStart(context)`。这两个 hook 同样使用 `context.phase = 'upgrade'` 和 `context.command = 'app:upgrade'`。Docker source 不会运行 `beforeDependencyInstall`，但会运行应用级 hook。

## 相关命令

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
