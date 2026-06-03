# 管理应用

如果你已经把一个 NocoBase 应用保存成 CLI env，日常管理基本都在 `nb app` 这一组命令里完成：启动、停止、重启、查看日志、升级，以及清理本地运行资源。

大多数时候，你不需要记住所有参数。先分清楚自己要做的是“把应用跑起来”“看日志排查问题”，还是“彻底清理这个 env”，再选对应命令就行。

## 快速索引

| 我想要…… | 用哪个命令 |
| --- | --- |
| 启动或恢复应用运行 | [`nb app start`](../../api/cli/app/start.md) |
| 临时停止应用 | [`nb app stop`](../../api/cli/app/stop.md) |
| 连同 CLI 托管的内置数据库一起停掉 | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| 修改配置后重新拉起应用 | [`nb app restart`](../../api/cli/app/restart.md) |
| 实时查看应用日志 | [`nb app logs`](../../api/cli/app/logs.md) |
| 升级到新的源码或镜像版本 | [`nb app upgrade`](../../api/cli/app/upgrade.md) |
| 移除 env 配置，但保留 storage 和本地 app 文件 | [`nb env remove`](../../api/cli/env/remove.md) |
| 连同本机托管资源一起彻底清理 | [`nb env remove --purge`](../../api/cli/env/remove.md) |

:::tip 先确认当前 env

`nb app` 命令默认作用在当前 env 上。如果你同时维护多个环境，默认推荐先切到目标 env，再执行启动、升级或清理操作。

```bash
nb env current
nb env use app1
```

如果你显式传入了不同的 `--env`，CLI 通常会要求确认。脚本或非交互场景里，可以加 `--yes` 跳过这一步。

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

```bash
nb app start --quickstart
nb app start --port 13000
nb app start --no-daemon
```

- `--quickstart` 适合已经确认源码和依赖没问题，只想尽快把服务拉起来的场景
- `--port` 可以临时覆盖 env 里保存的 `appPort`
- `--no-daemon` 只在本地 env 下有明显意义——应用会以前台模式运行，方便你直接看控制台输出

本地 npm/Git env 会启动本地应用进程，Docker env 会按已保存配置重建应用容器。详细参数见 [`nb app start`](../../api/cli/app/start.md)。

## 停止和重启

只想临时把应用停掉，用 `nb app stop`：

```bash
nb app stop
```

如果你刚改完配置、依赖或代码，通常来说直接 `nb app restart` 更省事：

```bash
nb app restart
nb app restart --quickstart
nb app restart --env app1 --yes
```

`nb app restart` 会先执行停止，再按 `start` 的方式重新启动，所以它也支持 `--port`、`--no-daemon`、`--instances` 这类启动参数。详细用法见 [`nb app stop`](../../api/cli/app/stop.md) 和 [`nb app restart`](../../api/cli/app/restart.md)。

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
4. 快速启动应用
5. 刷新 env runtime 信息

如果你已经提前更新好了源码或镜像，只想基于当前内容重启应用，可以加 `--skip-download`：

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

## 清理运行资源和销毁 env

这几种场景最容易混淆。可以先记住一个默认建议：

- 只是想把应用停掉，用 `nb app stop`
- 也想把当前机器上的内置数据库运行时一起停掉，用 `nb app stop --with-db`
- 确定这个 env 不再需要了，但想先保留 storage 和本地 app 文件，用 `nb env remove`
- 连本机托管资源也一起清理掉，再用 `nb env remove --purge`

如果你只是想停掉应用和 CLI 托管的内置数据库，直接这样写就行：

```bash
nb app stop --env app1 --with-db
```

如果你要移除这个 env，但还想保留 storage 和本地 app 文件：

```bash
nb env remove app1 --force
```

如果你确实要把这个 env 的本机托管内容也一起清理掉，那么加上 `--purge`：

```bash
nb env remove app1 --purge --force
```

对于 CLI 下载管理的本地 npm/Git env，`--purge` 还会删除 CLI 托管的本地应用文件。对于 HTTP 或 SSH env，它只会删除 CLI 里保存的 env 配置，不会去删除外部服务本身。

## 相关链接

- [多环境管理](./multi-environment.md)
- [`nb app` 命令参考](../../api/cli/app/index.md)
- [`nb env` 命令参考](../../api/cli/env/index.md)
