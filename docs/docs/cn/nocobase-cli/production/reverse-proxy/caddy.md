# Caddy

如果你已经有域名，并且希望尽快把 HTTPS 一起配好，那么 `nb proxy caddy` 通常是最省心的入口方式。

比起自己维护 Nginx 的证书配置，Caddy 更像是“先把入口层跑通”的默认捷径。

## 什么时候更适合用 Caddy

通常来说，下面几种情况优先考虑 Caddy：

- 你已经有域名，希望尽快接入 HTTPS
- 你不想自己维护太多证书和 TLS 细节
- 你只需要一个简单稳定的入口层

如果你已经在服务器上统一用 Nginx 管理很多站点，或者后面还要做比较重的缓存、访问控制和定制规则，那么继续看 [Nginx](./nginx.md) 会更顺。

## 先按这三条命令操作

如果你只想先把 Caddy 入口层跑起来，默认记住这三条命令就够了：

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

如果本地已经安装好了 Caddy，把第一条改成 `nb proxy caddy use local` 就行。

多数场景下，先执行 `use`，再执行 `generate`，最后执行 `reload` 就够了。其他细节和更多命令，直接看后面的章节或 CLI 参考。

## 第一步：先选 Caddy 自己怎么运行

如果当前机器上已经安装好了 Caddy，直接用 `use local` 就行。

如果你想用 Docker 版的 Caddy，就用 `use docker`。

这里的 `local` / `docker` 指的是 **Caddy 本身的运行方式**。

使用 Docker 版 Caddy：

```bash
nb proxy caddy use docker
```

使用本地安装的 Caddy：

```bash
nb proxy caddy use local
```

如果你后面忘了当前选的是哪一种方式，可以执行：

```bash
nb proxy caddy current
```

## 第二步：执行 `generate`

`generate` 用来按指定 env 生成 Caddy 配置。最常见的写法是：

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

如果你还想指定入口端口，也可以一起写：

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

这里的参数含义是：

- `--env`：指定为哪个 CLI env 生成配置
- `--host`：指定对外访问域名
- `--port`：指定代理入口端口

对于 Caddy 来说，`--host` 尤其重要。正式环境里，默认尽量传一个已经解析到当前服务器的域名，这样 HTTPS 的接入会更自然。

如果命令提示 env 缺少 `appPort`，先执行：

```bash
nb env update test2 --app-port 56575
```

如果你后续又改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行 `generate`。

## 第三步：执行 `reload`

生成配置之后，直接执行：

```bash
nb proxy caddy reload
```

多数场景下都直接用这条命令就行。如果当前还没跑起来，内部会先处理启动；如果已经在运行，则会按最新配置重载。

## CLI 会维护哪些文件

以 `test2` 为例，Caddy 相关命令通常会维护这些文件与目录：

| 路径 | 作用 |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | CLI 生成的完整站点配置 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Caddy 总入口文件，负责导入所有 env 的 `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | v1 SPA 回退页 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | v2 SPA 回退页 |
| `NB_CLI_ROOT/test2/storage/dist-client` | 当前应用的前端构建产物目录 |
| `NB_CLI_ROOT/test2/storage/uploads` | 当前应用的上传目录 |

其中：

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` 下面的是 CLI 维护的代理辅助文件
- `NB_CLI_ROOT/test2/storage/...` 下面的是应用自己的静态资源和上传目录
- `nocobase.caddy` 是 provider 级入口文件，通常不需要手动改
- `app.caddy` 是某个 env 的完整 Caddy 站点配置，重新执行 `generate` 会整体覆盖

:::warning 注意

如果你要补 Caddy 站点级别的配置，比如额外 header、认证、限速或压缩策略，可以先以 `app.caddy` 为基准调整；不过要注意，后续重新执行 `generate` 会覆盖这个文件。

:::

## 手写配置：不通过 CLI 时怎么做

如果你的应用不是 CLI 托管的，或者你明确要自己维护完整的 Caddy 配置，也可以手写。

不过对于 NocoBase 来说，生产环境入口通常不只是一个简单的 `reverse_proxy`。除了把 API 请求转发到后端应用之外，一份完整可用的 Caddy 配置通常还需要同时处理上传目录、前端静态资源、`.well-known` 路由、WebSocket，以及 SPA 回退页。

以 `test2` 为例，和 Caddy 相关的关键目录通常包括：

- SPA 回退页目录：`NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- 前端构建产物目录：`NB_CLI_ROOT/test2/storage/dist-client`
- 上传目录：`NB_CLI_ROOT/test2/storage/uploads`

也就是说，手写配置时通常至少要覆盖下面这几类入口：

- `v`：把 `/v` 重定向到 `/v/`
- `uploads`：暴露上传目录
- `dist`：暴露前端构建产物目录
- `oauth well-known`：处理 OAuth 发现路径
- `openid well-known`：处理 OpenID 发现路径
- `api`：转发 `/api/` 请求到后端应用
- `ws`：转发 WebSocket 请求到后端应用
- `spa v2`：为 `/v/` 提供前端入口及回退页
- `spa v1`：为 `/` 提供前端入口及回退页

所以一份完整的 Caddy 配置，通常并不只是下面这种通用写法：

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

对 `test2` 这类 CLI 托管应用来说，更接近真实部署情况的结构通常会像下面这样：

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

这里也有两个关键点：

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` 下面的是 CLI 维护的 SPA 回退页目录
- `NB_CLI_ROOT/test2/storage/...` 下面的是应用自己的构建产物目录和上传目录

如果你的应用使用了子路径部署，或者前端资源、上传目录和入口层不在同一个路径视角里，那么手写配置会更容易出错。这种场景下，通常更推荐先执行：

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

然后再以生成结果为基准做调整。

如果你希望先让 CLI 帮你把路径和路由都跑通，那么生成后的结构通常会是：

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

其中：

- `nocobase.caddy` 负责统一 `import */app.caddy`
- `test2/app.caddy` 是 `test2` 这个 env 的完整站点配置
- `public/index-v1.html` 和 `public/index-v2.html` 是 CLI 生成的 SPA 回退页

更稳妥的做法通常是：

1. 先让 CLI 生成 Caddy 配置
2. 以生成结果作为基准确认路由结构和实际路径
3. 再根据你的域名、运行方式和挂载路径做手工调整

这样通常比从零手写一份配置更不容易漏掉 WebSocket、静态资源、上传目录、`.well-known` 路由或 SPA 回退页相关的细节。

## 检查并重载配置

如果你是手写或手工调整 Caddy 配置，改完后先校验，再重载：

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

如果你不是用 `systemd` 管理 Caddy，也可以改用你自己的启动和重载方式。

如果你是通过 `nb proxy caddy` 管理入口层，那么通常优先使用：

```bash
nb proxy caddy reload
```

如果你想看当前 driver、总入口文件路径、运行时根目录和容器或本地二进制信息，可以执行：

```bash
nb proxy caddy info
```

如果你只想快速确认当前是否已经跑起来，可以执行：

```bash
nb proxy caddy status
```

## 常见说明

- `nb proxy caddy generate` 适用于 `nb init` 安装的应用
- 如果你已经有能正常解析到服务器的域名，Caddy 往往是最快拿到 HTTPS 的方式
- 如果你后续改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行 `generate`

## 相关链接

- [生产环境反向代理](./index.md)
- [Nginx](./nginx.md)
- [使用 CLI 安装应用](../../installation/cli.md)
- [应用配置与 `.env`](../../installation/env.md)
- [`nb proxy caddy` 命令参考](../../../api/cli/proxy/caddy/index.md)
