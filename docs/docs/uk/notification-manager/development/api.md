:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Довідник API

## Серверна частина

### `BaseNotificationChannel`

Цей абстрактний клас є основою для різних типів каналів сповіщень. Він визначає необхідні інтерфейси для реалізації каналів. Щоб додати новий тип каналу сповіщень, вам потрібно успадкувати цей клас та реалізувати його методи.

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

Цей серверний плагін слугує інструментом для керування сповіщеннями, надаючи методи для реєстрації типів каналів сповіщень та їх надсилання.

#### `registerChannelType()`

Цей метод реєструє новий тип каналу на серверній стороні. Приклад використання наведено нижче.

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

##### Підпис

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Метод `send` використовується для надсилання сповіщень через зазначений канал.

```ts
// In-app message
send({
  channelName: 'in-app-message',
  message: {
    title: 'In-app message test title',
    content: 'In-app message test'
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
    title: 'Email test title',
    content: 'Email test'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Підпис

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Поле `receivers` наразі підтримує два формати: ідентифікатори користувачів NocoBase (`userId`) або користувацькі конфігурації каналів (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Детальна інформація

`sendConfig`

| Властивість         | Тип         |  Опис       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Ідентифікатор каналу   |
| `message`   | `object`   | Об'єкт повідомлення      |
| `receivers`     | `ReceiversType`  | Отримувачі |
| `triggerFrom`     | `string`  | Джерело спрацьовування |

## Клієнтська частина

### `PluginNotificationManagerClient`

#### `channelTypes`

Бібліотека зареєстрованих типів каналів.

##### Підпис

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Реєструє клієнтський тип каналу.

##### Підпис

`registerChannelType(params: registerTypeOptions)`

##### Тип

```ts
type registerTypeOptions = {
  title: string; // Заголовок для відображення каналу
  type: string;  // Ідентифікатор каналу
  components: {
    ChannelConfigForm?: ComponentType // Компонент форми конфігурації каналу;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент форми конфігурації повідомлення;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент форми конфігурації вмісту (лише для вмісту повідомлення, без конфігурації отримувачів);
  };
  meta?: { // Метадані конфігурації каналу
    createable?: boolean; // Чи підтримується створення нових каналів;
    editable?: boolean;  // Чи можна редагувати інформацію про конфігурацію каналу;
    deletable?: boolean; // Чи можна видаляти інформацію про конфігурацію каналу;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```