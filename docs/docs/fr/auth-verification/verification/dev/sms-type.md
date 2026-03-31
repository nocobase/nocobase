:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Étendre les fournisseurs de services SMS

Cet article explique comment étendre la fonctionnalité des fournisseurs de services SMS dans la fonction [Vérification : SMS](../sms) via un plugin.

## Client

### Enregistrer le formulaire de configuration

Lorsque vous configurez le vérificateur SMS, après avoir sélectionné un type de fournisseur de services SMS, un formulaire de configuration associé à ce type de fournisseur apparaît. Ce formulaire de configuration doit être enregistré par le développeur côté client.

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
        title: `{{t("ID de clé d'accès", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Clé secrète d'accès", { ns: "${NAMESPACE}" })}}`,
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

## Serveur

### Implémenter l'interface d'envoi

Le plugin de vérification a déjà encapsulé le processus de création de mots de passe à usage unique (OTP). Les développeurs n'ont donc qu'à implémenter la logique d'envoi des messages pour interagir avec le fournisseur de services SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options est l'objet de configuration du client
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Enregistrer le type de vérification

Une fois l'interface d'envoi implémentée, vous devez l'enregistrer.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // Le nom doit correspondre à celui utilisé côté client
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Fournisseur de services SMS personnalisé', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```