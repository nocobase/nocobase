# Caddy

如果你已经有域名，并且希望尽快把 HTTPS 也一起配好，Caddy 会更省心。大部分场景里，一份很短的 `Caddyfile` 就够了。

## 最小可用配置

编辑 `/etc/caddy/Caddyfile`：

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

## 检查并重载配置

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

如果你不是用 `systemd` 管理 Caddy，也可以改用你自己的启动和重载方式。

## 只想先走 HTTP

如果你暂时还没有域名，也可以先监听一个端口做验证：

```shell
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

不过正式环境里，还是建议尽快换成带域名的配置。

## 什么时候更适合用 Caddy

- 你希望更快接入 HTTPS
- 你不想自己维护太多反向代理配置
- 你目前只需要一个简单稳定的入口层

## 下一步去哪里看

- 如果你的应用还没跑起来，先看 [通过 Docker Compose 安装](../../installation/docker-compose.md)
- 如果你还要确认端口或密钥，继续看 [应用环境变量](../../installation/env.md)
