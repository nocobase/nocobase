:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# イベント

NocoBaseのサーバーは、アプリケーションのライフサイクル、プラグインのライフサイクル、データベース操作など、様々な場面で関連するイベントをトリガーします。プラグイン開発者は、これらのイベントをリッスンすることで、拡張ロジックの実装、自動化された操作、またはカスタムな振る舞いを実現できます。

NocoBaseのイベントシステムは、主に以下の2つのレベルに分かれています。

-   **`app.on()` - アプリケーションレベルイベント**：アプリケーションの起動、インストール、プラグインの有効化など、アプリケーションのライフサイクルイベントをリッスンします。
-   **`db.on()` - データベースレベルイベント**：レコードの作成、更新、削除など、データモデルレベルの操作イベントをリッスンします。

どちらもNode.jsの`EventEmitter`を継承しており、標準の`.on()`、`.off()`、`.emit()`インターフェースをサポートしています。NocoBaseはさらに`emitAsync`もサポートしており、これはイベントを非同期でトリガーし、すべてのリスナーが実行を完了するまで待機するために使用されます。

## イベントリスナーの登録場所

イベントリスナーは通常、プラグインの`beforeLoad()`メソッド内で登録する必要があります。これにより、プラグインのロード段階でイベントが準備され、後続のロジックが正しく応答できるようになります。

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // アプリケーションイベントをリッスン
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase が起動しました');
    });

    // データベースイベントをリッスン
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`新しい投稿: ${model.get('title')}`);
      }
    });
  }
}
```

## アプリケーションイベントをリッスンする `app.on()`

アプリケーションイベントは、NocoBaseアプリケーションおよびプラグインのライフサイクル変更を捕捉するために使用されます。初期化ロジック、リソース登録、プラグインの依存関係チェックなどに適しています。

### よくあるイベントタイプ

| イベント名 | トリガータイミング | 一般的な用途 |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | アプリケーションのロード前 / 後 | リソースの登録、設定の初期化 |
| `beforeStart` / `afterStart` | サービスの起動前 / 後 | タスクの開始、起動ログの出力 |
| `beforeInstall` / `afterInstall` | アプリケーションのインストール前 / 後 | データの初期化、テンプレートのインポート |
| `beforeStop` / `afterStop` | サービスの停止前 / 後 | リソースのクリーンアップ、状態の保存 |
| `beforeDestroy` / `afterDestroy` | アプリケーションの破棄前 / 後 | キャッシュの削除、接続の切断 |
| `beforeLoadPlugin` / `afterLoadPlugin` | プラグインのロード前 / 後 | プラグイン設定の変更、機能の拡張 |
| `beforeEnablePlugin` / `afterEnablePlugin` | プラグインの有効化前 / 後 | 依存関係のチェック、プラグインロジックの初期化 |
| `beforeDisablePlugin` / `afterDisablePlugin` | プラグインの無効化前 / 後 | プラグインリソースのクリーンアップ |
| `afterUpgrade` | アプリケーションのアップグレード完了後 | データ移行の実行、互換性の修正 |

例：アプリケーション起動イベントをリッスンする

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase サービスが起動しました！');
});
```

例：プラグインロードイベントをリッスンする

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`プラグイン ${plugin.name} がロードされました`);
});
```

## データベースイベントをリッスンする `db.on()`

データベースイベントは、モデル層での様々なデータ変更を捕捉できます。監査、同期、自動入力などの操作に適しています。

### よくあるイベントタイプ

| イベント名 | トリガータイミング |
|-----------|------------|
| `beforeSync` / `afterSync` | データベース構造の同期前 / 後 |
| `beforeValidate` / `afterValidate` | データ検証前 / 後 |
| `beforeCreate` / `afterCreate` | レコードの作成前 / 後 |
| `beforeUpdate` / `afterUpdate` | レコードの更新前 / 後 |
| `beforeSave` / `afterSave` | 保存前 / 後（作成と更新を含む） |
| `beforeDestroy` / `afterDestroy` | レコードの削除前 / 後 |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | 関連データを含む操作後 |
| `beforeDefineCollection` / `afterDefineCollection` | コレクションの定義前 / 後 |
| `beforeRemoveCollection` / `afterRemoveCollection` | コレクションの削除前 / 後 |

例：データ作成後のイベントをリッスンする

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('データが作成されました！');
});
```

例：データ更新前のイベントをリッスンする

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('データが更新されようとしています！');
});
```