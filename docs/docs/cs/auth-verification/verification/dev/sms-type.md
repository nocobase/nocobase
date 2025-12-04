:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření poskytovatele SMS služeb

V tomto článku se dozvíte, jak rozšířit funkcionalitu poskytovatele SMS služeb ve funkci [Ověření: SMS](../sms) pomocí pluginu.

## Klient

### Registrace konfiguračního formuláře

Při konfiguraci ověřovače SMS se po výběru typu poskytovatele SMS služeb zobrazí konfigurační formulář spojený s tímto typem poskytovatele. Tento formulář je potřeba, aby vývojář zaregistroval na straně klienta.

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

### Implementace rozhraní pro odesílání

Plugin pro ověřování již zapouzdřil proces vytváření jednorázových dynamických hesel (OTP). Vývojáři tak stačí implementovat pouze logiku pro odesílání zpráv, která bude komunikovat s poskytovatelem SMS služeb.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options je konfigurační objekt z klienta
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Registrace typu ověření

Jakmile je rozhraní pro odesílání implementováno, je potřeba ho zaregistrovat.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Název musí odpovídat tomu, který je použit na straně klienta
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```