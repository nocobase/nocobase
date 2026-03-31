:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Справочник API

## Серверная часть

### `BaseNotificationChannel`

Это абстрактный класс, который служит основой для различных типов каналов уведомлений. Он определяет необходимые интерфейсы для реализации каналов. Чтобы добавить новый тип канала уведомлений, вам нужно унаследовать этот класс и реализовать его методы.

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{
    message: Message;
    status: 'success' | 'fail';
    reason?: string;
  }>;
}
```

### `PluginNotificationManagerServer`

Этот серверный плагин (plugin) предназначен для управления уведомлениями. Он предоставляет методы для регистрации типов каналов уведомлений и отправки самих уведомлений.

#### `registerChannelType()`

Этот метод регистрирует новый тип канала на серверной стороне. Пример использования приведён ниже.

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleServer } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(
      PluginNotificationManagerServer,
    ) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({
      type: 'example-sms',
      Channel: ExampleServer,
    });
  }
}

export default PluginNotificationExampleServer;
```

##### Сигнатура

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Метод `send` используется для отправки уведомлений через указанный канал.

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

##### Сигнатура

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Поле `receivers` в настоящее время поддерживает два формата: идентификаторы пользователей NocoBase (`userId`) или пользовательские конфигурации канала (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Подробная информация

`sendConfig`

| Свойство      | Тип             | Описание             |
| ------------- | --------------- | -------------------- |
| `channelName` | `string`        | Идентификатор канала |
| `message`     | `object`        | Объект сообщения     |
| `receivers`   | `ReceiversType` | Получатели           |
| `triggerFrom` | `string`        | Источник срабатывания|

## Клиентская часть

### `PluginNotificationManagerClient`

#### `channelTypes`

Библиотека зарегистрированных типов каналов.

##### Сигнатура

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Регистрирует тип канала на клиентской стороне.

##### Сигнатура

`registerChannelType(params: registerTypeOptions)`

##### Тип

```ts
type registerTypeOptions = {
  title: string; // Заголовок канала для отображения
  type: string; // Идентификатор канала
  components: {
    ChannelConfigForm?: ComponentType; // Компонент формы для настройки канала;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент формы для настройки сообщения;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент формы для настройки содержимого (только для содержимого сообщения, без учёта настроек получателей);
  };
  meta?: {
    // Метаданные для настройки канала
    createable?: boolean; // Поддерживает ли добавление новых каналов;
    editable?: boolean; // Можно ли редактировать настройки канала;
    deletable?: boolean; // Можно ли удалить настройки канала;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```