:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# توسيع مزوّد خدمة الرسائل القصيرة

توضح هذه المقالة بشكل أساسي كيفية توسيع وظيفة مزوّد خدمة الرسائل القصيرة ضمن ميزة [التحقق: الرسائل القصيرة](../sms) من خلال استخدام إضافة.

## الواجهة الأمامية

### تسجيل نموذج الإعدادات

عند إعداد أداة التحقق من الرسائل القصيرة، بعد اختيار نوع مزوّد خدمة الرسائل القصيرة، سيظهر نموذج إعدادات مرتبط بهذا النوع. يجب على المطور تسجيل نموذج الإعدادات هذا في الواجهة الأمامية.

![](https://static-docs.nocobase.com/202503011221912.png)

```ts
import { Plugin, SchemaComponent } from '@nocobase/client';
import PluginVerificationClient from '@nocobase/plugin-verification/client';
import React from 'react';

const CustomSMSProviderSettingsForm: React.FC = () => {
  return <SchemaComponent schema={{
    type: 'void',
    properties: {
      accessKeyId: {
        title: `{{t("Access Key ID", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Access Key Secret", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        'x-component-props': { password: true },
        required: true,
      },
    }
  }} />
}

class PluginCustomSMSProviderClient extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationClient;
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      components: {
        AdminSettingsForm: CustomSMSProviderSettingsForm,
      },
    });
  }
}
```

## الواجهة الخلفية

### تنفيذ واجهة الإرسال

لقد قامت إضافة التحقق بالفعل بتغليف عملية إنشاء كلمات المرور الديناميكية لمرة واحدة (OTPs)، لذلك يحتاج المطورون فقط إلى تنفيذ منطق الإرسال للتفاعل مع مزوّد خدمة الرسائل القصيرة.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options هو كائن الإعدادات من الواجهة الأمامية
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### تسجيل نوع التحقق

بعد تنفيذ واجهة الإرسال، يجب تسجيلها.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // يجب أن يتوافق الاسم مع الاسم المستخدم في الواجهة الأمامية
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```