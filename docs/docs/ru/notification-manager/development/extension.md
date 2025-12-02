:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение типов каналов уведомлений

NocoBase позволяет расширять типы каналов уведомлений по мере необходимости, например, для SMS-уведомлений или push-уведомлений в приложениях.

## Клиент

### Регистрация типа канала

Интерфейсы для настройки каналов и сообщений на стороне клиента регистрируются с помощью метода `registerChannelType`, который предоставляет клиент плагина управления уведомлениями:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Название типа канала
      type: 'example-sms', // Идентификатор типа канала
      components: {
        ChannelConfigForm, // Форма настройки канала
        MessageConfigForm, // Форма настройки сообщения
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Сервер

### Наследование от абстрактного класса

В основе разработки на стороне сервера лежит наследование от абстрактного класса `BaseNotificationChannel` и реализация метода `send`. Внутри метода `send` содержится бизнес-логика отправки уведомлений через расширяемый плагин.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Регистрация на сервере

Далее необходимо вызвать метод `registerChannelType` ядра сервера уведомлений, чтобы зарегистрировать разработанный класс реализации сервера:

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

## Полный пример

Ниже представлен полный пример расширения для уведомлений, который подробно описывает процесс разработки такого расширения.
Предположим, мы хотим добавить функцию SMS-уведомлений в NocoBase, используя SMS-шлюз сторонней платформы.

### Создание плагина

1. Выполните команду для создания плагина: `yarn pm add @nocobase/plugin-notification-example`

### Разработка клиентской части

Для клиентской части нам потребуется разработать два компонента формы: `ChannelConfigForm` (форма настройки канала) и `MessageConfigForm` (форма настройки сообщения).

#### ChannelConfigForm

Для отправки SMS-сообщений через стороннюю платформу требуются API-ключ и секрет. Поэтому наша форма настройки канала будет включать эти два поля. Создайте новый файл `ChannelConfigForm.tsx` в директории `src/client` со следующим содержимым:

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
            title: '{{t("Транспорт")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Транспорт")}}',
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

Форма настройки сообщения в основном включает конфигурацию получателей (`receivers`) и содержимого сообщения (`content`). Создайте новый файл `MessageConfigForm.tsx` в директории `src/client`. Компонент принимает `variableOptions` в качестве параметра для переменных. В настоящее время форма содержимого настраивается в узле рабочего процесса и обычно должна использовать переменные узла рабочего процесса. Конкретное содержимое файла приведено ниже:

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
            title: `{{t("Получатели")}}`,
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
                    placeholder: `{{t("Номер телефона")}}`,
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
                title: `{{t("Добавить номер телефона")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Содержимое")}}`,
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

#### Регистрация клиентских компонентов

После разработки компонентов формы настройки их необходимо зарегистрировать в ядре управления уведомлениями. Предположим, название нашей платформы — "Example". Тогда отредактированный файл `src/client/index.tsx` будет выглядеть следующим образом:

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

На этом разработка клиентской части завершена.

### Разработка серверной части

В основе разработки на стороне сервера лежит наследование от абстрактного класса `BaseNotificationChannel` и реализация метода `send`. Внутри метода `send` содержится бизнес-логика отправки уведомлений через расширяемый плагин. Поскольку это пример, мы просто выведем полученные аргументы в консоль. В директории `src/server` создайте новый файл `example-server.ts` со следующим содержимым:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

Далее необходимо вызвать метод `registerChannelType` ядра сервера уведомлений, чтобы зарегистрировать расширяемый плагин на стороне сервера. Отредактированный файл `src/server/plugin.ts` будет выглядеть следующим образом:

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

### Регистрация и запуск плагина

1. Выполните команду для регистрации плагина: `yarn pm add @nocobase/plugin-notification-example`
2. Выполните команду для включения плагина: `yarn pm enable @nocobase/plugin-notification-example`

### Настройка канала

Теперь, перейдя на страницу каналов в разделе управления уведомлениями, вы увидите, что канал `Example SMS` активирован.

![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Добавьте пример канала.

![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Создайте новый рабочий процесс и настройте узел уведомлений.

![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Запустите выполнение рабочего процесса, и вы увидите следующую информацию в консоли:

![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)