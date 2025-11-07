# API参考

## 服务端

### `BaseNotificationChannel`

是用户渠道类型的抽象类，定义了通知渠道需要的接口，扩展新的通知渠道类型需要继承此类，并实现其中的方法

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

通知管理服务端插件，提供通知渠道类型注册方法和通知下发方法。

#### `registerChannelType()`

注册渠道类型的服务端，参考样例

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

##### 签名

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

通知下发方法，调用此方法可下发通知

```ts
send('in-app-message', 
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: '站内信测试',
    title: '站内信测试标题'
  ],
  triggerFrom: 'workflow')

  send('email', 
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: '邮箱测试',
    title: '邮箱测试标题'
  ],
  triggerFrom: 'workflow')
```

##### 签名

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

接收人`receivers`目前只支持两种格式：NocoBase站内用户ID`userId`和渠道特定配置`channel-self-defined`

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### 详细信息

sendConfig

| 属性         | 类型         |  描述       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | 渠道标识   |
| `message`   | `object`   | 消息对象      |
| `receivers`     | `ReceiversType`  | 接收人 |
| `triggerFrom`     | `string`  | 触发来源 |

## 客户端

### `PluginNotificationManagerClient`

#### `channelTypes`

已注册渠道类型库

##### 签名

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

注册客户端渠道类型

##### 签名

`registerChannelType(params: registerTypeOptions)`

##### 类型

```ts
type registerTypeOptions = {
  title: string; // 渠道显示标题
  type: string;  // 渠道标识
  components: {
    ChannelConfigForm?: ComponentType // 渠道配置表单组件;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // 消息配置表单组件;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // 内容配置表单组件（只是消息内容，不包括接收人的配置）;
  };
  meta?: { // 渠道配置元信息
    createable?: boolean //是否支持新增渠道;
    editable?: boolean  //渠道配置信息是否可编辑;
    deletable?: boolean //渠道配置信息是否可删除;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```
