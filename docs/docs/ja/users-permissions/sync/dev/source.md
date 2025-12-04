:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 同期データソースの拡張

## 概要

NocoBaseは、必要に応じてユーザーデータ同期のデータソースタイプを拡張できます。

## サーバーサイド

### データソースインターフェース

組み込みのユーザーデータ同期プラグインは、データソースタイプの登録と管理機能を提供しています。データソースタイプを拡張するには、プラグインが提供する `SyncSource` 抽象クラスを継承し、関連する標準インターフェースを実装する必要があります。

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` は、データソースのカスタム設定を取得するための `options` プロパティを提供しています。

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### `UserData` フィールドの説明

| フィールド         | 説明                                      |
| ------------ | ----------------------------------------- |
| `dataType`   | データタイプ。`user` と `department` のいずれかを選択できます。 |
| `uniqueKey`  | 一意の識別子フィールド                              |
| `records`    | データレコード                                |
| `sourceName` | データソース名                                |

`dataType` が `user` の場合、`records` フィールドには以下のフィールドが含まれます。

| フィールド          | 説明           |
| ------------- | -------------- |
| `id`          | ユーザーID        |
| `nickname`    | ユーザーニックネーム       |
| `avatar`      | ユーザーアバター       |
| `email`       | メールアドレス           |
| `phone`       | 電話番号         |
| `departments` | 所属部門IDの配列 |

`dataType` が `department` の場合、`records` フィールドには以下のフィールドが含まれます。
| フィールド | 説明 |
| -------- | ---------------------- |
| `id` | 部門ID |
| `name` | 部門名 |
| `parentId` | 親部門ID |

### データソースインターフェースの実装例

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### データソースタイプの登録

拡張したデータソースは、データ管理モジュールに登録する必要があります。

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## クライアントサイド

クライアントのユーザーインターフェースは、ユーザーデータ同期プラグインのクライアントが提供する `registerType` メソッドを使ってデータソースタイプを登録します。

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // バックエンド管理フォーム
      },
    });
  }
}
```

### バックエンド管理フォーム

![](https://static-docs.nocobase.com/202412041429835.png)

上部には一般的なデータソース設定があり、下部には登録可能なカスタム設定フォームのセクションがあります。