# API

## Server Side

### `BaseNotificationChannel`

This abstract class represents a base for different types of notification channels, defining essential interfaces for channel implementation. To add a new notification channel, you must extend this class and implement its methods.

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

This server-side plugin serves as a notification management tool, providing methods for registering notification channel types and sending notifications.

#### `registerChannelType()`

This method registers a new channel type on the server side. Example usage is provided below.

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

##### Signature

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

The `send` method is used to dispatch notifications via a specified channel.

```ts
send('in-app-message', 
  message: [
    receivers: [1, 2, 3],
    receiverType: 'userId',
    content: 'In-app message test',
    title: 'In-app message test title'
  ],
  triggerFrom: 'workflow')

send('email', 
  message: [
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: 'Email test',
    title: 'Email test title'
  ],
  triggerFrom: 'workflow')
```

##### Signature

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

The `receivers` field currently supports two formats: NocoBase user IDs`userId` or custom channel configurations`channel-self-defined`.

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Detailed Information

`sendConfig`

| Property       | Type             | Description              |
| -------------- | ---------------- | ------------------------ |
| `channelName`  | `string`         | Channel identifier       |
| `message`      | `object`         | Message object           |
| `receivers`    | `ReceiversType`  | Recipients               |
| `triggerFrom`  | `string`         | Source of trigger        |

## Client Side

### `PluginNotificationManagerClient`

#### `channelTypes`

The library of registered channel types.

##### Signature

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registers a client-side channel type.

##### Signature

`registerChannelType(params: registerTypeOptions)`

##### Type

```ts
type registerTypeOptions = {
  title: string; // Display title for the channel
  type: string;  // Channel identifier
  components: {
    ChannelConfigForm?: ComponentType // Channel configuration form component;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Message configuration form component;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Content configuration form component (for message content only, excluding recipient configuration);
  };
  meta?: { // Metadata for channel configuration
    createable?: boolean // Whether new channels can be added;
    editable?: boolean   // Whether channel configuration is editable;
    deletable?: boolean  // Whether channel configuration is deletable;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```
