:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie dostawców usług SMS

Ten artykuł wyjaśnia, jak rozszerzyć funkcjonalność dostawców usług SMS w ramach funkcji [Weryfikacja: SMS](../sms) za pomocą **wtyczki**.

## Strona kliencka

### Rejestracja formularza konfiguracji

Podczas konfigurowania weryfikatora SMS, po wybraniu typu dostawcy usług SMS, pojawi się formularz konfiguracji powiązany z tym typem. Ten formularz konfiguracji musi zostać zarejestrowany przez dewelopera na stronie klienckiej.

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

## Strona serwerowa

### Implementacja interfejsu wysyłania

**Wtyczka** weryfikacji już opakowała proces tworzenia jednorazowych haseł dynamicznych (OTP), więc deweloperzy muszą jedynie zaimplementować logikę wysyłania wiadomości, aby móc komunikować się z dostawcą usług SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options to obiekt konfiguracyjny ze strony klienckiej
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Rejestracja typu weryfikacji

Po zaimplementowaniu interfejsu wysyłania należy go zarejestrować.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Nazwa musi odpowiadać tej użytej na stronie klienckiej
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```