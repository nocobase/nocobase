:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/logger)をご参照ください。
:::

# ctx.logger

[pino](https://github.com/pinojs/pino) に基づくログのラッパーで、高性能な構造化 JSON ログを提供します。ログの収集と分析を容易にするため、`console` の代わりに `ctx.logger` を使用することをお勧めします。

## 適用シーン

すべての RunJS シナリオで `ctx.logger` を使用でき、デバッグ、エラー追跡、パフォーマンス分析などに役立ちます。

## 型定義

```ts
logger: pino.Logger;
```

`ctx.logger` は `engine.logger.child({ module: 'flow-engine' })` であり、`module` コンテキストを持つ pino の子ロガーです。

## ログレベル

pino は以下のレベルをサポートしています（高い順）：

| レベル | メソッド | 説明 |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | 致命的なエラー。通常、プロセスの終了を伴います。 |
| `error` | `ctx.logger.error()` | エラー。リクエストや操作の失敗を示します。 |
| `warn` | `ctx.logger.warn()` | 警告。潜在的なリスクや異常な状況を示します。 |
| `info` | `ctx.logger.info()` | 一般的な実行時の情報。 |
| `debug` | `ctx.logger.debug()` | デバッグ情報。開発時に使用します。 |
| `trace` | `ctx.logger.trace()` | 詳細なトレース。深い診断に使用します。 |

## 推奨される書き方

`level(msg, meta)` 形式を推奨します。メッセージを先に、オプションのメタデータオブジェクトを後に記述します。

```ts
ctx.logger.info('ブロックの読み込みが完了しました');
ctx.logger.info('操作に成功しました', { recordId: 456 });
ctx.logger.warn('パフォーマンス警告', { duration: 5000 });
ctx.logger.error('操作に失敗しました', { userId: 123, action: 'create' });
ctx.logger.error('リクエストに失敗しました', { err });
```

pino は `level(meta, msg)`（オブジェクトが先）や `level({ msg, ...meta })`（単一オブジェクト）もサポートしており、必要に応じて使用できます。

## 💡 例

### 基本的な使い方

```ts
ctx.logger.info('ブロックの読み込みが完了しました');
ctx.logger.warn('リクエストに失敗しました。キャッシュを使用します', { err });
ctx.logger.debug('保存中', { recordId: ctx.record?.id });
```

### child() を使用した子ロガーの作成

```ts
// 現在のロジック用にコンテキストを持つ子ロガーを作成する
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('ステップ 1 を実行中');
log.debug('ステップ 2 を実行中', { step: 2 });
```

### console との関係

構造化 JSON ログを取得するために、`ctx.logger` を直接使用することをお勧めします。`console` を使い慣れている場合は、以下のように対応させてください：`console.log` → `ctx.logger.info`、`console.error` → `ctx.logger.error`、`console.warn` → `ctx.logger.warn`。

## ログ形式

pino は構造化 JSON を出力します。各ログには以下が含まれます：

- `level`：ログレベル（数値）
- `time`：タイムスタンプ（ミリ秒）
- `msg`：ログメッセージ
- `module`：`flow-engine` で固定
- その他のカスタムフィールド（オブジェクト経由で渡されたもの）

## 注意事項

- ログは構造化 JSON であるため、収集、検索、分析が容易です。
- `child()` で作成された子ロガーでも、`level(msg, meta)` の書き方を推奨します。
- 一部の実行環境（ワークフローなど）では、異なるログ出力方法が使用される場合があります。

## 関連情報

- [pino](https://github.com/pinojs/pino) — 基盤となるログライブラリ