---
title: "Collections データテーブル定義"
description: "NocoBase プラグインで Collection を定義する方法：defineCollection、extendCollection、fields、src/server/collections ディレクトリの規約。"
keywords: "Collections,defineCollection,extendCollection,データテーブル,Collection 定義,NocoBase"
---

# Collections データテーブル

NocoBase のプラグイン開発において、**Collection（データテーブル）** は最も核となる概念の一つです。Collection を定義または拡張することで、プラグイン内でデータテーブル構造を追加・変更できます。「データソース管理」画面で作成するデータテーブルとは異なり、**コードで定義された Collection は通常、システムレベルのメタデータテーブル**であり、データソース管理のリストには表示されません。

## データテーブルの定義

規約に基づいたディレクトリ構造に従い、Collection ファイルは `./src/server/collections` ディレクトリに配置します。新しいテーブルを作成するには `defineCollection()` を、既存のテーブルを拡張するには `extendCollection()` を使用します。

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'サンプル記事',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'タイトル', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: '本文' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: '著者' },
    },
  ],
});
```

上記の例では、

- `name`：テーブル名（データベースに同名のテーブルが自動生成されます）。  
- `title`：このテーブルの画面上での表示名称です。  
- `fields`：フィールドの集合で、各フィールドには `type`、`name` などの属性が含まれます。  

他のプラグインの Collection にフィールドを追加したり、設定を変更したりする必要がある場合は、`extendCollection()` を使用できます。

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

プラグインを有効化すると、システムは既存の `articles` テーブルに `isPublished` フィールドを自動的に追加します。

:::tip ヒント

規約に基づいたディレクトリは、すべてのプラグインの `load()` メソッドが実行される前に読み込みが完了します。これにより、一部のデータテーブルが読み込まれていないことによる依存関係の問題を回避できます。

:::

## フィールドタイプ早見表

`defineCollection` の `fields` において、`type` はフィールドのデータベース上のカラム型を決定します。以下は組み込みのフィールドタイプの一覧です。

### テキスト

| type | データベース型 | 説明 | 固有パラメータ |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | 短いテキスト | `length?: number`（カスタム長さ）, `trim?: boolean` |
| `text` | TEXT | 長いテキスト | `length?: 'tiny' \| 'medium' \| 'long'`（MySQL のみ） |

### 数値

| type | データベース型 | 説明 | 固有パラメータ |
|------|-----------|------|----------|
| `integer` | INTEGER | 整数 | — |
| `bigInt` | BIGINT | 大きな整数 | — |
| `float` | FLOAT | 浮動小数点数 | — |
| `double` | DOUBLE | 倍精度浮動小数点 | — |
| `decimal` | DECIMAL(p,s) | 固定小数点数 | `precision: number`, `scale: number` |

### ブール値

| type | データベース型 | 説明 |
|------|-----------|------|
| `boolean` | BOOLEAN | ブール値 |

### 日付時刻

| type | データベース型 | 説明 | 固有パラメータ |
|------|-----------|------|----------|
| `date` | DATE(3) | 日付時刻（ミリ秒付き） | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | 日付のみ、時刻なし | — |
| `time` | TIME | 時刻のみ | — |
| `unixTimestamp` | BIGINT | Unix タイムスタンプ | `accuracy?: 'second' \| 'millisecond'` |

:::tip ヒント

`date` は最もよく使われる日付型です。タイムゾーンの扱い方を区別する必要がある場合は、`datetimeTz`（タイムゾーン付き）と `datetimeNoTz`（タイムゾーンなし）も選択できます。

:::

### 構造化データ

| type | データベース型 | 説明 | 固有パラメータ |
|------|-----------|------|----------|
| `json` | JSON / JSONB | JSON データ | `jsonb?: boolean`（PostgreSQL で JSONB を使用） |
| `jsonb` | JSONB / JSON | JSONB を優先使用 | — |
| `array` | ARRAY / JSON | 配列 | PostgreSQL ではネイティブの ARRAY 型が使用可能 |

### ID 生成

| type | データベース型 | 説明 | 固有パラメータ |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | 短い ID を自動生成 | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean`（デフォルト true） |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number`（デフォルト 12）, `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean`（デフォルト true） |

### 特殊型

| type | データベース型 | 説明 |
|------|-----------|------|
| `password` | VARCHAR(255) | 自動的にソルト付きハッシュで保存 |
| `virtual` | 実カラムなし | 仮想フィールド、データベースにカラムを作成しません |
| `context` | 設定可能 | リクエストコンテキストから自動入力（例：`currentUser.id`） |

### リレーション型

リレーションフィールドはデータベースカラムを作成せず、ORM レイヤーでテーブル間の関係を構築します。

| type | 説明 | 主要パラメータ |
|------|------|----------|
| `belongsTo` | 多対一 | `target`（ターゲットテーブル）, `foreignKey`（外部キーフィールド） |
| `hasOne` | 一対一 | `target`, `foreignKey` |
| `hasMany` | 一対多 | `target`, `foreignKey` |
| `belongsToMany` | 多対多 | `target`, `through`（中間テーブル）, `foreignKey`, `otherKey` |

リレーションフィールドの使用例：

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // 多対一：記事は一人の著者に属する
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // 一対多：記事には複数のコメントがある
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // 多対多：記事には複数のタグがある
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // 中間テーブル名
    },
  ],
});
```

