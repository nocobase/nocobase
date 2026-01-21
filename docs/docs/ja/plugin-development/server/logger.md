:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ロガー

NocoBase のロギング機能は、<a href="https://github.com/winstonjs/winston" target="_blank">Winston</a> をベースに構築されています。デフォルトでは、NocoBase はログを API リクエストログ、システム実行ログ、SQL 実行ログの3種類に分類します。このうち、API リクエストログと SQL 実行ログはアプリケーション内部で出力されますが、プラグイン開発者は通常、プラグイン関連のシステム実行ログのみを出力すれば十分です。

このドキュメントでは、プラグイン開発時にログを作成し、出力する方法について説明します。

## デフォルトのログ出力方法

NocoBase は、システム実行ログを出力するためのメソッドを提供しています。これらのログは、指定されたフィールドに従って整形され、指定されたファイルに出力されます。

```ts
// デフォルトの出力方法
app.log.info("message");

// ミドルウェアでの使用例
async function (ctx, next) {
  ctx.log.info("message");
}

// プラグインでの使用例
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

上記のすべてのメソッドは、以下の使い方に従います。

最初の引数はログメッセージ、2番目の引数はオプションのメタデータオブジェクトで、任意のキーと値のペアを指定できます。このオブジェクト内で、`module`、`submodule`、`method` は個別のフィールドとして抽出され、残りのフィールドは `meta` フィールドに格納されます。

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## 他のファイルへの出力

システムのデフォルト出力方法はそのまま利用しつつ、デフォルトのファイルには出力したくない場合、`createSystemLogger` を使ってカスタムのシステムロガーインスタンスを作成できます。

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // error レベルのログを 'xxx_error.log' に個別に分離して出力するかどうか
});
```

## カスタムロガー

システムが提供する出力方法ではなく、Winston のネイティブなメソッドを使いたい場合は、以下の方法でログを作成できます。

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` は、元の `winston.LoggerOptions` を拡張したものです。

- `transports` - `'console' | 'file' | 'dailyRotateFile'` のいずれかを使って、プリセットの出力方式を適用できます。
- `format` - `'logfmt' | 'json' | 'delimiter'` のいずれかを使って、プリセットの出力フォーマットを適用できます。

### `app.createLogger`

複数のアプリケーションを使用するシナリオでは、カスタムの出力ディレクトリやファイルを設定し、現在のアプリケーション名を持つディレクトリに出力したい場合があります。

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // /storage/logs/main/custom.log に出力されます
});
```

### `plugin.createLogger`

使用するシナリオと使い方は `app.createLogger` と同じです。

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // /storage/logs/main/custom-plugin/YYYY-MM-DD.log に出力されます
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```