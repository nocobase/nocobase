# Nginx

如果你的 NocoBase 应用已经能通过 `http://127.0.0.1:13000` 正常访问，下一步通常就是在前面加一层 Nginx。这样做主要有两个好处：对外只暴露标准的 `80/443` 端口，同时也更方便后续接 HTTPS、证书和缓存策略。

## 最小可用配置

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
- `client_max_body_size` 可以按你的上传需求继续调大

## 检查并重载配置

```bash
nginx -t
systemctl reload nginx
```

如果你不是用 `systemd` 管理 Nginx，也可以按你的运行方式执行重载命令。

## 配完之后怎么访问

如果 DNS 已经指向这台服务器，那么访问：

```text
http://your-domain.com
```

就会由 Nginx 转发到 NocoBase。

## HTTPS 怎么办

如果你还需要 HTTPS，通常有两种常见做法：

- 继续在 Nginx 上配置证书
- 直接改用 [Caddy](./caddy.md)，让它自动申请和续期证书

## 下一步去哪里看

- 如果你的应用还没跑起来，先看 [通过 Docker Compose 安装](../../installation/docker-compose.md)
- 如果你还要确认端口或密钥，继续看 [应用环境变量](../../installation/env.md)
