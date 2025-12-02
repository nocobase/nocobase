:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# توسيع أنواع قنوات الإشعارات

تدعم NocoBase توسيع أنواع قنوات الإشعارات حسب الحاجة، مثل إشعارات الرسائل النصية القصيرة (SMS) وإشعارات تطبيقات الجوال.

## الواجهة الأمامية (العميل)

### تسجيل نوع القناة

يتم تسجيل واجهة إعدادات قنوات الواجهة الأمامية (العميل) وإعدادات الرسائل من خلال واجهة `registerChannelType` التي يوفرها عميل إضافة إدارة الإشعارات:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // اسم نوع القناة
      type: 'example-sms', // معرّف نوع القناة
      components: {
        ChannelConfigForm, // نموذج إعدادات القناة
        MessageConfigForm, // نموذج إعدادات الرسالة
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## الواجهة الخلفية (الخادم)

### وراثة الفئة المجردة

يكمن جوهر تطوير الواجهة الخلفية (الخادم) في وراثة الفئة المجردة `BaseNotificationChannel` وتطبيق الدالة `send`. تحتوي الدالة `send` على منطق العمل الخاص بإرسال الإشعارات عبر الإضافة الموسعة.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### تسجيل الواجهة الخلفية (الخادم)

بعد ذلك، يجب استدعاء الدالة `registerChannelType` الخاصة بنواة خادم الإشعارات لتسجيل فئة تطبيق الواجهة الخلفية (الخادم) التي تم تطويرها في النواة:

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

## مثال كامل

فيما يلي مثال على إضافة إشعارات موسعة لوصف كيفية تطوير إضافة موسعة بالتفصيل.
لنفترض أننا نرغب في إضافة وظيفة إشعارات الرسائل النصية القصيرة (SMS) إلى NocoBase باستخدام بوابة رسائل نصية قصيرة تابعة لمنصة معينة.

### إنشاء الإضافة

1.  نفّذ أمر إنشاء الإضافة: `yarn pm add @nocobase/plugin-notification-example`

### تطوير الواجهة الأمامية (العميل)

بالنسبة لجزء الواجهة الأمامية (العميل)، نحتاج إلى تطوير مكوني نموذج: `ChannelConfigForm` (نموذج إعدادات القناة) و `MessageConfigForm` (نموذج إعدادات الرسالة).

#### ChannelConfigForm

عند إرسال الرسائل النصية القصيرة (SMS) عبر منصة معينة، يتطلب الأمر مفتاح API وسرًا (secret). لذلك، يتضمن نموذج إعدادات القناة لدينا بشكل أساسي هذين العنصرين. أنشئ ملفًا جديدًا باسم `ChannelConfigForm.tsx` في دليل `src/client`، ومحتوى الملف كالتالي:

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

يتضمن نموذج إعدادات الرسالة بشكل أساسي إعدادات المستلمين (`receivers`) ومحتوى الرسالة (`content`). أنشئ ملفًا جديدًا باسم `MessageConfigForm.tsx` في دليل `src/client`. يستقبل المكون `variableOptions` كمعامل متغير. يتم تكوين نموذج المحتوى حاليًا في عقدة سير العمل، وعادة ما يحتاج إلى استهلاك متغيرات عقدة سير العمل. محتوى الملف المحدد كالتالي:

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

#### تسجيل مكونات الواجهة الأمامية (العميل)

بعد تطوير مكونات إعدادات النموذج، يجب تسجيلها في نواة إدارة الإشعارات. بافتراض أن اسم منصتنا هو Example، فإن محتوى ملف `src/client/index.tsx` بعد التعديل سيكون كالتالي:

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

بهذا، يكون تطوير الواجهة الأمامية (العميل) قد اكتمل.

### تطوير الواجهة الخلفية (الخادم)

يكمن جوهر تطوير الواجهة الخلفية (الخادم) في وراثة الفئة المجردة `BaseNotificationChannel` وتطبيق الدالة `send`. تحتوي الدالة `send` على منطق العمل الخاص بإرسال الإشعارات عبر الإضافة الموسعة. نظرًا لأن هذا مثال توضيحي، سنقوم ببساطة بطباعة المعاملات المستلمة. في دليل `src/server`، أضف ملفًا جديدًا باسم `example-server.ts`، ومحتوى الملف كالتالي:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

بعد ذلك، يجب استدعاء الدالة `registerChannelType` الخاصة بنواة خادم الإشعارات لتسجيل إضافة الواجهة الخلفية (الخادم) الموسعة. محتوى ملف `src/server/plugin.ts` بعد التعديل سيكون كالتالي:

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

### تسجيل الإضافة وتشغيلها

1.  نفّذ أمر التسجيل: `yarn pm add @nocobase/plugin-notification-example`
2.  نفّذ أمر التفعيل: `yarn pm enable @nocobase/plugin-notification-example`

### إعدادات القناة

عند زيارة صفحة قنوات إدارة الإشعارات، ستلاحظ أن قناة `Example SMS` قد تم تفعيلها.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

أضف قناة نموذجية.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

أنشئ سير عمل جديدًا وقم بتكوين عقدة الإشعار.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

قم بتشغيل تنفيذ سير العمل لمشاهدة المعلومات التالية في مخرجات وحدة التحكم (console).
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)