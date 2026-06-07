---
title: '本番環境の Reverse Proxy'
description: 'CLI 管理の NocoBase env 向けに、nb env proxy nginx と nb env proxy caddy で reverse proxy 設定を生成します。'
keywords: 'NocoBase,nb env proxy nginx,nb env proxy caddy,reverse proxy,Nginx,Caddy,production'
---

# 本番環境の Reverse Proxy

NocoBase CLI では、本番アプリの前段に reverse proxy を置くときの推奨エントリが 2 つあります。

- `nb env proxy nginx`
- `nb env proxy caddy`

`nb env proxy` は今はこの 2 つのサブコマンドのヘルプを案内するトピックです。アプリがすでに CLI env として保存されていて、env の種類が `local` または `docker` であれば、CLI に設定を生成させるのが通常いちばん簡単です。そうすると、WebSocket の扱い、サブパス、SPA のフォールバックページ、その後の更新のような細かい部分も CLI が同期してくれます。あなたが決めるのは、入口レイヤーで Nginx を使い続けるか、Caddy に切り替えるかだけです。

アプリが CLI 管理ではない場合や、proxy の完全な設定を自分で手書きしたい場合は、provider ページにある手書き設定のセクションへそのまま進んでください。

## まずこの進め方が合うか確認する

- アプリがすでに `http://127.0.0.1:13000` のような内部アドレスで到達できる
- アプリがすでに CLI env として保存されていて、env の種類が `local` または `docker` である
- その env に `appPort` が保存されている

コマンドが `appPort` がないと表示した場合は、先に [`nb env update`](../../../api/cli/env/update.md) を実行して保存してください。

そのあとで `app-port` や `app-public-path` のように proxy 出力へ影響する設定を変更した場合は、対応する proxy サブコマンドをもう一度実行する必要があります。

## 標準ルート: まずは CLI に設定を生成させる

どの入口 provider を使い続けたいかがすでに決まっているなら、そのサブコマンドへ直接進めます。

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

すでに current env へ切り替えているなら、`--env` は省略できます。

```bash
nb env proxy nginx --host demo.example.com
```

ポイントは次のとおりです。

- すでに Nginx でサイト、キャッシュ、アクセス制御、証明書を管理しているなら、[`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) から始めてください
- HTTPS をすばやく有効にしたくて、TLS の細かい管理をあまり自分で持ちたくないなら、[`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) から始めてください
- `--port` は proxy の入口ポートであり、アプリの `appPort` ではありません

CLI に共有設定を provider のメイン設定へ接続させ、検証後に再読み込みまでさせたい場合は、次のように追加します。

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

完全なコマンドリファレンスは [`nb env proxy`](../../../api/cli/env/proxy/index.md) を見てください。

## CLI が同期してくれるもの

CLI は単なる proxy スニペットだけではなく、provider ごとの補助ファイルも管理します。出力の形は provider によって変わります。

- Nginx では `app.conf`, `public/index-v1.html`, `public/index-v2.html`, 共有の `nocobase.conf`, 共有の `snippets/` を管理します
- Caddy では `generated.caddy`, `app.caddy`, 共有の `nocobase.caddy` を管理します

:::warning 注意

サイト固有の設定を追加したい場合は `app.conf` または `app.caddy` を編集してください。CLI が管理する補助ファイルは、次にコマンドを実行したときに上書きされるため、手動では編集しないでください。

:::

## 最初にどのページを開くべきか

| やりたいこと | 開くページ |
| --- | --- |
| サイト、証明書、キャッシュ、アクセス制御で引き続き Nginx を使いたい | [Nginx](./nginx.md) |
| HTTPS をすばやく有効にして、証明書や TLS の管理を減らしたい | [Caddy](./caddy.md) |
| コマンドツリーを確認してから provider を選びたい | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| Nginx サブコマンドのオプション、出力ファイル、例を先に見たい | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| Caddy サブコマンドのオプション、出力ファイル、例を先に見たい | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| `app-port` や `app-public-path` など、proxy 出力へ影響する env 設定を調整したい | [`nb env update`](../../../api/cli/env/update.md) |
| まずアプリを CLI 管理 env としてインストールしたい | [CLI でインストール（推奨）](../../installation/cli.md) |

## CLI 生成ルートがあまり向かないケース

次のようなケースは、provider ページにある手書き設定のセクションのほうが合っています。

- アプリが CLI 管理ではない
- env がリモート API 接続だけか、SSH env である
- 完全な Nginx 設定や完全な `Caddyfile` を自分で管理したい

それでも、アプリがすでに CLI env として保存されていて、現在のマシンから runtime に到達できるなら、まずはこれらのコマンドから始めるのが標準のおすすめです。あとからドメインを変える場合や、サイトごとの調整、再生成もかなり扱いやすくなります。

## 関連リンク

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [アプリ環境変数](../../installation/env.md)
- [CLI でインストール（推奨）](../../installation/cli.md)
