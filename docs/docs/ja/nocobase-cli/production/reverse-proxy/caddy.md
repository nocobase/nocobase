＃キャディー

すでにドメイン名を持っていて、できるだけ早く HTTPS を構成したい場合は、通常、`nb proxy caddy` が最も安心な入力方法です。

Caddy は、Nginx の証明書構成を自分で管理するのではなく、「最初にエントリー層を実行する」ためのデフォルトのショートカットのようなものです。

## Caddy を使用するのが適切なのはどのような場合ですか?

一般的に、次の場合はキャディが優先されます。

- すでにドメイン名を持っており、できるだけ早く HTTPS にアクセスしたい場合
- あまりにも多くの証明書と TLS の詳細を自分で管理したくない
- 必要なのはシンプルで安定した入口層だけです

すでに Nginx を使用してサーバー上の多くのサイトを管理している場合、または後でさらに大規模なキャッシュ、アクセス制御、およびカスタマイズ ルールを実行する必要がある場合は、引き続き [Nginx](./nginx.md) を確認する方がスムーズです。

## まず、次の 3 つのコマンドに従います。

最初に Caddy エントリ レイヤーを実行したいだけの場合は、デフォルトで次の 3 つのコマンドを覚えておくだけで十分です。

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Caddy がローカルにインストールされている場合は、最初のエントリを `nb proxy caddy use local` に変更するだけです。

ほとんどのシナリオでは、最初に `use`、次に `generate`、最後に `reload` を実行するだけで十分です。その他の詳細とその他のコマンドについては、次の章または CLI リファレンスを参照してください。

## ステップ 1: Caddy を自分で実行する方法を選択する

現在のマシンに Caddy がすでにインストールされている場合は、`use local` を使用してください。

Caddy の Docker バージョンを使用する場合は、`use docker` を使用します。

ここでの `local` / `docker` は **Caddy 自体の動作方法**を指します。

Docker バージョンの Caddy を使用する場合:

```bash
nb proxy caddy use docker
```

Caddy のローカル インストールを使用する場合:

```bash
nb proxy caddy use local
```

後で現在どのメソッドが選択されているかを忘れた場合は、次のコマンドを実行できます。

```bash
nb proxy caddy current
```

## ステップ 2: `generate` を実行する

`generate` は、指定された環境に従って Caddy 構成を生成するために使用されます。最も一般的な書き方は次のとおりです。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

エントリポートも指定したい場合は、それを一緒に記述することもできます。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

ここでのパラメータの意味は次のとおりです。

- `--env`: 構成を生成する CLI 環境を指定します
- `--host`: 外部アクセス用のドメイン名を指定します
- `--port`: プロキシエントリポートを指定します

キャディにとって、`--host` は特に重要です。正式な環境では、HTTPS アクセスがより自然になるように、デフォルトで解決されたドメイン名を現在のサーバーに渡すようにしてください。

env に `appPort` が欠落しているというコマンド プロンプトが表示された場合は、最初に次のコマンドを実行します。

```bash
nb env update test2 --app-port 56575
```

後でプロキシの結果に影響する `app-port` や `app-public-path` などの構成を変更する場合は、必ず `generate` を再実行してください。

## ステップ 3: `reload` を実行する

構成を生成した後、次を直接実行します。

```bash
nb proxy caddy reload
```

ほとんどのシナリオでは、このコマンドを直接使用します。まだ実行されていない場合、起動は最初に内部で処理されます。すでに実行されている場合は、最新の構成に従って再ロードされます。

## CLI はどのファイルを維持しますか?

`test2` を例にとると、Caddy 関連のコマンドは通常、次のファイルとディレクトリを維持します。

|パス |関数 |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | CLI によって生成される完全なサイト構成 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Caddy 一般エントリ ファイル。すべての環境の `app.caddy` のインポートを担当します。
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | v1 SPA フォールバック ページ |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | v2 SPA フォールバック ページ |
| `NB_CLI_ROOT/test2/storage/dist-client` |現在使用されているフロントエンド ビルド製品ディレクトリ |
| `NB_CLI_ROOT/test2/storage/uploads` |現在のアプリケーションのアップロード ディレクトリ |

