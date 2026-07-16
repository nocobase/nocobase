#Nginx

Nginx を使用してサーバー上のサイトを管理した場合、または後で証明書、キャッシュ、およびアクセス制御を処理する必要がある場合、`nb proxy nginx` がデフォルトの推奨パスです。

できるだけ早く HTTPS を設定したいだけで、あまり多くのプロキシの詳細を自分で管理したくない場合は、[Caddy](./caddy.md) の方が安心です。ただし、Nginx を使用している限り、このドキュメントがデフォルトのパスになります。

## Nginx を使用するのがより適しているのはどのような場合ですか?

一般的に、次の状況では Nginx の使用を継続することが優先されます。

- Nginx を使用してサーバー上の複数のサイトを管理している。
- 証明書、キャッシュ、アクセス制御、またはその他のカスタム ルールを後で自分で管理する必要があります。
- エントリー層では既存のNginxの運用保守方式を継続して利用したい

HTTPS をできるだけ早く通過させることだけが目標であり、あまり多くの TLS の詳細を自分で管理したくない場合は、[Caddy](./caddy.md) の方が安心です。

## まず、次の 3 つのコマンドに従います。

最初に Nginx エントリー層を実行したいだけの場合は、デフォルトで次の 3 つのコマンドを覚えておくだけで十分です。

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Nginx がローカルにインストールされている場合は、最初のエントリを `nb proxy nginx use local` に変更するだけです。

ほとんどのシナリオでは、最初に `use`、次に `generate`、最後に `reload` を実行するだけで十分です。その他の詳細とその他のコマンドについては、次の章または CLI リファレンスを参照してください。

## ステップ 1: まず、Nginx を自分で実行する方法を選択します

現在のマシンに Nginx がすでにインストールされている場合は、`use local` を使用してください。

Nginx の Docker バージョンを使用する場合は、`use docker` を使用します。

ここでの `local` / `docker` は、**Nginx 自体**の実行モードを指します。

Docker バージョンの Nginx を使用する:

```bash
nb proxy nginx use docker
```

ローカルにインストールされた Nginx を使用する:

```bash
nb proxy nginx use local
```

後で現在どのメソッドが選択されているかを忘れた場合は、次のコマンドを実行できます。

```bash
nb proxy nginx current
```

## ステップ 2: `generate` を実行する

`generate` は、指定された環境に従って Nginx エントリ構成を生成するために使用されます。最も一般的な書き方は次のとおりです。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

エントリポートも指定したい場合は、それを一緒に記述することもできます。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

ここでのパラメータの意味は次のとおりです。

- `--env`: 構成を生成する CLI 環境を指定します
- `--host`: 外部アクセス用のドメイン名を指定します
- `--port`: NocoBase アプリケーション自体の `appPort` ではなく、プロキシ エントリ ポートを指定します。

アップストリーム アプリケーション ポートは、この環境に保存された `appPort` から取得されます。 env に `appPort` が欠落しているというコマンド プロンプトが表示されたら、次のコマンドを実行します。

```bash
nb env update test2 --app-port 56575
```

後でプロキシの結果に影響する `app-port` や `app-public-path` などの構成を変更する場合は、必ず `generate` を再実行してください。

## ステップ 3: `reload` を実行する

構成を生成した後、次を直接実行します。

```bash
nb proxy nginx reload
```

ほとんどのシナリオでは、このコマンドを直接使用します。まだ実行されていない場合、起動は最初に内部で処理されます。すでに実行されている場合は、最新の構成に従って再ロードされます。

## CLI はどのファイルを維持しますか?

`test2` を例に挙げると、Nginx 関連のコマンドは通常、次のファイルとディレクトリを維持します。

|パス |関数 |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Nginx 共有スニペット ディレクトリ |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` |編集可能なサイト エントリの構成 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | v1 SPA フォールバック ページ |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | v2 SPA フォールバック ページ |
| `NB_CLI_ROOT/test2/storage/dist-client` |現在使用されているフロントエンド ビルド製品ディレクトリ |
| `NB_CLI_ROOT/test2/storage/uploads` |現在のアプリケーションのアップロード ディレクトリ |

で：

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` 以下は、CLI によって維持されるエージェント補助ファイルです。
- `NB_CLI_ROOT/test2/storage/...` 以下は、アプリケーション独自の静的リソースとアップロード ディレクトリです。
- `app.conf` は変更できますが、NocoBase 管理ブロックは保持する必要があります
- `index-v1.html` および `index-v2.html` は、現在の環境サブパス、アクティブなクライアントのバージョン、および `CDN_BASE_URL` に従ってリソース アドレスを自動的に書き換えます。

:::警告メモ

