:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# コレクション

NocoBaseのプラグイン開発において、**コレクション（データテーブル）** は最も核となる概念の一つです。コレクションを定義したり拡張したりすることで、プラグインにデータテーブルの構造を追加したり変更したりできます。データソース管理画面で作成するデータテーブルとは異なり、**コードで定義されたコレクションは通常、システムレベルのメタデータテーブル**であり、データソース管理のリストには表示されません。

## データテーブルの定義

規約に基づいたディレクトリ構造に従い、コレクションファイルは `./src/server/collections` ディレクトリに配置する必要があります。新しいテーブルを作成するには `defineCollection()` を使用し、既存のテーブルを拡張するには `extendCollection()` を使用します。

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

-   `name`：テーブル名（データベースには同名のテーブルが自動的に生成されます）。
-   `title`：このテーブルのUI上での表示名です。
-   `fields`：フィールドの集合で、各フィールドには `type`、`name` などの属性が含まれます。

他のプラグインのコレクションにフィールドを追加したり、設定を変更したりする必要がある場合は、`extendCollection()` を使用できます。

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

プラグインをアクティベートすると、システムは既存の `articles` テーブルに `isPublished` フィールドを自動的に追加します。

:::tip
規約に基づいたディレクトリは、すべてのプラグインの `load()` メソッドが実行される前に読み込みが完了します。これにより、一部のデータテーブルが読み込まれていないことによる依存関係の問題を回避できます。
:::

## データベース構造の同期

プラグインが初めてアクティベートされると、システムはコレクションの設定とデータベース構造を自動的に同期します。プラグインがすでにインストールされて実行中の場合、コレクションを追加または変更した後は、手動でアップグレードコマンドを実行する必要があります。

```bash
yarn nocobase upgrade
```

同期中に例外やダーティデータが発生した場合は、アプリケーションを再インストールすることでテーブル構造を再構築できます。

```bash
yarn nocobase install -f
```

## リソースの自動生成

コレクションを定義すると、システムは対応するリソースを自動的に生成します。このリソースに対してAPI経由で直接CRUD操作を実行できます。詳細については、[リソース管理](./resource-manager.md) を参照してください。