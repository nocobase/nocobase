:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estender Provedor de SMS

Este artigo explica como estender a funcionalidade de provedor de SMS no recurso de [Verificação: SMS](../sms) através de um **plugin**.

## Cliente

### Registrar Formulário de Configuração

Ao configurar o verificador de SMS, depois de selecionar o tipo de provedor de SMS, um formulário de configuração associado a esse tipo de provedor aparecerá. Você, como desenvolvedor, precisa registrar este formulário de configuração no lado do cliente.

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

## Servidor

### Implementar Interface de Envio

O **plugin** de verificação já encapsulou o processo de criação de senhas de uso único (OTP). Assim, você, como desenvolvedor, só precisa implementar a lógica de envio para interagir com o **provedor de SMS**.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options é o objeto de configuração do cliente
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Registrar Tipo de Verificação

Depois de implementar a interface de envio, você precisa registrá-la.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // O nome precisa corresponder ao usado no cliente
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```