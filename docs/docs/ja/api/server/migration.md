---
title: "Migration"
description: "NocoBase Migration API リファレンス：Migration 基底クラス、up/down メソッド、on 実行タイミング、appVersion バージョン制御、利用可能なプロパティ。"
keywords: "Migration,データマイグレーション,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration は NocoBase のデータマイグレーション基底クラスで、プラグインのアップグレード時にデータベース構造の変更やデータマイグレーションを処理するために使用します。`@nocobase/server` からインポートします。

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // アップグレードロジック
  }
}
```

## クラスプロパティ

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

upgrade フロー内での migration の実行タイミングを制御します。デフォルトは `'afterLoad'` です。

| 値 | 実行タイミング | 適用シーン |
|----|----------|----------|
| `'beforeLoad'` | プラグインのロード前 | 低レベルの DDL 操作（カラムの追加、制約の追加など）。この時点では Repository API は使用できません |
| `'afterSync'` | `db.sync()` の後、プラグインの upgrade 前 | 新しいテーブル構造が必要だが、プラグインロジックに依存しないデータマイグレーション |
| `'afterLoad'` | すべてのプラグインのロード完了後 | **デフォルト値**。ほとんどの migration はこれを使用します。完全な Repository API を利用できます |

### appVersion

```ts
appVersion: string;
```

semver 範囲文字列で、どのバージョンのアプリケーションで migration を実行するかを決定します。フレームワークは `semver.satisfies()` で判定します：現在のアプリケーションバージョンがこの範囲を満たす場合のみ、migration が実行されます。

```ts
// 1.0.0 未満のバージョンからアップグレードする場合のみ実行
appVersion = '<1.0.0';

// 0.21.0-alpha.13 未満のバージョンからアップグレードする場合のみ実行
appVersion = '<0.21.0-alpha.13';

// 空にすると毎回の upgrade で実行
appVersion = '';
```

## インスタンスプロパティ

### app

```ts
get app(): Application
```

NocoBase Application インスタンスです。これを通じてアプリケーションの各モジュールにアクセスできます：

```ts
async up() {
  // アプリケーションバージョンを取得
  const version = this.app.version;

  // ログを取得
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

NocoBase Database インスタンスです。Repository の取得やクエリの実行などに使用できます：

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

現在のプラグインインスタンスです。プラグインレベルの migration でのみ利用可能です（core migration では `undefined`）。

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Sequelize インスタンスです。生の SQL を直接実行できます：

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Sequelize QueryInterface です。DDL 操作（カラムの追加/削除、制約の追加、カラム型の変更など）に使用します：

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // カラムを追加
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // ユニーク制約を追加
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

プラグインマネージャーです。`this.pm.repository` を通じてプラグインのメタデータをクエリおよび変更できます：

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // プラグインレコードを一括変更
  }
}
```

## インスタンスメソッド

### up()

```ts
async up(): Promise<void>
```

**アップグレード時に実行されます。** サブクラスはこのメソッドをオーバーライドし、マイグレーションロジックを記述する必要があります。

### down()

```ts
async down(): Promise<void>
```

**ロールバック時に実行されます。** ほとんどの migration では空のままにします。ロールバックをサポートする必要がある場合は、ここに逆操作を記述します。

## 完全な例

### Repository API を使用してデータを更新する（afterLoad）

最も一般的なシーン -- すべてのプラグインのロード完了後に、Repository API でデータを一括更新します：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### QueryInterface を使用してテーブル構造を変更する（beforeLoad）

プラグインのロード前に低レベルの DDL を実行します -- 例えばテーブルに新しいカラムとユニーク制約を追加します：

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // フィールドが既に存在するか確認
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### 生の SQL を使用する（afterSync）

テーブル構造の同期完了後に、生の SQL でデータマイグレーションを行います：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Migration ファイルの作成

CLI コマンドで作成します：

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

コマンドはプラグインの `src/server/migrations/` ディレクトリにタイムスタンプ付きのファイルを生成します。テンプレートは以下の通りです：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<現在のバージョン>';

  async up() {
    // coding
  }
}
```

コマンドパラメータ：

| パラメータ | 説明 |
|------|------|
| `<name>` | migration 名称、ファイル名の生成に使用されます |
| `--pkg <pkg>` | パッケージ名、ファイルの保存先パスを決定します |
| `--on <on>` | 実行タイミング、デフォルトは `'afterLoad'` |

## 関連リンク

- [Migration アップグレードスクリプト（プラグイン開発）](../../plugin-development/server/migration.md) — プラグイン開発における migration の使い方チュートリアル
- [Collections データテーブル](../../plugin-development/server/collections.md) — defineCollection とテーブル構造の同期
- [Database データベース操作](../../plugin-development/server/database.md) — Repository API とデータベース操作
- [Plugin プラグイン](../../plugin-development/server/plugin.md) — プラグインライフサイクルにおける install() と migration の関係
