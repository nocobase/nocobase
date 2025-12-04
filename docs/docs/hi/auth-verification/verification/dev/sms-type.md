:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# SMS सेवा प्रदाता का विस्तार करें

यह लेख मुख्य रूप से बताता है कि [सत्यापन: SMS](../sms) सुविधा में SMS सेवा प्रदाता कार्यक्षमता को एक प्लगइन के माध्यम से कैसे बढ़ाया जाए।

## क्लाइंट

### कॉन्फ़िगरेशन फ़ॉर्म पंजीकृत करें

SMS सत्यापनकर्ता को कॉन्फ़िगर करते समय, SMS सेवा प्रदाता का प्रकार चुनने के बाद, उस प्रदाता प्रकार से जुड़ा एक कॉन्फ़िगरेशन फ़ॉर्म दिखाई देगा। इस कॉन्फ़िगरेशन फ़ॉर्म को डेवलपर को क्लाइंट-साइड पर स्वयं पंजीकृत करना होगा।

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

## सर्वर

### भेजने वाले इंटरफ़ेस को लागू करें

सत्यापन प्लगइन ने वन-टाइम पासवर्ड (OTP) बनाने की प्रक्रिया को पहले ही एनकैप्सुलेट कर दिया है। इसलिए, डेवलपर्स को केवल SMS सेवा प्रदाता के साथ इंटरैक्ट करने के लिए संदेश भेजने का लॉजिक लागू करना होगा।

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options क्लाइंट से प्राप्त कॉन्फ़िगरेशन ऑब्जेक्ट है
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### सत्यापन प्रकार पंजीकृत करें

भेजने वाले इंटरफ़ेस को लागू करने के बाद, इसे पंजीकृत करना आवश्यक है।

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // नाम क्लाइंट पर उपयोग किए गए नाम से मेल खाना चाहिए
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```