### 共通パラメータ

すべてのカラムフィールドは以下のパラメータをサポートしています。

| パラメータ | 型 | 説明 |
|------|------|------|
| `name` | `string` | フィールド名（必須） |
| `defaultValue` | `any` | デフォルト値 |
| `allowNull` | `boolean` | null を許可するか |
| `unique` | `boolean` | ユニーク制約 |
| `primaryKey` | `boolean` | 主キーかどうか |
| `autoIncrement` | `boolean` | 自動インクリメント |
| `index` | `boolean` | インデックスを作成するか |
| `comment` | `string` | フィールドのコメント |

## データベース構造の同期

プラグインが初めて有効化される際、システムは Collection の設定とデータベース構造を自動的に同期します。プラグインがすでにインストールされて実行中の場合、Collection を追加または変更した後は、手動でアップグレードコマンドを実行する必要があります。

```bash
yarn nocobase upgrade
```

同期中に異常やダーティデータが発生した場合は、アプリケーションを再インストールすることでテーブル構造を再構築できます。

```bash
yarn nocobase install -f
```

プラグインのアップグレード時に既存データの移行が必要な場合――フィールド名の変更、テーブルの分割、デフォルト値の埋め戻しなど――は、データベースを手動で変更するのではなく、[Migration アップグレードスクリプト](./migration.md) で対応してください。

## Collection を UI のデータテーブルリストに表示する

`defineCollection` で定義されたテーブルはサーバー側の内部テーブルであり、デフォルトでは「データソース管理」のリストにも、「ブロックを追加」する際のデータテーブル選択リストにも**表示されません**。

**推奨方法**：NocoBase の画面上の「[データソース管理](../../data-sources/data-source-main/index.md)」からデータテーブルを追加し、フィールドとインターフェースタイプを設定すれば、ブロックのデータテーブル選択リストに自動的に表示されるようになります。

![ブロック追加時に自分のテーブルを選択できる](https://static-docs.nocobase.com/20260409143839.png)

プラグインのコードで登録する必要がある場合（例えばサンプルプラグインのデモシナリオなど）は、クライアントプラグインで `addCollection` を使って手動で登録できます。ただし、`eventBus` パターンで登録する必要があり、`load()` 内で直接呼び出すことはできません。`ensureLoaded()` は `load()` の後にすべての collection をクリアして再設定するためです。完全な例は [フロントエンドとバックエンドが連動するデータ管理プラグインを作る](../client/examples/fullstack-plugin.md) を参照してください。

## リソース（Resource）の自動生成

Collection を定義すると、NocoBase は対応する REST API リソースを自動的に生成します。CRUD インターフェース（`list`、`get`、`create`、`update`、`destroy`）はすぐに使える状態で、追加のコードは不要です。組み込みの CRUD 操作では足りない場合――例えば「一括インポート」や「集計」インターフェースが必要な場合――は、`resourceManager` でカスタム action を登録できます。詳細は [ResourceManager リソース管理](./resource-manager.md) を参照してください。

## 関連リンク

- [Database データベース](./database.md) — CRUD、Repository、トランザクションとデータベースイベント
- [DataSourceManager データソース管理](./data-source-manager.md) — 複数データソースとその Collection の管理
- [Migration データマイグレーション](./migration.md) — プラグインアップグレード時のデータ移行スクリプト
- [Plugin プラグイン](./plugin.md) — プラグインクラスのライフサイクル、メンバーメソッドと `app` オブジェクト
- [ResourceManager リソース管理](./resource-manager.md) — カスタム REST API と操作ハンドラー
- [フロントエンドとバックエンドが連動するデータ管理プラグインを作る](../client/examples/fullstack-plugin.md) — defineCollection + addCollection の完全な例
- [プロジェクトディレクトリ構造](../project-structure.md) — `src/server/collections` ディレクトリの規約説明
