# Nginx

如果你已经在服务器上用 Nginx 管理站点，或者后面还要自己接证书、缓存、访问控制，那么继续用 Nginx 最顺手。对 CLI 托管的 NocoBase env 来说，这也是默认推荐路径。

如果你只是想尽快把 HTTPS 配好，不想自己维护太多代理细节，那么 [Caddy](./caddy.md) 会更省心。不过只要你本来就在用 Nginx，这篇文档就是默认路径。

## 先确认两件事

- NocoBase 已经能通过内网地址正常访问，比如 `http://127.0.0.1:13000`
- 你知道这次是用 CLI 托管的 env，还是完全手写部署

通常来说，这两件事先分清，后面的选择就很直接：

- 如果应用已经保存成 CLI env，并且属于 `local` 或 `docker`，默认用 `nb env proxy nginx`
- 如果应用不是 CLI 托管的，或者你就是想完全自己维护 Nginx 配置，再手写 `server` 块

## 默认做法：让 CLI 生成 Nginx 配置

如果你的应用是通过 NocoBase CLI 安装、接管或保存成了一个 `local` / `docker` env，默认直接执行 `nb env proxy nginx` 就行。CLI 会同时维护可编辑入口文件、SPA 回退页、共享主配置和共享 snippets，比手写更不容易漏掉 WebSocket、子路径和后续更新。

先为指定 env 生成配置：

```bash
nb env proxy nginx --env demo
```

如果你已经切到了当前 env，也可以省略 `--env`：

```bash
nb env proxy nginx
```

如果你已经知道对外要用哪个域名或端口，可以在生成时一并写进去：

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy nginx --env demo --host demo.example.com --port 8080
```

这里的 `--port` 指的是代理入口端口，不是 NocoBase 应用本身监听的端口。上游应用端口来自这个 env 已保存的 `appPort`。

### CLI 会生成哪些文件

Nginx provider 会在 `~/.nocobase/proxy/nginx/` 下面维护这些文件：

| 文件 | 作用 |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | 可编辑的站点入口文件。CLI 会刷新其中的托管区块，你可以在外层补站点级别配置 |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | 基于当前 active client 的 `index.html` 生成的 v1 SPA 回退页 |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | 基于当前 active client 的 `v/index.html` 生成的 v2 SPA 回退页 |
| `~/.nocobase/proxy/nginx/nocobase.conf` | 共享主配置，用来统一包含所有 env 的 `app.conf` |
| `~/.nocobase/proxy/nginx/snippets/` | 共享 snippets 目录。CLI 会从内置模板同步复制到这里 |

其中：

- `app.conf` 可以改，不过要保留 `# BEGIN NocoBase managed config` 和 `# END NocoBase managed config` 之间的托管区块
- `index-v1.html` 和 `index-v2.html` 会按当前 env 的子路径、active client 版本，以及 `CDN_BASE_URL` 自动重写资源地址
- `nocobase.conf` 主要给 `--install` 使用，用来接进 Nginx 主配置
- `snippets/` 和 `public/` 下的文件通常不用手改，下次执行命令时会重新同步

:::warning 注意

如果你要加站点级别的 Nginx 配置，比如限流、额外 header、访问控制，改 `app.conf` 就行。`public/` 和 `snippets/` 下的托管文件会在下次执行 `nb env proxy nginx` 时被覆盖。

:::

### 把共享配置接进 Nginx 并重载

如果你希望 CLI 顺手把共享配置安装到 Nginx 主配置里，并立即校验后重载，可以直接这样写：

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

这两个参数的分工是：

- `--install` 把 `~/.nocobase/proxy/nginx/nocobase.conf` 接进 Nginx 主配置
- `--reload` 先校验配置，再重载 Nginx

如果你的 Nginx 可执行文件不在默认路径，先补一下 CLI 配置：

```bash
nb config set bin.nginx /usr/sbin/nginx
```

### 什么时候要改 `proxy.nb-cli-root`

通常来说，大部分场景不用改 `proxy.nb-cli-root`。只有当 Nginx 运行在另一个容器、挂载目录或路径视角里，看不到当前用户的 `~/.nocobase` 路径时，才需要把它改成 Nginx 实际能访问到的根路径。

比如 Nginx 在容器里看到的是 `/workspace/.nocobase/...`，那就这样设置：

```bash
nb config set proxy.nb-cli-root /workspace
nb env proxy nginx --env demo --install --reload
```

如果你只是想先看看渲染后的 `app.conf`，也可以先用：

```bash
nb env proxy nginx --env demo --print
```

Nginx provider 不支持 `--output`。更完整的参数说明见 [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)。

## 手写配置：不通过 CLI 时怎么做

如果你的应用不是 CLI 托管的，或者你明确要自己维护完整的 Nginx 配置，可以先从这个最小版本开始。通常来说，一份 `server` 块就够了。

先在服务器上创建一个配置文件，比如 `/etc/nginx/conf.d/nocobase.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

其中：

- `server_name` 改成你的域名
- `127.0.0.1:13000` 改成 NocoBase 实际监听的地址
- `client_max_body_size` 按你的上传需求调整

如果你的应用不是直接挂在 `/`，而是要放到某个子路径下，比如 `/app/`，那么手写配置时还要同时确认 `APP_PUBLIC_PATH`、`WS_PATH` 这类应用变量。这种场景更推荐回到 `nb env proxy nginx`，让 CLI 代你处理路由细节。

## 检查并重载配置

手写配置时，先校验，再重载：

```bash
nginx -t
systemctl reload nginx
```

如果你不是用 `systemd` 管理 Nginx，也可以按你自己的运行方式执行重载命令。

## HTTPS 怎么处理

如果你已经决定继续用 Nginx，那么 HTTPS 也可以继续在 Nginx 里配。常见做法是把 `listen 80` 扩成 `80/443` 双入口，再补证书路径和 TLS 配置。

不过如果你只是想尽快拿到可用的 HTTPS，另外不想自己处理证书申请和续期，那么直接改用 [Caddy](./caddy.md) 会更省心。

## 常见说明

- `nb env proxy nginx` 只适用于 CLI 托管且当前机器可访问运行态的 env，也就是 `local` 或 `docker`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name> --app-port <port>`
- `nb env proxy nginx` 不支持 `--output`。如果你只是想预览入口文件，用 `--print` 就行
- 如果你已经有一套很重的 Nginx 主配置，CLI 生成配置通常更适合作为站点片段接进去，而不是替代整份主配置

## 相关链接

- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [使用 CLI 安装（推荐）](../../installation/cli.md)
- [通过 Docker Compose 安装](../../installation/docker-compose.md)
- [应用环境变量](../../installation/env.md)
