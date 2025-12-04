:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# APIリファレンス

## サービスサイド

### `BaseNotificationChannel`

`BaseNotificationChannel` は、ユーザーチャネルタイプの抽象クラスです。通知チャネルに必要なインターフェースを定義しており、新しい通知チャネルタイプを拡張するには、このクラスを継承し、そのメソッドを実装する必要があります。

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;
}
```

### `PluginNotificationManagerServer`

通知管理サービスサイドプラグインです。通知チャネルタイプの登録メソッドと通知配信メソッドを提供します。

#### `registerChannelType()`

チャネルタイプをサービスサイドに登録します。以下の使用例を参照してください。

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

##### 署名

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

通知配信メソッドです。このメソッドを呼び出すことで通知を配信できます。

```ts
send('in-app-message', 
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: '站内信测试',
    title: '站内信测试标题'
  ],
  triggerFrom: 'workflow')

  send('email', 
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: '邮箱测试',
    title: '邮箱测试标题'
  ],
  triggerFrom: 'workflow')
```

##### 署名

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

受信者`receivers`は現在、NocoBaseのユーザーIDである`userId`と、チャネル固有の設定である`channel-self-defined`の2つの形式のみをサポートしています。

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### 詳細情報

sendConfig

| 属性         | 型         |  説明       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | チャネル識別子   |
| `message`   | `object`   | メッセージオブジェクト      |
| `receivers`     | `ReceiversType`  | 受信者 |
| `triggerFrom`     | `string`  | トリガー元 |

## クライアントサイド

### `PluginNotificationManagerClient`

#### `channelTypes`

登録済みのチャネルタイプライブラリです。

##### 署名

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

クライアントサイドのチャネルタイプを登録します。

##### 署名

`registerChannelType(params: registerTypeOptions)`

##### 型

```ts
type registerTypeOptions = {
  title: string; // チャネルの表示タイトル
  type: string;  // チャネル識別子
  components: {
    ChannelConfigForm?: ComponentType // チャネル設定フォームコンポーネント;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // メッセージ設定フォームコンポーネント;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // コンテンツ設定フォームコンポーネント（メッセージ内容のみで、受信者の設定は含まれません）;
  };
  meta?: { // チャネル設定のメタ情報
    createable?: boolean // 新しいチャネルの追加をサポートするかどうか;
    editable?: boolean  // チャネル設定情報が編集可能かどうか;
    deletable?: boolean // チャネル設定情報が削除可能かどうか;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```