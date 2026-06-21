# Расширение SMS-провайдера

В этой статье объясняем, как расширить функциональность SMS-провайдера через плагин [Верификация: SMS](../sms) .

## Клиент

### Зарегистрировать форму конфигурации

При настройке SMS-вeрификатора после выбора типа SMS-провайдера появится форма конфигурации, связанная с этим типом провайдера. Эту форму конфигурации должен зарегистрировать разработчик на стороне клиента.

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

## Сервер

### Реализовать интерфейс отправки (Implement Sending Interface)

Плагин верификации уже инкапсулировал процесс создания одноразовых динамических паролей (OTP), поэтому разработчикам нужно лишь реализовать логику отправки сообщений через SMS-провайдера.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options — объект конфигурации, переданный с клиента
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Зарегистрировать тип верификации

После реализации интерфейса отправки его нужно зарегистрировать.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Имя должно соответствовать тому, которое используется на клиенте
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```