# 商业插件激活与升级

如果你已经拿到了商业授权，通常来说整个流程只有 4 步：切到目标 env、激活 license、同步商业插件、重启应用。

`nb license` 的完整命令入口见 [nb license](../../api/cli/license/index)。

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 先切到目标 env，再对这个应用激活或同步商业插件 | [`nb env use`](../operations/multi-environment.md) |
| 已经拿到了 license key，直接激活授权 | [`nb license activate`](../../api/cli/license/activate.md) |
| 先取实例 ID，再去申请对应的 license key | [`nb license id`](../../api/cli/license/id.md) |
| 看当前 license 允许使用哪些商业插件 | [`nb license plugins list`](../../api/cli/license/plugins/list.md) |
| 把当前授权允许使用的商业插件同步到应用里 | [`nb license plugins sync`](../../api/cli/license/plugins/sync.md) |
| 同步完成后让插件版本真正生效 | [`nb app restart`](../../api/cli/app/restart.md) |
| 升级整个 NocoBase 应用，并顺手处理商业插件同步 | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

## 先确认目标环境

如果你本地管理了多个应用，先切到目标 env 再操作：

```bash
nb env use app1
```

这样后面的命令就可以直接针对当前 env 执行，不需要在每一条命令里重复写 `--env`。

## 激活商业授权

如果你已经拿到了 license key，最直接的方式有两种：

```bash
# 交互式粘贴 key
nb license activate

# 从文件读取 key
nb license activate --key-file ./license.txt
```

如果你想在 CLI 里直接完成申请和激活，也可以用在线方式：

```bash
nb license activate --online
```

交互终端下，CLI 会继续提示你输入授权服务账号、密码和应用名称。详细参数见 [nb license activate](../../api/cli/license/activate)。

## 如果你要先申请 license key，再取实例 ID

如果你不用 `--online`，而是准备先去申请一个 license key，那么这一步再执行 `nb license id` 就行：

```bash
nb license id
```

拿到实例 ID 后，再去申请对应的 license key。申请完成后，回到上一步执行 `nb license activate` 或 `nb license activate --key-file ./license.txt`。

## 同步当前授权允许使用的商业插件

授权激活完成后，执行：

```bash
nb license plugins sync
```

这个命令会按当前 app 版本去同步商业插件，包括下载新插件、升级已有插件，以及移除当前授权不再允许使用的插件。

如果你想先看当前 license 对应了哪些商业插件，可以先执行：

```bash
nb license plugins list
```

## 重启应用，让变更生效

同步完成后，重启目标应用：

```bash
nb app restart
```

如果这是第一次同步某个商业插件，重启后再到「插件管理」里启用它。如果这个插件原本已经启用，这次重启后新版本就会生效。

## 升级 NocoBase 时，商业插件怎么处理

如果你是在升级整个 NocoBase 应用，默认直接执行：

```bash
nb app upgrade
```

默认流程里，CLI 会自动执行 `nb license plugins sync --skip-if-no-license`。也就是说，大多数情况下你不需要在升级前后再手动执行一次商业插件同步。

:::warning 注意

如果你用了 `nb app upgrade --skip-download`，CLI 会跳过商业插件同步。这种情况下，如果你还想更新商业插件，需要在升级或重启后手动执行一次 `nb license plugins sync`。

:::

如果你这次只是更新授权内容，或者只是想单独拉取最新允许使用的商业插件，不需要升级整个应用，直接执行下面两条命令就够了：

```bash
nb license plugins sync
nb app restart
```

## 继续阅读

- [nb license](../../api/cli/license/index)
- [nb license activate](../../api/cli/license/activate)
- [nb license plugins sync](../../api/cli/license/plugins/sync)
- [nb app upgrade](../../api/cli/app/upgrade)
- [多环境管理](../operations/multi-environment)
- [管理应用](../operations/manage-app)
