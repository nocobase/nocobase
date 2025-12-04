:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Migration（マイグレーション）アップグレードスクリプト

NocoBaseのプラグイン開発やアップデートを行う際、プラグインのデータベース構造や設定に互換性のない変更が生じることがあります。このような変更があってもスムーズにアップグレードできるよう、NocoBaseは**Migration（マイグレーション）**の仕組みを提供しており、マイグレーションファイルを記述することでこれらの変更を処理します。この記事では、Migrationの利用方法と開発フローについて体系的に解説します。

## Migration（マイグレーション）の概念

Migrationは、プラグインのアップグレード時に自動的に実行されるスクリプトで、主に以下の問題を解決するために利用されます。

- データテーブルの構造調整（フィールドの追加、フィールドタイプの変更など）
- データ移行（フィールド値の一括更新など）
- プラグインの設定や内部ロジックの更新

Migrationの実行タイミングは、以下の3つのタイプに分類されます。

| タイプ | 実行タイミング | 実行シナリオ |
|------|----------|----------|
| `beforeLoad` | すべてのプラグイン設定がロードされる前 | |
| `afterSync`  | コレクション設定がデータベースと同期された後（テーブル構造がすでに変更された状態） | |
| `afterLoad`  | すべてのプラグイン設定がロードされた後 | |

## Migration（マイグレーション）ファイルの作成

Migrationファイルは、プラグインディレクトリ内の `src/server/migrations/*.ts` に配置する必要があります。NocoBaseは、`create-migration` コマンドを提供しており、このコマンドを使ってMigrationファイルを素早く生成できます。

```bash
yarn nocobase create-migration [options] <name>
```

オプションパラメーター

| パラメーター | 説明 |
|------|----------|
| `--pkg <pkg>` | プラグインのパッケージ名を指定します |
| `--on [on]`  | 実行タイミングを指定します（`beforeLoad`、`afterSync`、`afterLoad` から選択可能） |

例

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

生成されるMigrationファイルのパスは以下の通りです。

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

ファイルの初期内容：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // ここにアップグレードロジックを記述します
  }
}
```

> ⚠️ `appVersion` は、アップグレードの対象となるバージョンを識別するために使用されます。指定されたバージョンよりも古い環境でこのMigrationが実行されます。

## Migration（マイグレーション）の記述

Migrationファイル内では、`this` を通じて以下のよく使われるプロパティやAPIにアクセスできます。これらを利用することで、データベース、プラグイン、アプリケーションインスタンスを簡単に操作できます。

よく使われるプロパティ

- **`this.app`**  
  現在のNocoBaseアプリケーションインスタンスです。グローバルサービス、プラグイン、または設定へのアクセスに利用できます。  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  データベースサービスインスタンスです。モデル（コレクション）を操作するためのインターフェースを提供します。  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  現在のプラグインインスタンスです。プラグインのカスタムメソッドへのアクセスに利用できます。  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelizeインスタンスです。生のSQLやトランザクション操作を直接実行できます。  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  SequelizeのQueryInterfaceです。フィールドの追加やテーブルの削除など、テーブル構造の変更によく利用されます。  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Migrationの記述例

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // queryInterface を使用してフィールドを追加します
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // db を使用してデータモデルにアクセスします
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // プラグインのカスタムメソッドを実行します
    await this.plugin.customMethod();
  }
}
```

上記で挙げた一般的なプロパティの他にも、Migrationは豊富なAPIを提供しています。詳細なドキュメントについては、[Migration API](/api/server/migration) をご参照ください。

## Migration（マイグレーション）のトリガー

Migrationの実行は、`nocobase upgrade` コマンドによってトリガーされます。

```bash
$ yarn nocobase upgrade
```

アップグレード時、システムはMigrationのタイプと `appVersion` に基づいて実行順序を決定します。

## Migration（マイグレーション）のテスト

プラグイン開発においては、**Mock Server（モックサーバー）** を使用してMigrationが正しく実行されるかテストすることをお勧めします。これにより、実際のデータを破損するリスクを避けることができます。

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // プラグイン名
      version: '0.18.0-alpha.5', // アップグレード前のバージョン
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // フィールドの存在確認やデータ移行の成功確認など、検証ロジックを記述します
  });
});
```

> Tip: Mock Serverを利用すると、アップグレードシナリオを素早くシミュレートし、Migrationの実行順序やデータ変更を検証できます。

## 開発プラクティスに関する推奨事項

1.  **Migrationの分割**  
    アップグレードごとに1つのMigrationファイルを生成するように心がけ、原子性を保つことで、問題の特定と解決が容易になります。
2.  **実行タイミングの指定**  
    操作対象に応じて `beforeLoad`、`afterSync`、`afterLoad` を選択し、未ロードのモジュールへの依存を避けてください。
3.  **バージョン管理への注意**  
    `appVersion` を使用して、Migrationが適用されるバージョンを明確に指定し、重複実行を防ぎましょう。
4.  **テストカバレッジ**  
    Mock ServerでMigrationを検証した後、実際の環境でアップグレードを実行してください。