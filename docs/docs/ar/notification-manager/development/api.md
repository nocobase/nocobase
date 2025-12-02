:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مرجع الواجهة البرمجية (API)

## جانب الخادم

### `BaseNotificationChannel`

هذا صنف تجريدي يمثل أساسًا لأنواع قنوات الإشعارات المختلفة. يحدد الواجهات الأساسية لتطبيق القناة. لإضافة نوع قناة إشعارات جديد، يجب عليك وراثة هذا الصنف وتطبيق أساليبه.

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

هذه الإضافة (Plugin) لجانب الخادم تعمل كأداة لإدارة الإشعارات، حيث توفر أساليب لتسجيل أنواع قنوات الإشعارات وإرسال الإشعارات.

#### `registerChannelType()`

يسجل هذا الأسلوب نوع قناة جديدًا على جانب الخادم. يتوفر مثال للاستخدام أدناه.

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleServer } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleServer });
  }
}

export default PluginNotificationExampleServer;
```

##### التوقيع

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

يُستخدم أسلوب `send` لإرسال الإشعارات عبر قناة محددة.

```ts
// رسالة داخل التطبيق
send({
  channelName: 'in-app-message',
  message: {
    title: 'عنوان اختبار رسالة داخل التطبيق',
    content: 'اختبار رسالة داخل التطبيق'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// بريد إلكتروني
send({
  channelName: 'email',
  message: {
    title: 'عنوان اختبار البريد الإلكتروني',
    content: 'اختبار البريد الإلكتروني'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### التوقيع

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

يدعم حقل `receivers` حاليًا صيغتين: معرفات مستخدمي NocoBase (`userId`) أو إعدادات القناة المخصصة (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### معلومات مفصلة

`sendConfig`

| الخاصية        | النوع          | الوصف              |
| ------------- | --------------- | ------------------ |
| `channelName` | `string`        | معرف القناة        |
| `message`     | `object`        | كائن الرسالة       |
| `receivers`   | `ReceiversType` | المستلمون          |
| `triggerFrom` | `string`        | مصدر التشغيل       |

## جانب العميل

### `PluginNotificationManagerClient`

#### `channelTypes`

مكتبة أنواع القنوات المسجلة.

##### التوقيع

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

يسجل نوع قناة لجانب العميل.

##### التوقيع

`registerChannelType(params: registerTypeOptions)`

##### النوع

```ts
type registerTypeOptions = {
  title: string; // عنوان عرض القناة
  type: string;  // معرف القناة
  components: {
    ChannelConfigForm?: ComponentType; // مكون نموذج إعدادات القناة؛
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // مكون نموذج إعدادات الرسالة؛
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // مكون نموذج إعدادات المحتوى (لمحتوى الرسالة فقط، لا يشمل إعدادات المستلمين)؛
  };
  meta?: { // بيانات وصفية لإعدادات القناة
    createable?: boolean; // هل يمكن إضافة قنوات جديدة؛
    editable?: boolean;  // هل معلومات إعدادات القناة قابلة للتحرير؛
    deletable?: boolean; // هل معلومات إعدادات القناة قابلة للحذف؛
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```