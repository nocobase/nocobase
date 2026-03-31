:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# SMS 서비스 제공자 확장

이 문서에서는 플러그인을 통해 [인증: SMS](../sms) 기능의 SMS 서비스 제공자를 확장하는 방법을 설명합니다.

## 클라이언트

### 설정 폼 등록

사용자가 SMS 인증기를 설정할 때, SMS 서비스 제공자 유형을 선택하면 해당 유형과 관련된 설정 폼이 나타납니다. 이 설정 폼은 개발자가 클라이언트에서 직접 등록해야 합니다.

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

## 서버

### 전송 인터페이스 구현

인증 플러그인은 일회성 비밀번호(OTP) 생성 프로세스를 이미 캡슐화했습니다. 따라서 개발자는 SMS 서비스 제공자와 상호 작용하는 전송 로직만 구현하면 됩니다.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options는 클라이언트의 설정 객체입니다.
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### 인증 유형 등록

전송 인터페이스를 구현한 후에는 등록해야 합니다.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // 이름은 클라이언트와 일치해야 합니다.
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```