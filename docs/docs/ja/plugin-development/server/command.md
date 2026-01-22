:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# コマンド

NocoBase では、コマンドはアプリケーションやプラグインに関連する操作をコマンドラインで実行するために使われます。例えば、システムタスクの実行、マイグレーションや同期操作、設定の初期化、あるいは実行中のアプリケーションインスタンスとの連携などに利用できます。開発者はプラグイン用にカスタムコマンドを定義し、`app` オブジェクトを通じて登録できます。これらのコマンドはCLIで `nocobase <command>` の形式で実行します。

## コマンドの種類

NocoBase では、コマンドの登録方法は以下の2種類に分けられます。

| タイプ | 登録方法 | プラグインの有効化が必要か | 典型的なシナリオ |
|------|------------|------------------|-----------|
| 動的コマンド | `app.command()` | ✅ 必要 | プラグインのビジネス関連コマンド |
| 静的コマンド | `Application.registerStaticCommand()` | ❌ 不要 | インストール、初期化、メンテナンスコマンド |

## 動的コマンド

`app.command()` を使ってプラグインコマンドを定義します。これらのコマンドは、プラグインが有効化されてから実行できます。コマンドファイルはプラグインディレクトリ内の `src/server/commands/*.ts` に配置してください。

### 示例

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

### 説明

- `app.command('echo')`：`echo` という名前のコマンドを定義します。
- `.option('-v, --version')`：コマンドにオプションを追加します。
- `.action()`：コマンドの実行ロジックを定義します。
- `app.version.get()`：現在のアプリケーションバージョンを取得します。

### コマンドの実行

```bash
nocobase echo
nocobase echo -v
```

## 静的コマンド

`Application.registerStaticCommand()` を使って登録します。静的コマンドはプラグインを有効化しなくても実行でき、インストール、初期化、マイグレーション、デバッグなどのタスクに適しています。プラグインクラスの `staticImport()` メソッド内で登録します。

### 示例

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

### コマンドの実行

```bash
nocobase echo
nocobase echo --version
```

### 説明

- `Application.registerStaticCommand()` は、アプリケーションがインスタンス化される前にコマンドを登録します。
- 静的コマンドは通常、アプリケーションやプラグインの状態に依存しないグローバルなタスクを実行するために使われます。

## コマンドAPI

コマンドオブジェクトは、コマンドの実行コンテキストを制御するための3つのオプションのヘルパーメソッドを提供します。

| メソッド | 役割 | 例 |
|------|------|------|
| `ipc()` | 実行中のアプリケーションインスタンスと通信（IPC経由） | `app.command('reload').ipc().action()` |
| `auth()` | データベース設定が正しいか検証 | `app.command('seed').auth().action()` |
| `preload()` | アプリケーション設定をプリロード（`app.load()`を実行） | `app.command('sync').preload().action()` |

### 設定の説明

- **`ipc()`**  
  デフォルトでは、コマンドは新しいアプリケーションインスタンスで実行されます。  
  `ipc()` を有効にすると、コマンドはプロセス間通信（IPC）を通じて現在実行中のアプリケーションインスタンスと連携します。これは、キャッシュの更新や通知の送信といったリアルタイム操作コマンドに適しています。

- **`auth()`**  
  コマンド実行前にデータベース設定が利用可能かチェックします。  
  データベース設定が誤っているか、接続に失敗した場合、コマンドはそれ以上実行されません。データベースへの書き込みや読み取りを伴うタスクでよく使われます。

- **`preload()`**  
  コマンド実行前にアプリケーション設定をプリロードします。これは `app.load()` の実行に相当します。  
  設定やプラグインのコンテキストに依存するコマンドに適しています。

その他のAPIメソッドについては、[AppCommand](/api/server/app-command) を参照してください。

## よくある例

### デフォルトデータの初期化

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

### 実行中のインスタンスにキャッシュを再ロードさせる（IPCモード）

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

### インストールコマンドの静的登録

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```