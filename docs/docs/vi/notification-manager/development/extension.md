:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng các loại kênh thông báo

NocoBase hỗ trợ mở rộng các loại kênh thông báo theo nhu cầu, ví dụ như thông báo SMS và thông báo đẩy ứng dụng.

## Phía Client

### Đăng ký loại kênh

Giao diện cấu hình kênh và cấu hình tin nhắn phía client được đăng ký thông qua phương thức `registerChannelType` do **plugin** quản lý thông báo phía client cung cấp:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Tên loại kênh
      type: 'example-sms', // Định danh loại kênh
      components: {
        ChannelConfigForm, // Biểu mẫu cấu hình kênh
        MessageConfigForm, // Biểu mẫu cấu hình tin nhắn
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Phía Server

### Kế thừa lớp trừu tượng

Cốt lõi của việc phát triển phía server là cần kế thừa lớp trừu tượng `BaseNotificationChannel` và triển khai phương thức `send`. Phương thức `send` chứa logic nghiệp vụ để **plugin** mở rộng gửi thông báo.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Đăng ký phía Server

Tiếp theo, cần gọi phương thức `registerChannelType` của nhân quản lý thông báo phía server để đăng ký lớp triển khai phía server đã phát triển vào nhân:

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleServer } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleServer });
  }
}

export default PluginNotificationExampleServer;
```

## Ví dụ đầy đủ

Dưới đây là một ví dụ về **plugin** mở rộng thông báo để mô tả chi tiết cách phát triển một **plugin** mở rộng.
Giả sử chúng ta muốn thêm chức năng thông báo SMS vào NocoBase bằng cách sử dụng cổng SMS của một nền tảng nào đó.

### Tạo plugin

1. Chạy lệnh để tạo **plugin**: `yarn pm add @nocobase/plugin-notification-example`

### Phát triển phía Client

Đối với phía client, chúng ta cần phát triển hai thành phần biểu mẫu: `ChannelConfigForm` (Biểu mẫu cấu hình kênh) và `MessageConfigForm` (Biểu mẫu cấu hình tin nhắn).

#### ChannelConfigForm

Để gửi tin nhắn SMS, một nền tảng yêu cầu API key và secret. Vì vậy, nội dung biểu mẫu kênh của chúng ta chủ yếu bao gồm hai mục này. Tạo một tệp mới có tên `ChannelConfigForm.tsx` trong thư mục `src/client` với nội dung như sau:

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const ChannelConfigForm = () => {
  const t = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          apiKey: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Phương thức")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Phương thức")}}',
            'x-component': 'Input',
          },
        },
      }}
    />
  );
};

export default ChannelConfigForm;
```

#### MessageConfigForm

Biểu mẫu cấu hình tin nhắn chủ yếu bao gồm cấu hình cho người nhận (`receivers`) và nội dung tin nhắn (`content`). Tạo một tệp mới có tên `MessageConfigForm.tsx` trong thư mục `src/client`. Thành phần này nhận `variableOptions` làm tham số biến. Hiện tại, biểu mẫu nội dung sẽ được cấu hình trong nút **luồng công việc**, và thường cần sử dụng các biến của nút **luồng công việc**. Nội dung tệp cụ thể như sau:

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          to: {
            type: 'array',
            required: true,
            title: `{{t("Người nhận")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Số điện thoại")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Thêm số điện thoại")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Nội dung")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.RawTextArea',
            'x-component-props': {
              scope: variableOptions,
              placeholder: 'Hi,',
              autoSize: {
                minRows: 10,
              },
            },
          },
        },
      }}
    />
  );
};

export default MessageConfigForm
```

#### Đăng ký thành phần phía Client

Sau khi phát triển xong các thành phần cấu hình biểu mẫu, cần đăng ký chúng vào nhân quản lý thông báo. Giả sử tên nền tảng của chúng ta là Example, thì nội dung tệp `src/client/index.tsx` sau khi chỉnh sửa sẽ như sau:

```ts
import { Plugin } from '@nocobase/client';
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';
import { tval } from '@nocobase/utils/client';
import ChannelConfigForm from './ChannelConfigForm';
import MessageConfigForm from './MessageConfigForm';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: tval('Example SMS', { ns: '@nocobase/plugin-notification-example' }),
      type: 'example-sms',
      components: {
        ChannelConfigForm,
        MessageConfigForm,
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

Đến đây, quá trình phát triển phía client đã hoàn tất.

### Phát triển phía Server

Cốt lõi của việc phát triển phía server là cần kế thừa lớp trừu tượng `BaseNotificationChannel` và triển khai phương thức `send`. Phương thức `send` chứa logic nghiệp vụ để **plugin** mở rộng gửi thông báo. Vì đây là một ví dụ, chúng ta sẽ chỉ đơn giản in ra các đối số đã nhận. Trong thư mục `src/server`, thêm một tệp mới có tên `example-server.ts` với nội dung như sau:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

Tiếp theo, cần gọi phương thức `registerChannelType` của nhân quản lý thông báo phía server để đăng ký **plugin** mở rộng phía server. Nội dung tệp `src/server/plugin.ts` sau khi chỉnh sửa sẽ như sau:

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleServer } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleServer });
  }
}

export default PluginNotificationExampleServer;
```

### Đăng ký và khởi chạy plugin

1. Chạy lệnh đăng ký: `yarn pm add @nocobase/plugin-notification-example`
2. Chạy lệnh kích hoạt: `yarn pm enable @nocobase/plugin-notification-example`

### Cấu hình kênh

Tại thời điểm này, khi truy cập trang kênh của quản lý thông báo, bạn có thể thấy kênh `Example SMS` đã được kích hoạt.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Thêm một kênh ví dụ.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Tạo một **luồng công việc** mới và cấu hình nút thông báo.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Kích hoạt thực thi **luồng công việc**, bạn có thể thấy thông tin sau được xuất ra trên console.
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)