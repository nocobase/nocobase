:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 通知チャネルタイプの拡張

NocoBaseでは、SMS通知やアプリのプッシュ通知など、必要に応じて通知チャネルタイプを拡張できます。

## クライアント

### チャネルタイプの登録

クライアントのチャネル設定画面とメッセージ設定画面は、通知管理プラグインのクライアントが提供する`registerChannelType`インターフェースを使って登録します。

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // チャネルタイプ名
      type: 'example-sms', // チャネルタイプ識別子
      components: {
        ChannelConfigForm, // チャネル設定フォーム
        MessageConfigForm, // メッセージ設定フォーム
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## サーバー

### 抽象クラスの継承

サーバー開発の核となるのは、抽象クラス`BaseNotificationChannel`を継承し、`send`メソッドを実装することです。`send`メソッドの内部には、拡張プラグインが通知を送信するためのビジネスロジックを記述します。

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### サーバーの登録

次に、通知サーバーのコアが提供する`registerChannelType`メソッドを呼び出し、開発したサーバー実装クラスをコアに登録します。

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

## 完全な例

ここでは、通知拡張プラグインの例を挙げて、拡張プラグインの開発方法を詳しく説明します。
あるプラットフォームのSMSゲートウェイを利用して、NocoBaseにSMS通知機能を追加することを想定してみましょう。

### プラグインの作成

1. プラグイン作成コマンド `yarn pm add @nocobase/plugin-notification-example` を実行します。

### クライアント開発

クライアント側では、`ChannelConfigForm`（チャネル設定フォーム）と`MessageConfigForm`（メッセージ設定フォーム）の2つのフォームコンポーネントを開発する必要があります。

#### ChannelConfigForm

あるプラットフォームでSMSを送信するにはAPIキーとシークレットが必要なので、チャネルフォームの内容には主にこの2つの項目が含まれます。`src/client`ディレクトリに`ChannelConfigForm.tsx`という名前のファイルを新規作成し、以下の内容を記述します。

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const ChannelConfigForm = () => {
  const t = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          apiKey: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
            'x-component': 'Input',
          },
        },
      }}
    />
  );
};

export default ChannelConfigForm;
```

#### MessageConfigForm

メッセージ設定フォームには、主に受信者（`receivers`）とメッセージ内容（`content`）の設定が含まれます。`src/client`ディレクトリに`MessageConfigForm.tsx`という名前のファイルを新規作成します。このコンポーネントは`variableOptions`を引数として受け取ります。現在、コンテンツフォームはワークフローノードで設定され、通常はワークフローノードの変数を消費する必要があります。具体的なファイル内容は以下の通りです。

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          to: {
            type: 'array',
            required: true,
            title: `{{t("Receivers")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Phone number")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add phone number")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Content")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.RawTextArea',
            'x-component-props': {
              scope: variableOptions,
              placeholder: 'Hi,',
              autoSize: {
                minRows: 10,
              },
            },
          },
        },
      }}
    />
  );
};

export default MessageConfigForm
```

#### クライアントコンポーネントの登録

フォーム設定コンポーネントの開発が完了したら、通知管理コアに登録する必要があります。プラットフォーム名を`Example`と仮定すると、編集後の`src/client/index.tsx`ファイルの内容は以下のようになります。

```ts
import { Plugin } from '@nocobase/client';
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';
import { tval } from '@nocobase/utils/client';
import ChannelConfigForm from './ChannelConfigForm';
import MessageConfigForm from './MessageConfigForm';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: tval('Example SMS', { ns: '@nocobase/plugin-notification-example' }),
      type: 'example-sms',
      components: {
        ChannelConfigForm,
        MessageConfigForm,
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

これで、クライアント側の開発は完了です。

### サーバー開発

サーバー開発の核となるのは、抽象クラス`BaseNotificationChannel`を継承し、`send`メソッドを実装することです。`send`メソッドの内部には、拡張プラグインが通知を送信するためのビジネスロジックを記述します。ここでは例として、受け取った引数をシンプルにコンソールに出力します。`src/server`ディレクトリに`example-server.ts`という名前のファイルを新規作成し、以下の内容を記述します。

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

次に、通知サーバーのコアが提供する`registerChannelType`メソッドを呼び出して、サーバー拡張プラグインを登録します。編集後の`src/server/plugin.ts`ファイルの内容は以下のようになります。

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

### プラグインの登録と起動

1. 登録コマンド `yarn pm add @nocobase/plugin-notification-example` を実行します。
2. 有効化コマンド `yarn pm enable @nocobase/plugin-notification-example` を実行します。

### チャネル設定

ここで通知管理のチャネルページにアクセスすると、`Example SMS`が有効になっていることが確認できます。
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

新しいサンプルチャネルを追加します。
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

新しいワークフローを作成し、通知ノードを設定します。
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

ワークフローの実行をトリガーすると、コンソールに以下の情報が出力されるのが確認できます。
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)