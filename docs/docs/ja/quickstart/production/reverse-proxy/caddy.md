# Caddy

すでにドメインがあり、HTTPS もできるだけ早くまとめて有効にしたいなら、Caddy のほうが通常は手間が少なくて済みます。ほとんどのケースでは、短い `Caddyfile` ひとつで十分です。

## 最小構成

`/etc/caddy/Caddyfile` を編集します。

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

ここでのポイントは次のとおりです。

- `your-domain.com` は自分のドメインに置き換えます
- `127.0.0.1:13000` は NocoBase が実際に待ち受けているアドレスに置き換えます

ドメインがすでにこのサーバーを正しく向いていれば、Caddy が通常 HTTPS 証明書の取得と更新を自動で処理します。

## 設定を検証して再読み込みする

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy を `systemd` で管理していない場合は、自分の運用方法に合わせた起動・再読み込み手順を使ってください。

## まずは HTTP だけで試したい場合

まだドメインがないなら、動作確認のために先にポートをひとつ待ち受けることもできます。

```shell
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

ただし本番環境では、できるだけ早くドメイン付きの設定へ切り替えるのがおすすめです。

## Caddy が向いている場面

- HTTPS をより早く有効にしたい
- reverse proxy の細かい設定をあまり自分で持ちたくない
- 今のところ必要なのはシンプルで安定した入口レイヤーだけ

## 次に見るページ

- アプリがまだ起動していないなら、まず [Docker Compose でインストール](../../installation/docker-compose.md) を見てください
- ポートやキーを確認したいなら、続けて [アプリ環境変数](../../installation/env.md) を見てください
