# مرجع واجهة البرمجة (API)

## جانب الخادم (Server Side)

### `BaseNotificationChannel`

تمثل هذه الفئة المجردة أساسًا لأنواع مختلفة من قنوات الإشعارات، حيث تُعرّف الواجهات الأساسية اللازمة لتنفيذ القناة. لإضافة قناة إشعارات جديدة، يجب توسيع هذه الفئة (extend) وتنفيذ دوالها.

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{
    message: Message;
    status: 'success' | 'fail';
    reason?: string;
  }>;
}
```

### `PluginNotificationManagerServer`

تمثل هذه الإضافة من جهة الخادم أداة لإدارة الإشعارات، حيث توفر طرقًا لتسجيل أنواع قنوات الإشعارات وإرسال الإشعارات.

#### `registerChannelType()`

تُستخدم هذه الدالة لتسجيل نوع قناة جديد على جانب الخادم. المثال التالي يوضح طريقة الاستخدام.

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleServer } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(
      PluginNotificationManagerServer,
    ) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({
      type: 'example-sms',
      Channel: ExampleServer,
    });
  }
}

export default PluginNotificationExampleServer;
```

##### الصيغة (Signature)

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

تُستخدم دالة `send` لإرسال الإشعارات عبر قناة محددة.

```ts
// In-app message
send({
  channelName: 'in-app-message',
  message: {
    title: 'In-app message test title',
    content: 'In-app message test'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// Email
send({
  channelName: 'email',
  message: {
    title: 'Email test title',
    content: 'Email test'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### الصيغة (Signature)

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

حقل `receivers` يدعم حاليًا نوعين من التنسيق:
معرفات مستخدمي NocoBase (`userId`) أو إعدادات قناة مخصصة (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### معلومات تفصيلية

`sendConfig`

| الخاصية       | النوع           | الوصف        |
| ------------- | --------------- | ------------ |
| `channelName` | `string`        | معرّف القناة |
| `message`     | `object`        | كائن الرسالة |
| `receivers`   | `ReceiversType` | المستلمون    |
| `triggerFrom` | `string`        | مصدر التشغيل |

## جانب العميل (Client Side)

### `PluginNotificationManagerClient`

#### `channelTypes`

مكتبة أنواع القنوات المسجلة.

##### الصيغة (Signature)

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

تُستخدم لتسجيل نوع قناة على جانب العميل.

##### الصيغة (Signature)

`registerChannelType(params: registerTypeOptions)`

##### النوع (Type)

```ts
type registerTypeOptions = {
  title: string; // Display title for the channel
  type: string; // Channel identifier
  components: {
    ChannelConfigForm?: ComponentType; // Channel configuration form component;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Message configuration form component;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Content configuration form component (for message content only, excluding recipient configuration);
  };
  meta?: {
    // Metadata for channel configuration
    createable?: boolean; // Whether new channels can be added;
    editable?: boolean; // Whether channel configuration is editable;
    deletable?: boolean; // Whether channel configuration is deletable;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```

