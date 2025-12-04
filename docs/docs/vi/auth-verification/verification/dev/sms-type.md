:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng nhà cung cấp dịch vụ SMS

Bài viết này chủ yếu giới thiệu cách mở rộng chức năng nhà cung cấp dịch vụ SMS trong tính năng [Xác minh: SMS](../sms) thông qua một plugin.

## Phía Client

### Đăng ký biểu mẫu cấu hình

Khi cấu hình trình xác minh SMS, sau khi chọn loại nhà cung cấp dịch vụ SMS, một biểu mẫu cấu hình liên quan đến loại nhà cung cấp đó sẽ xuất hiện. Biểu mẫu cấu hình này cần được nhà phát triển tự đăng ký ở phía client.

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

## Phía Server

### Triển khai giao diện gửi

Plugin xác minh đã đóng gói quy trình tạo mật khẩu dùng một lần (OTP), vì vậy nhà phát triển chỉ cần triển khai logic gửi tin nhắn để tương tác với nhà cung cấp dịch vụ SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options là đối tượng cấu hình từ phía client
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Đăng ký loại xác minh

Sau khi giao diện gửi được triển khai, cần tiến hành đăng ký.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // name cần phải tương ứng với phía client
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```