で：

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` 以下は、CLI によって維持されるエージェント補助ファイルです。
- `NB_CLI_ROOT/test2/storage/...` 以下は、アプリケーション独自の静的リソースとアップロード ディレクトリです。
- `nocobase.caddy` はプロバイダー レベルのエントリ ファイルであり、通常は手動で変更する必要はありません。
- `app.caddy` は、特定の環境の完全な Caddy サイト構成です。 `generate` を再実行すると、全体が上書きされます。

:::警告メモ

追加のヘッダー、認証、速度制限、圧縮戦略など、Caddy のサイトレベルの構成を補いたい場合は、まず `app.caddy` に基づいて調整できます。ただし、その後 `generate` を再実行すると、このファイルが上書きされることに注意してください。

:::

## 手書き設定: CLI を使用しない場合の対処方法

アプリケーションが CLI でホストされていない場合、または完全な Caddy 構成を自分で明示的に保守したい場合は、手動で作成することもできます。

ただし、NocoBase の本番環境エントリは、単純な `reverse_proxy` だけではありません。API リクエストの転送に加えて、アップロードディレクトリ、フロントエンド静的リソース、ファイルアクセスルート `/files/`、`.well-known` ルーティング、WebSocket、SPA フォールバックページも処理する必要があります。

`test2` を例に挙げると、通常、Caddy に関連する主要なディレクトリには次のものが含まれます。

- SPA フォールバック ページ ディレクトリ: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- フロントエンド ビルド製品ディレクトリ: `NB_CLI_ROOT/test2/storage/dist-client`
- アップロード ディレクトリ: `NB_CLI_ROOT/test2/storage/uploads`

つまり、手書きの設定では通常、少なくとも次の種類のエントリをカバーする必要があります。

- `v`: `/v` を `/v/` にリダイレクトします
- `uploads`: アップロード ディレクトリを公開する
- `dist`: フロントエンド ビルド製品ディレクトリを公開します
- `oauth well-known`: OAuth 検出パスの処理
- `openid well-known`: OpenID 検出パスの処理
- `files`: `/files/` 配下のファイルアクセスリクエストをバックエンドアプリケーションへ転送します
- `api`: `/api/` リクエストをバックエンド アプリケーションに転送します
- `ws`: WebSocket リクエストをバックエンド アプリケーションに転送します。
- `spa v2`: `/v/` のフロントエンドのエントリとリターン ページを提供します
- `spa v1`: `/` のフロントエンド エントリとリターン ページを提供します。

したがって、完全な Caddy 構成は通常、次のような一般的な方法で記述するだけでは済みません。

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

`test2` のような CLI でホストされるアプリケーションの場合、実際のデプロイメントに近い構造は通常次のようになります。

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /files/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

ここでも重要なポイントが 2 つあります。

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` 以下は、CLI によって維持される SPA ロールバック ページのディレクトリです。
- `NB_CLI_ROOT/test2/storage/...` 以下は、独自のビルド製品ディレクトリとアップロード ディレクトリの使用方法です。

アプリケーションがサブパス デプロイメントを使用している場合、またはフロントエンド リソース、アップロード ディレクトリ、およびエントリ層が同じパス パースペクティブにない場合、手書きの構成はエラーが発生しやすくなります。このシナリオでは、通常は以下を実行することをお勧めします。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

次に、生成された結果に基づいて調整を行います。

CLI を使用してパスとルートを最初に実行できるようにする場合、通常、生成される構造は次のようになります。

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

で：

- `nocobase.caddy` は `import */app.caddy` を統合する責任があります
- `test2/app.caddy` は、この環境 `test2` の完全なサイト構成です。
- `public/index-v1.html` および `public/index-v2.html` は CLI で生成された SPA フォールバック ページです

通常、より賢明なアプローチは次のとおりです。

1. まず、CLI で Caddy 構成を生成します。
2. 生成された結果に基づいて、ルーティング構造と実際のパスを確認します。
3. 次に、ドメイン名、実行モード、マウント パスに従って手動で調整します。

通常、この方法では、構成を最初から手書きするよりも、`/files/`、WebSocket、静的リソース、アップロードディレクトリ、`.well-known` ルート、SPA フォールバックページに関連する詳細を見逃しにくくなります。

:::warning 注意

`/files/` は NocoBase の認証を通す必要があるアプリケーションルートです。静的ディレクトリとして処理したり、SPA フォールバックへ流したりしないでください。NocoBase バックエンドへ転送し、`handle_path /*` などのフロントエンドフォールバックルールより前に配置します。

`APP_PUBLIC_PATH=/nocobase/` を設定している場合は、`/nocobase/files/*` も転送してください。既存のファイル URL との互換性のため、ルートの `/files/*` ルールも残します。

:::

## 設定を確認してリロードする

Caddy 構成を作成するか手動で調整する場合は、変更を加えた後に最初に検証してからリロードします。

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy の管理に `systemd` を使用していない場合は、代わりに独自の起動メソッドとリロード メソッドを使用できます。

`nb proxy caddy` を通じてエントリー層を管理する場合、通常は以下を使用することをお勧めします。

```bash
nb proxy caddy reload
```

現在のドライバー、合計エントリー ファイル パス、ランタイム ルート ディレクトリ、コンテナーまたはローカル バイナリ情報を確認したい場合は、次のコマンドを実行できます。

```bash
nb proxy caddy info
```

実行中かどうかをすぐに確認したい場合は、次のコマンドを実行できます。

```bash
nb proxy caddy status
```

## 共通の指示

- `nb proxy caddy generate` は、`nb init` によってインストールされたアプリケーション用です
- サーバーに通常どおり解決できるドメイン名をすでに持っている場合は、多くの場合、Caddy が HTTPS を取得する最速の方法です。
- その後、プロキシの結果に影響する `app-port` や `app-public-path` などの構成を変更する場合は、必ず `generate` を再実行してください。

## 関連リンク

- [本番環境リバースプロキシ](./index.md)
- [Nginx](./nginx.md)
- [CLIを使用したインストール(推奨)](../../installation/cli.md)
- [`.env` によるアプリケーション構成](../../installation/env.md)
- [`nb proxy caddy` コマンドリファレンス](../../../api/cli/proxy/caddy/index.md)
