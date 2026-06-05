# Caddy

如果你已经有域名，并且希望尽快把 HTTPS 一起配好，Caddy 通常是最省心的选择。比起自己维护 Nginx 证书配置，Caddy 更像是“把入口层先跑通”的默认捷径。

不过在 NocoBase CLI 里，反向代理的默认 provider 仍然是 `nginx`。所以如果你准备用 Caddy，要么在命令里显式带上 `--provider caddy`，要么先把默认 provider 改掉。

## 什么时候更适合用 Caddy

通常来说，下面几种情况优先考虑 Caddy：

- 你已经有域名，希望尽快接入 HTTPS
- 你不想自己维护太多证书和 TLS 细节
- 你只需要一个简单稳定的入口层

如果你已经在服务器上统一用 Nginx 管理很多站点，或者后面还要做比较重的缓存、访问控制和定制规则，那么继续看 [Nginx](./nginx.md) 会更顺。

## 默认做法：让 CLI 生成 Caddy 配置

如果你的应用已经保存成 CLI env，并且属于 `local` 或 `docker`，默认还是推荐让 CLI 生成配置。这样 Caddyfile 里跟 NocoBase 路由、WebSocket、子路径相关的细节都由 CLI 维护，你只需要关心站点入口本身。

最直接的写法是：

```bash
nb env proxy demo --provider caddy --host demo.example.com
```

如果你接下来都打算用 Caddy，可以先把 provider 默认值切过去：

```bash
nb config set proxy.provider caddy
nb env proxy demo --host demo.example.com
```

如果你还想指定入口端口，也可以一起写：

```bash
nb env proxy demo --provider caddy --host demo.example.com --port 8080
```

这里的 `--host` 很重要。Caddy 会根据站点地址判断是否接管 HTTPS。正式环境里，默认尽量传一个已经解析到当前服务器的域名。

### CLI 会生成哪些文件

如果你没有传 `--output`，Caddy provider 会在 `~/.nocobase/proxy/caddy/<env>/` 下面维护三层文件：

| 文件 | 作用 |
| --- | --- |
| `generated.caddy` | CLI 托管的实际反向代理配置，每次执行 `nb env proxy` 都会覆盖 |
| `app.caddy` | 可编辑的站点入口文件，你可以在这里补站点级别配置 |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | 共享主配置，用来统一导入所有 env 的 `app.caddy` |

其中：

- `generated.caddy` 只给 CLI 维护，不要手改
- `app.caddy` 可以改，不过要保留 CLI 自动插入的 generated import
- `nocobase.caddy` 主要给 `--install` 使用，用来接进 Caddy 主配置

:::warning 注意

如果你要补 Caddy 站点级别的配置，比如额外 header、认证、限速或压缩策略，改 `app.caddy` 就行。`generated.caddy` 会在下次执行 `nb env proxy` 时被覆盖。

:::

### 把共享配置接进 Caddy 并重载

如果你希望 CLI 直接把共享配置安装到 Caddy 主配置里，并立即校验后重载，可以这样写：

```bash
nb env proxy demo --provider caddy --host demo.example.com --install --reload
```

这两个参数的分工是：

- `--install` 把 `~/.nocobase/proxy/caddy/nocobase.caddy` 接进 Caddy 主配置
- `--reload` 先校验配置，再重载 Caddy

如果你的 Caddy 可执行文件不在默认路径，先补一下 CLI 配置：

```bash
nb config set bin.caddy /usr/bin/caddy
```

### 什么时候要改 `proxy.nb-cli-root`

通常来说，大部分场景不用改 `proxy.nb-cli-root`。只有当 Caddy 运行在另一个容器、挂载目录或路径视角里，看不到当前用户的 `~/.nocobase` 路径时，才需要把它改成 Caddy 实际能访问到的根路径。

比如 Caddy 在容器里看到的是 `/workspace/.nocobase/...`，那就这样设置：

```bash
nb config set proxy.nb-cli-root /workspace
nb env proxy demo --provider caddy --install --reload
```

如果你只是想先预览生成结果，可以用：

```bash
nb env proxy demo --provider caddy --print
```

更完整的参数说明见 [`nb env proxy`](../../../api/cli/env/proxy.md)。

## 手写配置：不通过 CLI 时怎么做

如果你的应用不是 CLI 托管的，或者你明确要自己维护整份 `Caddyfile`，可以先从这个最小版本开始：

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

其中：

- `your-domain.com` 改成你的域名
- `127.0.0.1:13000` 改成 NocoBase 实际监听的地址

如果域名已经正确解析到当前服务器，Caddy 通常会自动处理 HTTPS 证书的申请和续期。

如果你暂时还没有域名，只是想先验证反向代理链路，可以先监听一个端口：

```text
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

不过正式环境里，还是建议尽快换成带域名的站点地址。这样 Caddy 才能把 HTTPS 也一并接管起来。

如果你的应用不是直接挂在 `/`，而是要放到某个子路径下，那么手写 Caddy 配置时还要同时确认 `APP_PUBLIC_PATH`、`WS_PATH` 这类应用变量。这种场景更推荐回到 `nb env proxy`，让 CLI 生成配置。

## 检查并重载配置

手写配置时，先校验，再重载：

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

如果你不是用 `systemd` 管理 Caddy，也可以改用你自己的启动和重载方式。

## 常见说明

- `nb env proxy` 只适用于 CLI 托管且当前机器可访问运行态的 env，也就是 `local` 或 `docker`
- 如果命令提示 env 缺少 `appPort`，先执行 `nb env update <name> --app-port <port>`
- `--output` 和 `--print` 适合做预览或自定义集成，不过这两种写法不会额外创建 `app.caddy` 和共享主配置
- 如果你已经有能正常解析到服务器的域名，Caddy 往往是最快拿到 HTTPS 的方式

## 相关链接

- [`nb env proxy`](../../../api/cli/env/proxy.md)
- [使用 CLI 安装（推荐）](../../installation/cli.md)
- [通过 Docker Compose 安装](../../installation/docker-compose.md)
- [应用环境变量](../../installation/env.md)
