---
title: "Tài liệu tham khảo API Quản lý Thông báo"
description: "Tài liệu tham khảo API Quản lý Thông báo: BaseNotificationChannel, registerChannelType, PluginNotificationManagerServer, gửi thông báo, đăng ký kênh, cấu hình template và đăng ký người dùng."
keywords: "API quản lý thông báo,BaseNotificationChannel,registerChannelType,kênh thông báo,gửi thông báo,NocoBase"
---

# Tài liệu tham khảo API

## Server

### `BaseNotificationChannel`

Là class trừu tượng cho loại kênh người dùng, định nghĩa các interface mà kênh thông báo cần. Để mở rộng loại kênh thông báo mới, cần kế thừa class này và triển khai các phương thức trong đó.

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

Plugin server quản lý thông báo, cung cấp phương thức đăng ký loại kênh thông báo và phương thức gửi thông báo.

#### `registerChannelType()`

Đăng ký server cho loại kênh, ví dụ tham khảo

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

##### Signature

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Phương thức gửi thông báo, gọi phương thức này để gửi thông báo

```ts
send('in-app-message', 
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: 'Test in-app message',
    title: 'Title test in-app message'
  ],
  triggerFrom: 'workflow')

  send('email', 
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: 'Email test',
    title: 'Title email test'
  ],
  triggerFrom: 'workflow')
```

##### Signature

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Người nhận `receivers` hiện tại chỉ hỗ trợ hai định dạng: ID người dùng nội bộ NocoBase `userId` và cấu hình riêng của kênh `channel-self-defined`

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Chi tiết

sendConfig

| Thuộc tính         | Kiểu         |  Mô tả       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Định danh kênh   |
| `message`   | `object`   | Object tin nhắn      |
| `receivers`     | `ReceiversType`  | Người nhận |
| `triggerFrom`     | `string`  | Nguồn kích hoạt |

## Client

### `PluginNotificationManagerClient`

#### `channelTypes`

Thư viện các loại kênh đã đăng ký

##### Signature

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Đăng ký loại kênh phía client

##### Signature

`registerChannelType(params: registerTypeOptions)`

##### Kiểu

```ts
type registerTypeOptions = {
  title: string; // Tiêu đề hiển thị của kênh
  type: string;  // Định danh kênh
  components: {
    ChannelConfigForm?: ComponentType // Component form cấu hình kênh;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Component form cấu hình tin nhắn;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Component form cấu hình nội dung (chỉ là nội dung tin nhắn, không bao gồm cấu hình người nhận);
  };
  meta?: { // Meta thông tin cấu hình kênh
    createable?: boolean // Có hỗ trợ thêm kênh mới hay không;
    editable?: boolean  // Thông tin cấu hình kênh có thể chỉnh sửa hay không;
    deletable?: boolean // Thông tin cấu hình kênh có thể xóa hay không;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```
