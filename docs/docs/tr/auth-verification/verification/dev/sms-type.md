:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# SMS Sağlayıcısını Genişletme

Bu makale, [Doğrulama: SMS](../sms) özelliğindeki SMS sağlayıcı işlevselliğini bir eklenti aracılığıyla nasıl genişleteceğinizi açıklamaktadır.

## İstemci

### Yapılandırma Formunu Kaydetme

SMS doğrulayıcıyı yapılandırırken, bir SMS sağlayıcı türü seçtikten sonra, o sağlayıcı türüyle ilişkili bir yapılandırma formu görünecektir. Bu yapılandırma formunun geliştirici tarafından istemci tarafında kaydedilmesi gerekmektedir.

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

## Sunucu

### Gönderme Arayüzünü Uygulama

Doğrulama eklentisi, tek kullanımlık dinamik şifreler (OTP) oluşturma sürecini zaten kapsüllemiştir. Bu nedenle, geliştiricilerin yalnızca SMS sağlayıcısıyla etkileşim kurmak için mesaj gönderme mantığını uygulaması yeterlidir.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options istemciden gelen yapılandırma nesnesidir
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Doğrulama Türünü Kaydetme

Gönderme arayüzü uygulandıktan sonra, kaydedilmesi gerekmektedir.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // name, istemcide kullanılan adla eşleşmelidir
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```