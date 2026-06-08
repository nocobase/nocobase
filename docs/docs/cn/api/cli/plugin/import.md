---
title: "nb plugin import"
description: "nb plugin import 命令参考：把插件压缩包或 npm 插件包导入选中 env 的 storage/plugins，或者导入自定义 storage 路径。"
keywords: "nb plugin import,NocoBase CLI,导入插件,storage-path,npm-registry"
---

# nb plugin import

把插件压缩包或 npm 插件包导入 `storage/plugins`。这个命令只负责把插件放到目标目录，不会自动启用插件。

## 用法

```bash
nb plugin import <archive> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<archive>` | string | 插件来源，必填。支持本地 `.tgz` 路径、远程 `http(s)` 压缩包地址，或者 npm 包名 / tag |
| `--env`, `-e` | string | CLI env 名称。省略时通常使用当前 env；如果显式传了 `--storage-path`，也可以不传 |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--storage-path` | string | 覆盖目标 storage 根目录。实际导入目录是 `<storage-path>/plugins` |
| `--npm-registry` | string | 当来源是 npm 包名或 tag 时，指定要使用的 npm registry |

## 示例

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta

# 私有 npm 源
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# 不依赖当前 env，直接写入一个本地 storage 路径
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## 说明

如果你已经选好了目标 env，默认直接导入这个 env 的 `storage/plugins` 就行。

如果你只想把插件放进某个本地 storage 目录，可以显式传 `--storage-path`。这时 `--env` 可以省略，CLI 会直接把插件写入 `<storage-path>/plugins`。

导入完成后，通常来说下一步是重启应用，再决定是否启用插件。其中：

- 第一次安装插件，通常先执行 [`nb app restart`](../app/restart.md)，再执行 [`nb plugin enable`](./enable.md)
- 如果只是重新导入一个新版本，通常先重启，再继续验证插件是否已经正常加载

如果来源是私有 npm registry，通常来说先登录，再执行导入：

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning 注意

这里不需要手动解压到 `storage/plugins`。`nb plugin import` 会自动把插件放到正确目录。

:::

## 相关命令

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`第三方插件安装与升级`](../../../quickstart/plugins/third-party.md)
