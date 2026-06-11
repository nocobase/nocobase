---
title: "Server Plugin サーバーサイドプラグイン"
description: "NocoBase サーバーサイドプラグイン：Plugin クラスの継承、afterAdd、beforeLoad、load、install ライフサイクル、リソースとイベントの登録。"
keywords: "Server Plugin,Plugin クラス,afterAdd,beforeLoad,load,install,サーバーサイドプラグイン,NocoBase"
---

# Plugin プラグイン

NocoBase では、**サーバーサイドプラグイン（Server Plugin）** はサーバーサイドの機能を拡張するための主要な方法です。プラグインディレクトリの `src/server/plugin.ts` で `@nocobase/server` が提供する `Plugin` 基底クラスを継承し、さまざまなライフサイクル段階でイベント、インターフェース、権限などのカスタムロジックを登録できます。

## プラグインクラス

基本的なプラグインクラスの構造は以下の通りです：

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## ライフサイクル

プラグインのライフサイクルメソッドは以下の順序で実行され、各メソッドには特定の実行タイミングと用途があります：

| ライフサイクルメソッド | 実行タイミング | 説明 |
|--------------|----------|------|
| **staticImport()** | プラグインのロード前 | クラスの静的メソッドで、アプリケーションやプラグインの状態に依存しない初期化フェーズで実行されます。プラグインインスタンスに依存しない初期化作業に使用します。 |
| **afterAdd()** | プラグインが PluginManager に追加された直後に実行 | この時点ではプラグインインスタンスは作成されていますが、すべてのプラグインの初期化が完了しているわけではありません。基本的な初期化作業を実行できます。 |
| **beforeLoad()** | すべてのプラグインの `load()` の前に実行 | この時点ですべての**有効化されたプラグインインスタンス**にアクセスできます。データベースモデルの登録、データベースイベントのリッスン、ミドルウェアの登録などの準備作業に適しています。 |
| **load()** | プラグインのロード時に実行 | すべてのプラグインの `beforeLoad()` が完了した後に `load()` が開始されます。リソース、API インターフェースなどのコアビジネスロジックの登録に適しています（例：`resourceManager` による[カスタム REST API](./resource-manager.md) の登録）。**注意：** `load()` 段階ではデータベースの同期がまだ完了していないため、データベースのクエリや書き込み操作は実行できません。データベース操作は `install()` またはリクエスト処理関数内で行ってください。 |
| **install()** | プラグインが初めて有効化された時に実行 | プラグインが最初に有効化されたときに 1 回だけ実行されます。通常、データベーステーブル構造の初期化、初期データの挿入などのインストールロジックに使用します。`install()` は初回有効化時にのみ実行されます。後続のバージョンでテーブル構造の変更やデータ移行が必要な場合は、[Migration アップグレードスクリプト](./migration.md)を使用してください。 |
| **afterEnable()** | プラグインが有効化された後に実行 | プラグインが有効化されるたびに実行されます。定時タスクの開始、接続の確立などに使用できます。 |
| **afterDisable()** | プラグインが無効化された後に実行 | リソースのクリーンアップ、タスクの停止、接続のクローズなどに使用できます。 |
| **remove()** | プラグインが削除された時に実行 | アンインストールロジックの記述に使用します（例：データベーステーブルの削除、ファイルのクリーンアップなど）。 |
| **handleSyncMessage(message)** | マルチノードデプロイメント時のメッセージ同期 | アプリケーションがマルチノードモードで実行されている場合に、他のノードから同期されたメッセージを処理するために使用します。 |

### 実行順序の説明

ライフサイクルメソッドの典型的な実行フローは以下の通りです：

