---
title: "nb env proxy"
description: "nb env proxy 命令参考：为一个 CLI 托管 env 生成 Nginx 或 Caddy 代理配置。"
keywords: "nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,代理配置"
---

# nb env proxy

在 NocoBase CLI 中，`nb env proxy` 用来为一个 CLI 托管的 env 生成反向代理配置。默认用 `nginx` 就行。只有当你本来就在用 Caddy，或者明确要生成 Caddyfile 时，才需要把 provider 切到 `caddy`。

这个命令只适用于当前机器上可访问运行态的托管 env，也就是 `local` 或 `docker`。如果一个 env 只有远程 API 连接，或者是 SSH env，那么这个命令暂时不能用。

## 用法

```bash
nb env proxy [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要生成代理配置的已配置环境名称；省略时使用当前 env |
| `--output`, `-o` | string | 输出文件路径；默认是 `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | 代理 provider：`nginx` 或 `caddy` |
| `--host` | string | 写入入口配置的访问主机名，比如 `example.com` 或 `localhost` |
| `--port` | string | 写入入口配置的访问端口；这是代理入口端口，不是上游 NocoBase 应用端口 |
| `--install` | boolean | 把共享代理配置安装到 provider 主配置里 |
| `--reload` | boolean | 写入完成后校验并重载 provider |
| `--print` | boolean | 直接输出生成结果，不写入文件 |

## 默认生成结果

如果你不传 `--output`，CLI 会在 `~/.nocobase/proxy/<provider>/` 下面维护三层文件：

| provider | 自动生成文件 | 可编辑入口文件 | 共享主配置 |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

其中：

- `generated.*` 是 CLI 托管文件，每次执行都会覆盖
- `app.conf` / `app.caddy` 是可编辑入口文件，不过要保留 CLI 自动维护的 generated 引用
- `nocobase.conf` / `nocobase.caddy` 是共享主配置，用来统一包含所有 env 的入口配置

:::warning 注意

如果你要加站点级别的配置，改 `app.conf` 或 `app.caddy` 就行。`generated.conf` 和 `generated.caddy` 会在下次执行 `nb env proxy` 时被覆盖。

:::

如果你传了 `--output`，CLI 只会把自动生成的配置写到这个文件，不会额外创建或更新入口文件和共享主配置。

## 相关配置项

大部分场景直接执行 `nb env proxy` 就够了。不过下面几个 CLI 配置项会直接影响生成结果：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `proxy.provider` | `nginx` | `nb env proxy` 默认使用的 provider |
| `proxy.nb-cli-root` | CLI root（通常是当前用户 Home 目录） | 把 `.nocobase` 路径映射到代理进程实际看到的根目录 |
| `proxy.upstream-host` | `127.0.0.1` | 代理回源到 NocoBase 应用时使用的主机地址 |
| `bin.caddy` | `caddy` | `--install` 或 `--reload` 时调用的 Caddy 可执行文件路径 |
| `bin.nginx` | `nginx` | `--install` 或 `--reload` 时调用的 Nginx 可执行文件路径 |

通常来说，大部分场景不用改 `proxy.nb-cli-root`。只有当 Nginx 或 Caddy 运行在另一个容器、挂载目录或路径视角里时，才需要把它改成 provider 实际能访问到的根路径。

## 说明

- `--port` 只能传 `1` 到 `65535` 之间的整数
- 上游 NocoBase 应用端口来自已保存 env 的 `appPort`，不是 `--port`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name>`，或者显式补上 `nb env update <name> --app-port <port>`
- `--print` 不能和 `--install`、`--reload` 一起使用
- `--output` 不能和 `--install`、`--reload` 一起使用
- `--install` 负责把共享配置接进 provider 主配置；`--reload` 负责校验并重载 provider。两者通常会一起用

## 示例

```bash
# 为当前 env 生成默认 nginx 配置
nb env proxy

# 为指定 env 生成配置
nb env proxy demo

# 只输出 generated 配置，不写文件
nb env proxy demo --print

# 写入入口域名和端口
nb env proxy demo --host demo.local.nocobase.com --port 8080

# 生成 Caddy 配置
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# 调整默认 provider 和回源地址
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# 当 provider 运行在另一个挂载根目录里时，映射 .nocobase 路径
nb config set proxy.nb-cli-root /workspace

# 把共享配置安装到 provider 主配置，并立即校验重载
nb env proxy demo --install --reload
```

## 相关命令

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
