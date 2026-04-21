# توسيع مزود SMS

يشرح هذا المقال بشكل رئيسي كيفية توسيع وظيفة مزود SMS في ميزة [التحقق: SMS](../sms) عبر إضافة.

## العميل

### تسجيل نموذج التهيئة

عند تهيئة أداة تحقق SMS، بعد اختيار نوع مزود SMS، سيظهر نموذج تهيئة مرتبط بنوع المزود هذا. يجب على المطور تسجيل نموذج التهيئة هذا من جهة العميل.

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

## الخادم

### تنفيذ واجهة الإرسال

قامت إضافة التحقق بتغليف عملية إنشاء كلمات المرور الديناميكية لمرة واحدة (OTPs)، لذا يحتاج المطورون فقط إلى تنفيذ منطق إرسال الرسائل للتفاعل مع مزود SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options هو كائن التهيئة من العميل
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### تسجيل نوع التحقق

بمجرد تنفيذ واجهة الإرسال، يجب تسجيلها.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // يجب أن يتوافق الاسم مع الاسم المستخدم في العميل
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```