1. **静的初期化フェーズ**：`staticImport()`
2. **アプリケーション起動フェーズ**：`afterAdd()` → `beforeLoad()` → `load()`
3. **プラグイン初回有効化フェーズ**：`afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **プラグイン再有効化フェーズ**：`afterAdd()` → `beforeLoad()` → `load()`
5. **プラグイン無効化フェーズ**：プラグイン無効化時に `afterDisable()` が実行されます
6. **プラグイン削除フェーズ**：プラグイン削除時に `remove()` が実行されます

## app と関連メンバー

プラグイン開発では、`this.app` を通じてアプリケーションインスタンスが提供するさまざまな API にアクセスできます。これはプラグインの機能拡張のコア入口です。`app` オブジェクトにはシステムのさまざまな機能モジュールが含まれており、プラグインのライフサイクルメソッド内でこれらを使用できます。

### app メンバーリスト

| メンバー名 | 型/モジュール | 主な用途 |
|-----------|------------|-----------|
| **logger** | `Logger` | システムログの記録。info、warn、error、debug などのレベルをサポートします。詳細は [Logger ログ](./logger.md) を参照してください。 |
| **db** | `Database` | ORM 層の操作、モデル登録、イベントリッスン、トランザクション制御など。詳細は [Database データベース](./database.md) を参照してください。 |
| **resourceManager** | `ResourceManager` | REST API リソースと操作ハンドラーの登録・管理。詳細は [ResourceManager リソース管理](./resource-manager.md) を参照してください。 |
| **acl** | `ACL` | 権限、ロール、リソースアクセス戦略の定義。詳細は [ACL 権限制御](./acl.md) を参照してください。 |
| **cacheManager** | `CacheManager` | システムレベルのキャッシュ管理。Redis、メモリキャッシュなど複数のバックエンドをサポートします。詳細は [Cache キャッシュ](./cache.md) を参照してください。 |
| **cronJobManager** | `CronJobManager` | 定時タスクの登録と管理。Cron 式をサポートします。詳細は [CronJobManager 定時タスク](./cron-job-manager.md) を参照してください。 |
| **i18n** | `I18n` | 多言語翻訳とローカライゼーション。詳細は [I18n 国際化](./i18n.md) を参照してください。 |
| **cli** | `CLI` | カスタムコマンドの登録。NocoBase CLI を拡張します。詳細は [Command コマンドライン](./command.md) を参照してください。 |
| **dataSourceManager** | `DataSourceManager` | 複数のデータソースインスタンスとその接続の管理。詳細は [DataSourceManager データソース管理](./data-source-manager.md) を参照してください。 |
| **pm** | `PluginManager` | プラグインの動的なロード、有効化、無効化、削除、およびプラグイン間の依存関係の管理。 |

:::tip 提示

各モジュールの詳細な使用方法については、対応するドキュメントの章を参照してください。

:::

## 関連リンク

- [サーバーサイド開発の概要](./index.md) — サーバーサイドの各モジュールの総覧とナビゲーション
- [Collections データテーブル](./collections.md) — コードによるデータテーブル構造の定義と拡張
- [Database データベース](./database.md) — CRUD、Repository、トランザクションとデータベースイベント
- [Migration データ移行](./migration.md) — プラグインアップグレード時のデータ移行スクリプト
- [Event イベント](./event.md) — アプリケーションレベルおよびデータベースレベルのイベントリッスンと処理
- [ResourceManager リソース管理](./resource-manager.md) — カスタム REST API と操作の登録
- [最初のプラグインを作成する](../write-your-first-plugin.md) — ゼロから完全なプラグインを作成
- [Logger ログ](./logger.md) — システムログの記録
- [ACL 権限制御](./acl.md) — 権限とアクセス戦略の定義
- [Cache キャッシュ](./cache.md) — システムレベルのキャッシュ管理
- [CronJobManager 定時タスク](./cron-job-manager.md) — 定時タスクの登録と管理
- [I18n 国際化](./i18n.md) — 多言語翻訳
- [Command コマンドライン](./command.md) — カスタム CLI コマンドの登録
- [DataSourceManager データソース管理](./data-source-manager.md) — 複数データソースの管理
