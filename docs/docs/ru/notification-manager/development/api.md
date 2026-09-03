# Справочник API

## Серверная часть

### `BaseNotificationChannel`

Этот абстрактный класс представляет основу для различных типов каналов уведомлений и определяет ключевые интерфейсы для реализации канала. Чтобы добавить новый канал уведомлений, необходимо унаследоваться от этого класса и реализовать его методы.

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

Этот серверный плагин служит инструментом управления уведомлениями: он предоставляет методы для регистрации типов каналов уведомлений и отправки уведомлений.

#### `registerChannelType()`

Этот метод регистрирует новый тип канала на стороне сервера. Пример использования приведён ниже.

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
// Сообщение в приложении
send({
  channelName: 'in-app-message',
  message: {
    title: 'Тестовый заголовок встроенного сообщения',
    content: 'Тест встроенного сообщения'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// Электронная почта
send({
  channelName: 'email',
  message: {
    title: 'Тестовый заголовок письма',
    content: 'Тест письма'
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

Поле `receivers` сейчас поддерживает два формата: идентификаторы пользователей NocoBase `userId` или пользовательские конфигурации канала `channel-self-defined`.

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Подробная информация

`sendConfig`

| Свойство      | Тип             | Описание                   |
| ------------- | --------------- | -------------------------- |
| `channelName` | `string`        | Идентификатор канала       |
| `message`     | `object`        | Объект сообщения           |
| `receivers`   | `ReceiversType` | Получатели                 |
| `triggerFrom` | `string`        | Источник запуска триггера  |

## Клиентская часть

### `PluginNotificationManagerClient`

#### `channelTypes`

Реестр зарегистрированных типов каналов.

##### Сигнатура

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Регистрирует тип канала на стороне клиента.

##### Сигнатура

`registerChannelType(params: registerTypeOptions)`

##### Тип

```ts
type registerTypeOptions = {
  title: string; // Отображаемое название канала
  type: string; // Идентификатор канала
  components: {
    ChannelConfigForm?: ComponentType; // Компонент формы настройки канала
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент формы настройки сообщения
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Компонент формы настройки содержимого (только содержимое сообщения, без настройки получателей)
  };
  meta?: {
    // Метаданные для конфигурации канала
    createable?: boolean; // Можно ли добавлять новые каналы
    editable?: boolean; // Можно ли редактировать конфигурацию канала
    deletable?: boolean; // Можно ли удалять конфигурацию канала
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```