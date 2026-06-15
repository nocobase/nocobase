# 第三方插件安装与升级

如果你拿到的是第三方插件包，通常来说先把它导入目标应用的 `storage/plugins`，然后先重启应用，再继续启用或验证插件是否生效。

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 先切到目标 env，再开始导入或重启插件 | [先确认目标环境](#先确认目标环境) |
| 从远程压缩包、本地压缩包或 npm 导入第三方插件 | [用 `nb plugin import` 导入插件包](#用-nb-plugin-import-导入插件包) |
| 指定 storage 导入插件 | [指定 storage 路径导入](#指定-storage-路径导入) |
| 导入完成后让应用重新加载插件目录 | [`nb app restart`](../../api/cli/app/restart.md) |
| 第一次安装后正式启用插件 | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| 升级一个已经启用的第三方插件 | [升级插件时怎么做](#升级插件时怎么做) |
| 想确认插件是否已经出现在当前应用里 | [`nb plugin list`](../../api/cli/plugin/list.md) |
| 目标机器不能直接联网，只能手动上传 `.tgz` 再导入 | [不能直接联网时](#不能直接联网时) |

## 先确认目标环境

如果你本地管理了多个应用，先切到目标 env 再操作：

```bash
nb env use app1
```

## 用 `nb plugin import` 导入插件包

`nb plugin import` 支持三类来源：远程压缩包、本地压缩包、npm 包名。这个命令只负责把插件导入 `storage/plugins`，不会自动启用插件。

如果你已经拿到了插件包下载地址、本地文件路径，或者插件已经发布到 npm，可以执行：

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

如果你用的是私有 npm 源，通常来说先登录，再指定 registry：

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## 指定 storage 路径导入

如果你已经知道目标应用的 `storage` 根目录，也可以不依赖当前 env，直接传 `--storage-path`：

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

CLI 会把插件写入 `<storage-path>/plugins`。这时你可以不先执行 `nb env use`，也可以不传 `--env`。

## 导入之后先重启

导入完成后，先重启目标应用：

```bash
nb app restart
```

如果你没有先切换当前 env，也可以在命令里显式传入 `-e <env>`。

## 重启之后再启用或验证

如果这是第一次安装，重启后再启用插件：

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

第一次启用时会自动完成安装。

## 升级插件时怎么做

如果插件已经启用，而你这次只是换成一个新版本，通常来说只要两步：

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

如果你导入的是 npm 包，也是一样：

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

也就是说，升级场景不需要再额外执行 `nb plugin enable`。把新包导入进去，然后重启应用就可以。

## 不能直接联网时

如果目标机器不能直接访问插件下载地址，可以先把 `.tgz` 文件上传到目标机器的任意目录，再在目标机器执行本地导入。

比如：

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::warning 注意

这里不需要手动解压到 `storage/plugins`。`nb plugin import` 会自动把插件放到正确目录。

:::
