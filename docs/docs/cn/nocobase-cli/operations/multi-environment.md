# 多环境管理

如果你同时维护 `dev`、`test`、`staging`、`prod` 等多个 NocoBase 应用，可以把它们分别保存成 CLI env。之后大多数 `nb` 命令都会默认作用在当前 env 上，所以在执行 `nb app`、`nb api`、`nb db` 这类命令前，先确认自己正在用哪个 env 很重要。

CLI 从这一版开始把概念拆成了 `current env` 和 `last env`。你通常只需要关心 `current env`——也就是当前 shell 或 agent runtime 正在使用的环境。只有在没有开启 session mode 时，CLI 才会回退到全局 `last env`。

## 快速索引

| 我想要…… | 用哪个命令 |
| --- | --- |
| 新建一个本地 env，并顺手完成初始化 | [`nb init`](../../api/cli/init.md) |
| 把一个已有应用登记成 CLI env | [`nb env add`](../../api/cli/env/add.md) |
| 看本地保存了哪些 env | [`nb env list`](../../api/cli/env/list.md) |
| 检查所有 env 的连通性和认证状态 | [`nb env status --all`](../../api/cli/env/status.md) |
| 切换后续命令要使用的 env | [`nb env use`](../../api/cli/env/use.md) |
| 确认当前命令会落到哪个 env | [`nb env current`](../../api/cli/env/current.md) 和 [`nb env status`](../../api/cli/env/status.md) |
| 查看某个 env 保存了哪些详细配置 | [`nb env info`](../../api/cli/env/info.md) |
| 更新已保存的 env 配置，必要时让 CLI 重新同步当前状态 | [`nb env update`](../../api/cli/env/update.md) |
| 登录态过期后重新认证，或者改用新的认证方式 | [`nb env auth`](../../api/cli/env/auth.md) |
| 删除不用的 env 配置，必要时连本机托管资源一起清理 | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip 建议先开启 session mode

默认推荐先执行一次 [`nb session setup`](../../api/cli/session/setup.md)。这样不同终端、不同 shell，或者不同 agent runtime 可以各自维护自己的 `current env`，并行操作时不容易互相影响。

如果没有开启 session mode，那么 `nb env use` 会回退到更新全局 `last env`。这种情况下，一个终端切走环境，另一个终端也可能跟着受影响。

```bash
nb session setup
```

:::

## 创建多个环境

如果你要新建或恢复一个本地应用，用 `nb init` 就行。它会完成初始化，并把结果保存成一个新的 CLI env。

```bash
nb init --env dev
nb init --env test
```

如果应用已经存在，只是想把它接入 CLI，通常来说用 `nb env add` 更直接：

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

前者偏“初始化一个环境”，后者偏“登记一个已有环境”。如果你只是连接已有应用，默认用 `nb env add` 就行。

## 查看已经配置的环境

先用 `nb env list` 看看本地已经保存了哪些 env：

```bash
nb env list
```

这个命令只展示配置本身，不主动检查应用状态。想同时看连通性和认证状态时，用 `nb env status --all`：

```bash
nb env status --all
```

你通常会看到 `ok`、`auth failed`、`unreachable` 这类状态值。

## 切换当前环境

切换环境用 `nb env use`：

```bash
nb env use dev
```

切换完成后，后续省略 `--env` 的命令都会默认使用这个 env。

## 查看当前环境

如果你不确定当前命令会落到哪个环境上，先执行这两个命令：

```bash
nb env current
nb env status
```

`nb env current` 用来看名称，`nb env status` 用来看当前 env 是否可访问、认证是否正常。

## 查看单个 env 的详细信息

想看某个 env 保存了哪些配置，用 `nb env info`：

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

其中，`--field` 适合在脚本里只取一个值。`--show-secrets` 会明文显示 token、密码这类敏感信息，只有在你明确需要排查时再用。

## 更新 env 配置

`nb env update` 用来调整一个已保存 env 的配置。比如 API 地址、认证方式、源码来源、应用端口和数据库参数。更新完成后，CLI 会根据变更自动处理后续事宜。

如果你只是想让 CLI 按当前 env 的最新状态重新同步，直接这样写就行：

```bash
nb env update
nb env update prod
```

如果你要修改这个 env 保存的连接信息或本地配置，可以显式带上参数：

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

这里可以先记住一个默认判断：

- 要修改 env 保存的连接信息或本地配置，用 `nb env update`
- 应用接口、插件或 CLI 可用能力刚发生变化，也可以再执行一次 `nb env update`
- 登录态过期了，或者要重新走一遍认证流程，用 `nb env auth`
- 只是想看当前保存了什么，用 `nb env info`

如果你改的是 `app-port`、`timezone`、`db-*` 这类本地运行配置，`update` 只会改保存值，不会自动重启应用。通常来说后续还要再执行 `nb app restart --env <name>`；如果变更涉及 CLI 托管的内置数据库，则用 `nb app restart --env <name> --with-db`。

## 重新认证

如果 env 已经保存，只是登录态过期了，或者你想切换认证方式，可以重新认证：

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

省略环境名时，CLI 会使用当前 env。认证完成后，CLI 会自动处理后续同步。

## 移除环境

这几种场景最容易混淆。可以先记住一个默认建议：

- 只是想把应用停掉，用 `nb app stop`
- 也想把当前机器上的内置数据库运行时一起停掉，用 `nb app stop --with-db`
- 确定这个 env 不再需要了，但想先保留 storage 和本地 app 文件，用 `nb env remove`
- 连本机托管资源也一起清理掉，再用 `nb env remove --purge`

如果你只想移除保存的 env 配置：

```bash
nb env remove staging
```

如果是本地或 Docker 托管的 env，并且你还想一起清理本机上的运行资源和 storage 数据，可以加上 `--purge`：

```bash
nb env remove test --purge
```

在非交互模式下，`nb env remove` 需要显式传入 `--force`：

```bash
nb env remove test --purge --force
```

`--purge` 只会清理当前机器上的 CLI 托管资源。对于远程 API env，它不会去删除远端服务本身。

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

- [`nb env` 命令参考](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` 命令参考](../../api/cli/session/index.md)
- [nb app 的设计意图](../cli-design/nb-app-design-intent.md)
- [管理应用](./manage-app.md)
