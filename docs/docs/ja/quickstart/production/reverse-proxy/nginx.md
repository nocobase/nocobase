# Nginx

NocoBase アプリがすでに `http://127.0.0.1:13000` で正常にアクセスできるなら、次の一歩はその前段に Nginx を置くことです。こうしておくと主に 2 つの利点があります。外向けには標準の `80/443` ポートだけを公開すればよくなり、そのあとで HTTPS、証明書、キャッシュ戦略も追加しやすくなります。

## 最小構成

まずはサーバー上に設定ファイルを作成します。たとえば `/etc/nginx/conf.d/nocobase.conf` です。

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

ここでのポイントは次のとおりです。

- `server_name` は自分のドメインに置き換えます
- `127.0.0.1:13000` は NocoBase が実際に待ち受けているアドレスに置き換えます
- `client_max_body_size` はアップロード要件に合わせてさらに大きくできます

## 設定を検証して再読み込みする

```bash
nginx -t
systemctl reload nginx
```

Nginx を `systemd` で管理していない場合は、自分の運用方法に合わせた再読み込み手順を使ってください。

## 設定後のアクセス方法

DNS がすでにこのサーバーを向いているなら、次へアクセスします。

```text
http://your-domain.com
```

これで Nginx が NocoBase へ転送します。

## HTTPS はどうするか

HTTPS も必要であれば、通常は次の 2 つのやり方があります。

- 引き続き Nginx 側で証明書を設定する
- そのまま [Caddy](./caddy.md) に切り替えて、証明書の取得と更新を自動化する

## 次に見るページ

- アプリがまだ起動していないなら、まず [Docker Compose でインストール](../../installation/docker-compose.md) を見てください
- ポートやキーを確認したいなら、続けて [アプリ環境変数](../../installation/env.md) を見てください
