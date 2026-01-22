:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tài liệu tham khảo API

## Phía máy chủ

### `BaseNotificationChannel`

Đây là một lớp trừu tượng cơ sở cho các loại kênh thông báo, định nghĩa các giao diện cần thiết để triển khai kênh. Để mở rộng một loại kênh thông báo mới, bạn cần kế thừa lớp này và triển khai các phương thức của nó.

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;
}
```

### `PluginNotificationManagerServer`

Plugin quản lý thông báo phía máy chủ này cung cấp các phương thức để đăng ký loại kênh thông báo và gửi thông báo.

#### `registerChannelType()`

Phương thức này dùng để đăng ký một loại kênh mới ở phía máy chủ. Tham khảo ví dụ dưới đây.

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

##### Cú pháp

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Phương thức `send` được sử dụng để gửi thông báo qua một kênh đã chỉ định.

```ts
// Tin nhắn nội bộ
send({
  channelName: 'in-app-message',
  message: {
    title: 'Tiêu đề tin nhắn nội bộ thử nghiệm',
    content: 'Tin nhắn nội bộ thử nghiệm'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// Email
send({
  channelName: 'email',
  message: {
    title: 'Tiêu đề email thử nghiệm',
    content: 'Email thử nghiệm'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@163.com', 'b@163.com']
  },
  triggerFrom: 'workflow'
});
```

##### Cú pháp

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Trường `receivers` hiện tại chỉ hỗ trợ hai định dạng: ID người dùng NocoBase `userId` hoặc cấu hình kênh tùy chỉnh `channel-self-defined`.

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Thông tin chi tiết

`sendConfig`

| Thuộc tính         | Kiểu         |  Mô tả       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Định danh kênh   |
| `message`   | `object`   | Đối tượng tin nhắn      |
| `receivers`     | `ReceiversType`  | Người nhận |
| `triggerFrom`     | `string`  | Nguồn kích hoạt |

## Phía máy khách

### `PluginNotificationManagerClient`

#### `channelTypes`

Thư viện các loại kênh đã đăng ký.

##### Cú pháp

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Đăng ký một loại kênh phía máy khách.

##### Cú pháp

`registerChannelType(params: registerTypeOptions)`

##### Kiểu

```ts
type registerTypeOptions = {
  title: string; // Tiêu đề hiển thị của kênh
  type: string;  // Định danh kênh
  components: {
    ChannelConfigForm?: ComponentType // Thành phần biểu mẫu cấu hình kênh;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Thành phần biểu mẫu cấu hình tin nhắn;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Thành phần biểu mẫu cấu hình nội dung (chỉ nội dung tin nhắn, không bao gồm cấu hình người nhận);
  };
  meta?: { // Siêu dữ liệu cấu hình kênh
    createable?: boolean; // Có hỗ trợ thêm kênh mới không;
    editable?: boolean;  // Thông tin cấu hình kênh có thể chỉnh sửa không;
    deletable?: boolean; // Thông tin cấu hình kênh có thể xóa không;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```