電流制限、追加ヘッダー、アクセス制御などのサイトレベルの Nginx 構成を追加する場合は、`app.conf` を変更するだけです。 CLI で管理される補助ファイルは、後続の再構築時に同期して更新されます。

:::

## 手書き設定: CLI を使用しない場合の対処方法

アプリケーションが CLI でホストされていない場合、または完全な Nginx 構成を自分で明示的に保守したい場合は、手動で記述することもできます。

ただし、NocoBase の本番環境リバースプロキシは、単純な `proxy_pass` だけではありません。API リクエストの転送に加えて、アップロードディレクトリ、フロントエンド静的リソース、ファイルアクセスルート `/files/`、WebSocket、`.well-known` ルート、SPA フォールバックページも処理する必要があります。

`test2` を例にとると、Nginx に関連する主要なファイルとディレクトリには通常、次のものが含まれます。

- Nginx スニペット: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- 編集可能なエントリ構成: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA フォールバック ページ (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA フォールバック ページ (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- フロントエンド ビルド製品ディレクトリ: `NB_CLI_ROOT/test2/storage/dist-client`
- アップロード ディレクトリ: `NB_CLI_ROOT/test2/storage/uploads`

つまり、手書きの設定では通常、少なくとも次の種類のエントリをカバーする必要があります。

- `uploads`: `alias` を通じてアップロード ディレクトリを公開します
- `dist`: `alias` を通じてフロントエンド ビルド製品ディレクトリを公開します。
- `well-known`: OAuth / OpenID 関連の検出パスを処理します。
- `files`: `/files/` 配下のファイルアクセスリクエストをバックエンドアプリケーションへ転送します
- `api`: `/api/` リクエストをバックエンド アプリケーションに転送します
- `ws`: WebSocket リクエストをバックエンド アプリケーションに転送します。
- `spa`: `/` および `/v/` のフロントエンド エントリと `try_files` フォールバックを提供します

したがって、完全な Nginx 構成は、通常、次の一般的なリバース プロキシの作成方法だけではありません。

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

`test2` のような CLI でホストされるアプリケーションの場合、実際のデプロイメントに近い構造は通常次のようになります。

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

ここで重要な点が 2 つあります。

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` 以下は、CLI によって維持されるエージェント補助ファイルです。
- `NB_CLI_ROOT/test2/storage/...` 以下は、独自の製品ディレクトリを使用し、ディレクトリをアップロードする方法です。

アプリケーションがサブパス デプロイメントを使用している場合、またはフロントエンド リソース、アップロード ディレクトリ、およびリバース プロキシが同じパス パースペクティブにない場合、手書きの構成はエラーが発生しやすくなります。このシナリオでは、通常は以下を実行することをお勧めします。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

次に、生成された結果に基づいて調整を行います。

通常、より賢明なアプローチは次のとおりです。

1. まず、CLI で Nginx 構成を生成します。
2. 生成された結果に基づいて、ルーティング構造と実際のパスを確認します。
3. 次に、ドメイン名、実行モード、マウント パスに従って手動で調整します。

通常、この方法では、構成を最初から手書きするよりも、`/files/`、WebSocket、静的リソース、アップロードディレクトリ、SPA フォールバックページに関連する詳細を見逃しにくくなります。

:::warning 注意

`/files/` は NocoBase の認証を通す必要があるアプリケーションルートです。静的ディレクトリとして処理したり、SPA フォールバックへ流したりしないでください。NocoBase バックエンドへ転送し、`location /` などのフロントエンドフォールバックルールより前に配置します。

`APP_PUBLIC_PATH=/nocobase/` を設定している場合は、`/nocobase/files/` も転送してください。既存のファイル URL との互換性のため、ルートの `/files/` ルールも残します。

:::

## HTTPS の処理方法

Nginx を引き続き使用することにした場合は、Nginx で HTTPS を引き続き構成することもできます。一般的な方法は、`listen 80` を `80/443` デュアル エントリに拡張し、証明書パスと TLS 構成を追加することです。

ただし、できるだけ早く HTTPS を利用できるようにしたいだけで、証明書の申請や更新を自分で処理したくない場合は、[Caddy](./caddy.md) を直接使用した方が安心です。

## 共通の指示

- `nb proxy nginx generate` は、`nb init` によってインストールされたアプリケーション用です
- その後、プロキシの結果に影響する `app-port` や `app-public-path` などの構成を変更する場合は、必ず `generate` を再実行してください。

## 関連リンク

- [本番環境リバースプロキシ](./index.md)
- [キャディ](./caddy.md)
- [CLIを使用したインストール(推奨)](../../installation/cli.md)
- [`.env` によるアプリケーション構成](../../installation/env.md)
- [`nb proxy nginx` コマンド リファレンス](../../../api/cli/proxy/nginx/index.md)
