:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extender un proveedor de servicios SMS

Este artículo explica cómo puede extender la funcionalidad de los proveedores de servicios SMS en la característica de [Verificación: SMS](../sms) a través de un **plugin**.

## Cliente

### Registrar el formulario de configuración

Cuando configure el verificador de SMS, después de seleccionar un tipo de proveedor de servicios SMS, aparecerá un formulario de configuración asociado a ese tipo de proveedor. Este formulario de configuración debe ser registrado por el desarrollador en el lado del cliente.

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

### Implementar la interfaz de envío

El **plugin** de verificación ya ha encapsulado el proceso de creación de contraseñas dinámicas de un solo uso (OTP). Por lo tanto, los desarrolladores solo necesitan implementar la lógica de envío para interactuar con el proveedor de servicios SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options es el objeto de configuración del cliente
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Registrar el tipo de verificación

Una vez que la interfaz de envío esté implementada, deberá registrarla.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // El nombre debe corresponder con el utilizado en el cliente
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```