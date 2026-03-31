:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ロガー

## ロガーの作成

### `createLogger()`

カスタムロガーを作成します。

#### シグネチャ

- `createLogger(options: LoggerOptions)`

#### 型

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### 詳細

| プロパティ     | 説明         |
| :------------- | :----------- |
| `dirname`      | ログ出力ディレクトリ |
| `filename`     | ログファイル名   |
| `format`       | ログ形式     |
| `transports`   | ログ出力方式 |

### `createSystemLogger()`

規定の方法で出力されるシステム実行ログを作成します。[ログ - システムログ](#) を参照してください。

#### シグネチャ

- `createSystemLogger(options: SystemLoggerOptions)`

#### 型

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### 詳細

| プロパティ        | 説明                                     |
| :---------------- | :--------------------------------------- |
| `seperateError`   | `error` レベルのログを個別に（別のファイルなどに）出力するかどうか |

### `requestLogger()`

API リクエストとレスポンスのログを記録するミドルウェアです。

```ts
app.use(requestLogger(app.name));
```

#### シグネチャ

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### 型

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### 詳細

| プロパティ            | 型                              | 説明                                                                 | デフォルト値                                                                                                                                            |
| :------------------ | :-------------------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | リクエストコンテキストに基づいて、特定のログをスキップするかどうかを決定します。 | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | ログに出力するリクエスト情報のホワイトリストです。                   | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | ログに出力するレスポンス情報のホワイトリストです。                   | `['status']`                                                                                                                                            |

### app.createLogger()

#### 定義

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

`dirname` が相対パスの場合、ログファイルは現在のアプリケーション名と同じ名前のディレクトリに出力されます。

### plugin.createLogger()

`app.createLogger()` と同じように使用します。

#### 定義

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## ログ設定

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

現在システムに設定されているログレベルを取得します。

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

現在システムに設定されているログディレクトリを基に、ディレクトリパスを結合します。

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

現在システムに設定されているログ出力方式を取得します。

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

現在システムに設定されているログ形式を取得します。

## ログ出力

### Transports

あらかじめ定義された出力方式です。

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## 関連ドキュメント

- [開発ガイド - ロガー](/plugin-development/server/logger)
- [ロガー](/log-and-monitor/logger/index.md)