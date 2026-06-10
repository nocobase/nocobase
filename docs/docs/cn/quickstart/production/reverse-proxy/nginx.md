# Nginx

如果你已经在服务器上用 Nginx 管理站点，或者后面还要自己接证书、缓存、访问控制，那么 `nb proxy nginx` 是默认推荐路径。

如果你只是想尽快把 HTTPS 配好，不想自己维护太多代理细节，那么 [Caddy](./caddy.md) 会更省心。不过只要你本来就在用 Nginx，这篇文档就是默认路径。

## 什么时候更适合用 Nginx

通常来说，下面几种情况优先继续使用 Nginx：

- 你已经在服务器上统一用 Nginx 管理多个站点
- 你后面还需要自己维护证书、缓存、访问控制或更多自定义规则
- 你希望入口层继续沿用现有的 Nginx 运维方式

如果你的目标只是尽快把 HTTPS 跑通，另外不想自己维护太多 TLS 细节，那么 [Caddy](./caddy.md) 会更省心。

## 推荐顺序：先选运行方式，再生成配置，再启动

如果你的应用已经保存成 CLI env，并且属于 `local` 或 `docker`，默认推荐按下面的顺序操作。

使用 Docker 方式运行 Nginx：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

使用本地进程方式运行 Nginx：

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

后续常用命令还有：

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

通常来说：

- `current` 用来快速查看当前的运行方式
- `status` 用来查看 Nginx 当前是否正常运行
- `info` 用来查看当前配置、路径和状态等完整信息
- 改完配置后，优先使用 `reload`
- 需要完整重启时，再使用 `restart`

## 生成配置时需要哪些输入

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

不过对于 NocoBase 来说，生产环境反向代理通常不只是一个简单的 `proxy_pass`。除了把 API 请求转发到后端应用之外，一份完整可用的配置通常还需要同时处理上传目录、前端静态资源、WebSocket、`.well-known` 路由，以及 SPA 回退页。

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

这样通常比从零手写一份配置更不容易漏掉 WebSocket、静态资源、上传目录或 SPA 回退页相关的细节。

## 检查并重载配置

如果你是手写或手工调整 Nginx 配置，改完后先校验，再重载：

```bash
nginx -t
systemctl reload nginx
```

如果你不是用 `systemd` 管理 Nginx，也可以按你自己的运行方式执行重载命令。

如果你是通过 `nb proxy nginx` 管理入口层，那么通常优先使用：

```bash
nb proxy nginx reload
```

## HTTPS 怎么处理

如果你已经决定继续用 Nginx，那么 HTTPS 也可以继续在 Nginx 里配。常见做法是把 `listen 80` 扩成 `80/443` 双入口，再补证书路径和 TLS 配置。

不过如果你只是想尽快拿到可用的 HTTPS，另外不想自己处理证书申请和续期，那么直接改用 [Caddy](./caddy.md) 会更省心。

## 常见说明

- `nb proxy nginx generate` 适用于 CLI 托管且当前机器可访问运行态的 env，也就是 `local` 或 `docker`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name> --app-port <port>`
- 如果你已经有一套很重的 Nginx 主配置，CLI 生成的配置通常更适合作为站点片段接进去，而不是替代整份主配置
- 如果你后续改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行 `generate`

## 相关链接

- [生产环境反向代理](./index.md)
- [Caddy](./caddy.md)
- [使用 CLI 安装（推荐）](../../installation/cli.md)
- [通过 Docker Compose 安装](../../installation/docker-compose.md)
- [应用环境变量](../../installation/env.md)
