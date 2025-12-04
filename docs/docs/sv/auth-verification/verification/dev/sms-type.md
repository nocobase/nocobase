:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka SMS-leverantör

Den här artikeln beskriver hur du kan utöka funktionaliteten för SMS-leverantörer i [Verifiering: SMS](../sms) med hjälp av ett plugin.

## Klient

### Registrera konfigurationsformulär

När ni konfigurerar SMS-verifieraren och har valt en SMS-leverantörstyp, visas ett konfigurationsformulär som är kopplat till den valda typen. Detta formulär måste utvecklaren själv registrera på klientsidan.

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

## Server

### Implementera sändningsgränssnittet

Verifieringspluginet har redan kapslat in processen för att skapa engångslösenord (OTP). Utvecklare behöver därför bara implementera logiken för att skicka meddelanden och interagera med SMS-leverantören.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options är konfigurationsobjektet från klienten
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Registrera verifieringstyp

När sändningsgränssnittet är implementerat behöver det registreras.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Namnet måste motsvara det som används på klienten
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```