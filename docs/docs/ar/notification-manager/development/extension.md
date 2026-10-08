# توسيع أنواع قنوات الإشعارات

يدعم NocoBase توسيع أنواع قنوات الإشعارات حسب الحاجة، مثل إشعارات الرسائل القصيرة وإشعارات الدفع داخل التطبيقات.

## العميل (Client)

### تسجيل نوع القناة

يتم تسجيل واجهة إعداد القناة وواجهة إعداد الرسالة على جانب العميل من خلال الدالة `registerChannelType` التي يوفرها عميل إضافة إدارة الإشعارات:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Channel type name
      type: 'example-sms', // Channel type identifier
      components: {
        ChannelConfigForm, // Channel configuration form
        MessageConfigForm, // Message configuration form
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## الخادم (Server)

### توسيع الفئة المجردة

يكمن جوهر التطوير على جانب الخادم في توسيع الفئة المجردة `BaseNotificationChannel` وتنفيذ الدالة `send`، والتي تحتوي على منطق الأعمال الخاص بإرسال الإشعارات من خلال الإضافة الموسعة.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### التسجيل على جانب الخادم

يجب استدعاء الدالة `registerChannelType` الخاصة بنواة خادم الإشعارات لتسجيل فئة التنفيذ الخاصة بالخادم داخل النواة:

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

## مثال كامل

فيما يلي مثال على امتداد للإشعارات يوضح بالتفصيل كيفية تطوير امتداد جديد.
لنفترض أننا نريد إضافة إشعارات الرسائل القصيرة إلى NocoBase باستخدام بوابة SMS خاصة بإحدى المنصات.

### إنشاء الإضافة

1. شغّل الأمر التالي لإنشاء الإضافة: `yarn pm add @nocobase/plugin-notification-example`

### تطوير جانب العميل

على جانب العميل، نحتاج إلى تطوير مكوّنين للنموذج: `ChannelConfigForm` (نموذج إعداد القناة) و`MessageConfigForm` (نموذج إعداد الرسالة).

#### `ChannelConfigForm`

لإرسال رسائل SMS، نحتاج إلى مفتاح API وسر. أنشئ ملفًا جديدًا باسم `ChannelConfigForm.tsx` داخل المجلد `src/client`:

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

#### `MessageConfigForm`

يتضمن نموذج إعداد الرسالة بشكل أساسي إعدادات المستلمين (`receivers`) ومحتوى الرسالة (`content`). أنشئ ملفًا جديدًا باسم `MessageConfigForm.tsx` داخل المجلد `src/client`. يستقبل هذا المكوّن المتغير `variableOptions` كمعامل للمتغيرات. يتم إعداد نموذج المحتوى داخل عقدة سير العمل، وغالبًا ما يحتاج إلى استهلاك متغيرات عقدة سير العمل. ويكون محتوى الملف كما يلي:

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

#### تسجيل مكوّنات العميل

بعد تطوير مكوّنات إعداد النموذج، يجب تسجيلها داخل نواة إدارة الإشعارات. لنفترض أن اسم المنصة هو "Example". قم بتحرير الملف `src/client/index.tsx` كما يلي:

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

عند هذه النقطة، يكون تطوير جانب العميل قد اكتمل.

### تطوير جانب الخادم

يكمن جوهر التطوير على جانب الخادم في توسيع الفئة المجردة `BaseNotificationChannel` وتنفيذ الدالة `send`. تحتوي الدالة `send` على منطق الأعمال الخاص بالإضافة الموسعة لإرسال الإشعارات. وبما أن هذا مجرد مثال، فسنكتفي بطباعة المعاملات المستلمة. داخل المجلد `src/server`، أضف ملفًا باسم `example-server.ts`:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

بعد ذلك، قم بتسجيل إضافة الخادم الموسعة من خلال تعديل الملف `src/server/plugin.ts`:

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

### تسجيل الإضافة وتشغيلها

1. شغّل أمر التسجيل: `yarn pm add @nocobase/plugin-notification-example`
2. شغّل أمر التفعيل: `yarn pm enable @nocobase/plugin-notification-example`

### إعداد القناة

عند زيارة صفحة قنوات إدارة الإشعارات، ستلاحظ أن قناة `Example SMS` قد تم تفعيلها.

![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

أضف قناة تجريبية.

![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

أنشئ سير عمل جديدًا واضبط عقدة الإشعارات.

![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

قم بتشغيل سير العمل لعرض المعلومات التالية في وحدة التحكم.

![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)

