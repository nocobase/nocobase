:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ขยายผู้ให้บริการ SMS

บทความนี้จะอธิบายหลักๆ ว่าจะขยายผู้ให้บริการ SMS ในฟังก์ชัน [การยืนยัน: SMS](../sms) ได้อย่างไรโดยใช้ปลั๊กอินครับ/ค่ะ

## ฝั่งไคลเอนต์

### ลงทะเบียนฟอร์มการตั้งค่า

เมื่อผู้ใช้ตั้งค่าตัวยืนยัน SMS หลังจากเลือกประเภทผู้ให้บริการ SMS แล้ว จะมีฟอร์มการตั้งค่าที่เกี่ยวข้องกับประเภทผู้ให้บริการนั้นๆ ปรากฏขึ้นมาครับ/ค่ะ ฟอร์มการตั้งค่านี้ นักพัฒนาจะต้องลงทะเบียนด้วยตนเองที่ฝั่งไคลเอนต์

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

## ฝั่งเซิร์ฟเวอร์

### พัฒนาอินเทอร์เฟซสำหรับส่ง

ปลั๊กอินการยืนยันได้ห่อหุ้มกระบวนการสร้างรหัสผ่านแบบใช้ครั้งเดียว (OTP) ไว้แล้วครับ/ค่ะ ดังนั้น นักพัฒนาเพียงแค่ต้องพัฒนาส่วนตรรกะการส่งข้อความเพื่อโต้ตอบกับผู้ให้บริการ SMS เท่านั้น

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options คือออบเจกต์การตั้งค่าจากฝั่งไคลเอนต์
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### ลงทะเบียนประเภทการยืนยัน

หลังจากพัฒนาอินเทอร์เฟซสำหรับส่งเสร็จแล้ว ก็จำเป็นต้องลงทะเบียนครับ/ค่ะ

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // ชื่อ (name) ต้องตรงกับที่ใช้บนฝั่งไคลเอนต์
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```