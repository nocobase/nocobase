---
title: "nb env proxy nginx"
description: "nb env proxy nginx 命令参考：为一个 CLI 托管 env 生成 Nginx 代理配置和辅助文件。"
keywords: "nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,代理配置"
---

# nb env proxy nginx

`nb env proxy nginx` 用来为一个 CLI 托管的 env 生成 Nginx 代理配置和辅助文件。它适合这几类场景：你已经在用 Nginx 管理站点，或者你还需要继续自己接证书、缓存、访问控制。

这个命令只适用于当前机器上可访问运行态的托管 env，也就是 `local` 或 `docker`。如果一个 env 只有远程 API 连接，或者是 SSH env，那么这个命令暂时不能用。

## 用法

```bash
nb env proxy nginx [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要生成代理配置的已配置环境名称；省略时使用当前 env |
| `--env`, `-e` | string | 显式指定 env 名称。通常来说更推荐这一种写法 |
| `--host` | string | 写入入口配置的访问主机名，比如 `example.com` 或 `localhost` |
| `--port` | string | 写入入口配置的访问端口；这是代理入口端口，不是上游 NocoBase 应用端口 |
| `--install` | boolean | 把共享代理配置安装到 Nginx 主配置里 |
| `--reload` | boolean | 写入完成后校验并重载 Nginx |
| `--print` | boolean | 直接输出渲染后的 `app.conf`，不写入文件 |

## 默认生成结果

`nb env proxy nginx` 会在 `~/.nocobase/proxy/nginx/` 下面维护这些文件：

| 文件 | 作用 |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | 可编辑的站点入口文件。CLI 会刷新其中的托管区块，你可以在外层补站点级别配置 |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | 基于当前 active client 的 `index.html` 生成的 v1 SPA 回退页 |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | 基于当前 active client 的 `v/index.html` 生成的 v2 SPA 回退页 |
| `~/.nocobase/proxy/nginx/nocobase.conf` | 共享主配置，用来统一包含所有 env 的 `app.conf` |
| `~/.nocobase/proxy/nginx/snippets/` | 共享 snippets 目录。CLI 会从内置模板同步复制到这里 |

其中：

- `app.conf` 可以编辑，不过要保留 `# BEGIN NocoBase managed config` 和 `# END NocoBase managed config` 之间的托管区块
- `index-v1.html` 和 `index-v2.html` 会按当前 env 的子路径、active client 版本，以及 `CDN_BASE_URL` 自动重写资源地址
- `nocobase.conf` 主要给 `--install` 使用
- `public/` 和 `snippets/` 下的托管文件通常不用手改，下次执行命令时会重新同步

:::warning 注意

如果你要加站点级别的 Nginx 配置，改 `app.conf` 就行。不要手改 `public/` 和 `snippets/` 下的托管文件，下次执行 `nb env proxy nginx` 时它们会被覆盖。

:::

## 相关配置项

下面几个 CLI 配置项会直接影响 Nginx 生成结果：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root（通常是当前用户 Home 目录） | 把 `.nocobase` 路径映射到 Nginx 实际看到的根目录 |
| `proxy.upstream-host` | `127.0.0.1` | 代理回源到 NocoBase 应用时使用的主机地址 |
| `bin.nginx` | `nginx` | `--install` 或 `--reload` 时调用的 Nginx 可执行文件路径 |

通常来说，大部分场景不用改 `proxy.nb-cli-root`。只有当 Nginx 运行在另一个容器、挂载目录或路径视角里时，才需要把它改成 Nginx 实际能访问到的根路径。

## 说明

- `--port` 只能传 `1` 到 `65535` 之间的整数
- 上游 NocoBase 应用端口来自已保存 env 的 `appPort`，不是 `--port`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name>`，或者显式补上 `nb env update <name> --app-port <port>`
- 如果你用 `nb env update` 修改了 `app-port`、`app-public-path` 这类会影响代理渲染结果的配置，改完后通常还要重新执行 `nb env proxy nginx`
- `--print` 不能和 `--install`、`--reload` 一起使用
- Nginx provider 不支持 `--output`

## 示例

```bash
# 为当前 env 生成 Nginx 配置
nb env proxy nginx

# 为指定 env 生成配置
nb env proxy nginx --env demo

# 写入入口域名和端口
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# 只输出渲染后的 app.conf，不写文件
nb env proxy nginx --env demo --print

# 当 Nginx 运行在另一个挂载根目录里时，映射 .nocobase 路径
nb config set proxy.nb-cli-root /workspace

# 把共享配置安装到 Nginx 主配置，并立即校验重载
nb env proxy nginx --env demo --install --reload
```

## 相关命令

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
