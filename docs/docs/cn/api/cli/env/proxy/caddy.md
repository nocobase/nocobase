---
title: "nb env proxy caddy"
description: "nb env proxy caddy 命令参考：为一个 CLI 托管 env 生成 Caddy 代理配置。"
keywords: "nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,代理配置"
---

# nb env proxy caddy

`nb env proxy caddy` 用来为一个 CLI 托管的 env 生成 Caddy 代理配置。它适合这几类场景：你已经有域名，想尽快把 HTTPS 跑通，另外不想自己维护太多 TLS 细节。

这个命令只适用于当前机器上可访问运行态的托管 env，也就是 `local` 或 `docker`。如果一个 env 只有远程 API 连接，或者是 SSH env，那么这个命令暂时不能用。

## 用法

```bash
nb env proxy caddy [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要生成代理配置的已配置环境名称；省略时使用当前 env |
| `--env`, `-e` | string | 显式指定 env 名称。通常来说更推荐这一种写法 |
| `--output`, `-o` | string | 输出文件路径；只写自动生成的路由配置，不会额外创建 `app.caddy` 和共享主配置 |
| `--host` | string | 写入入口配置的访问主机名，比如 `example.com` 或 `localhost` |
| `--port` | string | 写入入口配置的访问端口；这是代理入口端口，不是上游 NocoBase 应用端口 |
| `--install` | boolean | 把共享代理配置安装到 Caddy 主配置里 |
| `--reload` | boolean | 写入完成后校验并重载 Caddy |
| `--print` | boolean | 直接输出自动生成的路由配置，不写入文件 |

## 默认生成结果

如果你不传 `--output`，CLI 会在 `~/.nocobase/proxy/caddy/` 下面维护这些文件：

| 文件 | 作用 |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | CLI 托管的实际反向代理配置，每次执行都会覆盖 |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | 可编辑的站点入口文件，你可以在这里补站点级别配置 |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | 共享主配置，用来统一导入所有 env 的 `app.caddy` |

其中：

- `generated.caddy` 只给 CLI 维护，不要手改
- `app.caddy` 可以改，不过要保留 CLI 自动插入的托管 import
- `nocobase.caddy` 主要给 `--install` 使用

:::warning 注意

如果你要补 Caddy 站点级别的配置，改 `app.caddy` 就行。`generated.caddy` 会在下次执行 `nb env proxy caddy` 时被覆盖。

:::

如果你传了 `--output`，CLI 只会把自动生成的配置写到这个文件，不会额外创建或更新 `app.caddy` 和共享主配置。

## 相关配置项

下面几个 CLI 配置项会直接影响 Caddy 生成结果：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root（通常是当前用户 Home 目录） | 把 `.nocobase` 路径映射到 Caddy 实际看到的根目录 |
| `proxy.upstream-host` | `127.0.0.1` | 代理回源到 NocoBase 应用时使用的主机地址 |
| `bin.caddy` | `caddy` | `--install` 或 `--reload` 时调用的 Caddy 可执行文件路径 |

通常来说，大部分场景不用改 `proxy.nb-cli-root`。只有当 Caddy 运行在另一个容器、挂载目录或路径视角里时，才需要把它改成 Caddy 实际能访问到的根路径。

## 说明

- `--host` 很重要。Caddy 会根据站点地址判断是否接管 HTTPS。正式环境里，默认尽量传一个已经解析到当前服务器的域名
- `--port` 只能传 `1` 到 `65535` 之间的整数
- 上游 NocoBase 应用端口来自已保存 env 的 `appPort`，不是 `--port`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name>`，或者显式补上 `nb env update <name> --app-port <port>`
- 如果你用 `nb env update` 修改了 `app-port`、`app-public-path` 这类会影响代理渲染结果的配置，改完后通常还要重新执行 `nb env proxy caddy`
- `--print` 不能和 `--install`、`--reload` 一起使用
- `--output` 不能和 `--install`、`--reload` 一起使用

## 示例

```bash
# 为当前 env 生成 Caddy 配置
nb env proxy caddy

# 为指定 env 生成配置
nb env proxy caddy --env demo

# 写入入口域名和端口
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# 只输出自动生成的路由配置
nb env proxy caddy --env demo --print

# 把自动生成的路由片段写到一个自定义文件
nb env proxy caddy --env demo --output ./generated.caddy

# 当 Caddy 运行在另一个挂载根目录里时，映射 .nocobase 路径
nb config set proxy.nb-cli-root /workspace

# 把共享配置安装到 Caddy 主配置，并立即校验重载
nb env proxy caddy --env demo --install --reload
```

## 相关命令

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
