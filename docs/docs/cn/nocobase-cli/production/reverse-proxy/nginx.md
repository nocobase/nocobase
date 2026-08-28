# Nginx

如果你已经在服务器上用 Nginx 管理站点，或者后面还要自己接证书、缓存、访问控制，那么 `nb proxy nginx` 是默认推荐路径。

如果你只是想尽快把 HTTPS 配好，不想自己维护太多代理细节，那么 [Caddy](./caddy.md) 会更省心。不过只要你本来就在用 Nginx，这篇文档就是默认路径。

## 什么时候更适合用 Nginx

通常来说，下面几种情况优先继续使用 Nginx：

- 你已经在服务器上统一用 Nginx 管理多个站点
- 你后面还需要自己维护证书、缓存、访问控制或更多自定义规则
- 你希望入口层继续沿用现有的 Nginx 运维方式

如果你的目标只是尽快把 HTTPS 跑通，另外不想自己维护太多 TLS 细节，那么 [Caddy](./caddy.md) 会更省心。

## 先按这三条命令操作

如果你只想先把 Nginx 入口层跑起来，默认记住这三条命令就够了：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

如果本地已经安装好了 Nginx，把第一条改成 `nb proxy nginx use local` 就行。

多数场景下，先执行 `use`，再执行 `generate`，最后执行 `reload` 就够了。其他细节和更多命令，直接看后面的章节或 CLI 参考。

## 第一步：先选 Nginx 自己怎么运行

如果当前机器上已经安装好了 Nginx，直接用 `use local` 就行。

如果你想用 Docker 版的 Nginx，就用 `use docker`。

这里的 `local` / `docker` 指的是 **Nginx 本身的运行方式**。

使用 Docker 版 Nginx：

```bash
nb proxy nginx use docker
```

使用本地安装的 Nginx：

```bash
nb proxy nginx use local
```

如果你后面忘了当前选的是哪一种方式，可以执行：

```bash
nb proxy nginx current
```

## 第二步：执行 `generate`

`generate` 用来按指定 env 生成 Nginx 入口配置。最常见的写法是：

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

如果你还想指定入口端口，也可以一起写：

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

这里的参数含义是：

- `--env`：指定为哪个 CLI env 生成配置
- `--host`：指定对外访问域名
- `--port`：指定代理入口端口，不是 NocoBase 应用本身的 `appPort`

上游应用端口来自这个 env 已保存的 `appPort`。如果命令提示 env 缺少 `appPort`，先执行：

```bash
nb env update test2 --app-port 56575
```

如果你后续又改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行 `generate`。

## 第三步：执行 `reload`

生成配置之后，直接执行：

```bash
nb proxy nginx reload
```

多数场景下都直接用这条命令就行。如果当前还没跑起来，内部会先处理启动；如果已经在运行，则会按最新配置重载。

## CLI 会维护哪些文件

以 `test2` 为例，Nginx 相关命令通常会维护这些文件与目录：

| 路径 | 作用 |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Nginx 共享 snippets 目录 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | 可编辑的站点入口配置 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | v1 SPA 回退页 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | v2 SPA 回退页 |
| `NB_CLI_ROOT/test2/storage/dist-client` | 当前应用的前端构建产物目录 |
| `NB_CLI_ROOT/test2/storage/uploads` | 当前应用的上传目录 |

其中：

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` 下面的是 CLI 维护的代理辅助文件
- `NB_CLI_ROOT/test2/storage/...` 下面的是应用自己的静态资源和上传目录
- `app.conf` 可以改，不过要保留 NocoBase 托管区块
- `index-v1.html` 和 `index-v2.html` 会按当前 env 的子路径、active client 版本，以及 `CDN_BASE_URL` 自动重写资源地址

:::warning 注意

如果你要加站点级别的 Nginx 配置，比如限流、额外 header、访问控制，改 `app.conf` 就行。CLI 托管的辅助文件会在后续重新生成时同步更新。

:::

## 手写配置：不通过 CLI 时怎么做

如果你的应用不是 CLI 托管的，或者你明确要自己维护完整的 Nginx 配置，也可以手写。

不过对于 NocoBase 来说，生产环境反向代理通常不只是一个简单的 `proxy_pass`。除了把 API 请求转发到后端应用之外，一份完整可用的配置通常还需要同时处理上传目录、前端静态资源、文件访问入口 `/files/`、WebSocket、`.well-known` 路由，以及 SPA 回退页。

以 `test2` 为例，和 Nginx 相关的关键文件与目录通常包括：

- Nginx snippets：`NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- 可编辑入口配置：`NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA 回退页（v1）：`NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA 回退页（v2）：`NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- 前端构建产物目录：`NB_CLI_ROOT/test2/storage/dist-client`
- 上传目录：`NB_CLI_ROOT/test2/storage/uploads`

也就是说，手写配置时通常至少要覆盖下面这几类入口：

- `uploads`：通过 `alias` 暴露上传目录
- `dist`：通过 `alias` 暴露前端构建产物目录
- `well-known`：处理 OAuth / OpenID 相关发现路径
- `files`：把 `/files/` 下的文件访问请求转发到后端应用
- `api`：转发 `/api/` 请求到后端应用
- `ws`：转发 WebSocket 请求到后端应用
- `spa`：为 `/` 和 `/v/` 提供前端入口及 `try_files` 回退

所以一份完整的 Nginx 配置，通常并不只是下面这种通用反向代理写法：

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

对 `test2` 这类 CLI 托管应用来说，更接近真实部署情况的结构通常会像下面这样：

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /files/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

这里有两个关键点：

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` 下面的是 CLI 维护的代理辅助文件
- `NB_CLI_ROOT/test2/storage/...` 下面的是应用自己的产物目录和上传目录

如果你的应用使用了子路径部署，或者前端资源、上传目录和反向代理不在同一个路径视角里，那么手写配置会更容易出错。这种场景下，通常更推荐先执行：

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

然后再以生成结果为基准做调整。

更稳妥的做法通常是：

1. 先让 CLI 生成 Nginx 配置
2. 以生成结果作为基准确认路由结构和实际路径
3. 再根据你的域名、运行方式和挂载路径做手工调整

这样通常比从零手写一份配置更不容易漏掉 `/files/`、WebSocket、静态资源、上传目录或 SPA 回退页相关的细节。

:::warning 注意

`/files/` 是需要经过 NocoBase 鉴权的应用路由，不能作为静态目录处理，也不能落入 SPA 回退页。手写配置时，需要把它转发到 NocoBase 后端，并放在 `location /` 等前端回退规则之前。

如果配置了 `APP_PUBLIC_PATH=/nocobase/`，还需要转发 `/nocobase/files/`。为了兼容已有的根路径文件地址，建议同时保留 `/files/` 转发规则。

:::

## HTTPS 怎么处理

如果你已经决定继续用 Nginx，那么 HTTPS 也可以继续在 Nginx 里配。常见做法是把 `listen 80` 扩成 `80/443` 双入口，再补证书路径和 TLS 配置。

不过如果你只是想尽快拿到可用的 HTTPS，另外不想自己处理证书申请和续期，那么直接改用 [Caddy](./caddy.md) 会更省心。

## 常见说明

- `nb proxy nginx generate` 适用于 `nb init` 安装的应用
- 如果你后续改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行 `generate`

## 相关链接

- [生产环境反向代理](./index.md)
- [Caddy](./caddy.md)
- [使用 CLI 安装应用](../../installation/cli.md)
- [应用配置与 `.env`](../../installation/env.md)
- [`nb proxy nginx` 命令参考](../../../api/cli/proxy/nginx/index.md)
