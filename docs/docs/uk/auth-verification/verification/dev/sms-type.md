:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розширення SMS-провайдера

Ця стаття розповідає, як розширити функціонал SMS-провайдера у функції [Верифікація: SMS](../sms) за допомогою плагіна.

## Клієнтська частина

### Реєстрація форми конфігурації

Коли ви налаштовуєте SMS-верифікатор, після вибору типу SMS-провайдера з'явиться форма конфігурації, пов'язана з цим типом провайдера. Цю форму конфігурації розробник має зареєструвати на клієнтській стороні.

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
        title: `{{t("ID ключа доступу", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Секретний ключ доступу", { ns: "${NAMESPACE}" })}}`,
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

## Серверна частина

### Реалізація інтерфейсу відправки

Плагін верифікації вже інкапсулював процес створення одноразових динамічних паролів (OTP), тому розробникам потрібно лише реалізувати логіку відправки повідомлень для взаємодії з SMS-провайдером.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options — це об'єкт конфігурації з клієнтської частини
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Реєстрація типу верифікації

Після реалізації інтерфейсу відправки його необхідно зареєструвати.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // name має відповідати тому, що використовується на клієнтській частині
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Користувацький SMS-провайдер', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```