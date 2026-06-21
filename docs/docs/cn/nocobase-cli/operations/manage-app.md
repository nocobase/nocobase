# 管理应用

如果你已经把一个 NocoBase 应用保存成 CLI env，日常管理基本都在 `nb app` 这一组命令里完成：启动、停止、重启、查看日志和升级。

大多数时候，你不需要记住所有参数。先分清楚自己要做的是“把应用跑起来”“看日志排查问题”，还是“升级到新的版本”，再选对应命令就行。

如果你想先理解 `nb app` 为什么会统一成这一组命令，以及它和 `nb app autostart` 的关系，先看 [nb app 的设计意图](../cli-design/nb-app-design-intent.md)。这篇页只保留最常见的日常操作。

## 快速索引

| 我想要…… | 用哪个命令 |
| --- | --- |
| 启动或恢复应用运行 | [`nb app start`](../../api/cli/app/start.md) |
| 临时停止应用 | [`nb app stop`](../../api/cli/app/stop.md) |
| 连同 CLI 托管的内置数据库一起停掉 | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| 修改配置后重新拉起应用 | [`nb app restart`](../../api/cli/app/restart.md) |
| 实时查看应用日志 | [`nb app logs`](../../api/cli/app/logs.md) |
| 升级到新的源码或镜像版本 | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip 先确认当前 env

`nb app` 命令默认作用在当前 env 上。如果你同时维护多个环境，默认推荐先确认目标 env，再执行启动、停止、日志或升级操作。

如果你显式传入了不同的 `--env`，CLI 通常会要求确认。脚本或非交互场景里，可以加 `--yes` 跳过这一步。多环境切换、查看和移除，统一放在 [多环境管理](./multi-environment.md) 里介绍。

:::

## 启动应用

把应用拉起来，默认用 `nb app start` 就行：

```bash
nb app start
```

如果你要操作的不是当前 env，可以显式指定：

```bash
nb app start --env app1 --yes
```

另外几个比较常用的启动参数：

- `nb app start` 默认会先自动完成必要的安装或升级准备，再把服务拉起来

本地 npm/Git env 会启动本地应用进程，Docker env 会按已保存配置重建应用容器。详细参数见 [`nb app start`](../../api/cli/app/start.md)。

## 停止和重启

只想临时把应用停掉，用 `nb app stop`：

```bash
nb app stop
```

如果你刚改完配置、依赖或代码，通常来说直接 `nb app restart` 更省事：

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` 会先执行停止，再按 `start` 的方式重新启动。详细用法见 [`nb app stop`](../../api/cli/app/stop.md) 和 [`nb app restart`](../../api/cli/app/restart.md)。

## 查看日志

排查问题时，通常先看日志：

```bash
nb app logs
```

如果你只想多看一点最近输出，或者不想持续跟随日志，可以这样用：

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

本地 npm/Git env 读取的是 pm2 日志，Docker env 读取的是容器日志。默认情况下，`nb app logs` 会持续跟随新日志输出。详细参数见 [`nb app logs`](../../api/cli/app/logs.md)。

## 升级应用

升级命令是 `nb app upgrade`：

```bash
nb app upgrade
```

这个命令做的不只是“下载新版本”。默认流程通常包括：

1. 停止当前应用
2. 下载并替换已保存的源码或镜像
3. 同步商业插件
4. 升级并启动应用
5. 刷新 env runtime 信息

如果你已经提前更新好了源码或镜像，只想基于当前内容继续执行升级并启动应用，可以加 `--skip-download`：

```bash
nb app upgrade --skip-download
```

如果你想显式指定目标版本，也可以加 `--version`：

```bash
nb app upgrade --version beta
```

:::warning 注意

`nb app upgrade` 在真正开始前通常还会要求你确认一次。脚本、CI 或其他非交互场景里，需要显式传入 `--force`。如果同时还是跨 env 操作，通常要一起带上 `--yes`。

```bash
nb app upgrade --env app1 --yes --force
```

:::

更完整的参数说明见 [`nb app upgrade`](../../api/cli/app/upgrade.md)。

## 相关链接

- [nb app 的设计意图](../cli-design/nb-app-design-intent.md)
- [多环境管理](./multi-environment.md)
- [`nb app` 命令参考](../../api/cli/app/index.md)
