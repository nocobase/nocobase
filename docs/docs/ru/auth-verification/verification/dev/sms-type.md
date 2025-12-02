:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение функциональности SMS-провайдера

В этой статье мы расскажем, как расширить функциональность SMS-провайдера в рамках функции [Верификация: SMS](../sms) с помощью плагина.

## Клиентская часть

### Регистрация формы конфигурации

При настройке SMS-верификатора, после выбора типа SMS-провайдера, появится форма конфигурации, связанная с этим типом. Эту форму конфигурации разработчик должен зарегистрировать на клиентской стороне.

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
        title: `{{t("Идентификатор ключа доступа", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Секретный ключ доступа", { ns: "${NAMESPACE}" })}}`,
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

## Серверная часть

### Реализация интерфейса отправки

Плагин верификации уже инкапсулировал процесс создания одноразовых паролей (OTP), поэтому разработчикам достаточно реализовать только логику отправки сообщений для взаимодействия с SMS-провайдером.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options — это объект конфигурации с клиентской стороны
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Регистрация типа верификации

После реализации интерфейса отправки его необходимо зарегистрировать.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Имя должно соответствовать тому, что используется на клиентской стороне
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Пользовательский SMS-провайдер', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```