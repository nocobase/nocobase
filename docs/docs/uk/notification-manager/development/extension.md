:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розширення типів каналів сповіщень

NocoBase підтримує розширення типів каналів сповіщень за потребою, наприклад, для SMS-повідомлень та push-сповіщень у застосунках.

## Клієнтська частина

### Реєстрація типу каналу

Інтерфейс конфігурації клієнтського каналу та конфігурації повідомлень реєструється за допомогою методу `registerChannelType`, який надається клієнтською частиною плагіна управління сповіщеннями:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Назва типу каналу
      type: 'example-sms', // Ідентифікатор типу каналу
      components: {
        ChannelConfigForm, // Форма конфігурації каналу
        MessageConfigForm, // Форма конфігурації повідомлення
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Серверна частина

### Успадкування абстрактного класу

Основою розробки серверної частини є успадкування абстрактного класу `BaseNotificationChannel` та реалізація методу `send`. Метод `send` містить бізнес-логіку для надсилання сповіщень через розширений плагін.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Реєстрація на сервері

Далі потрібно викликати метод `registerChannelType` ядра серверної частини сповіщень, щоб зареєструвати розроблений клас реалізації серверної частини в ядрі:

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

## Повний приклад

Нижче наведено приклад розширення сповіщень, щоб детально описати, як розробити такий розширений плагін.
Припустімо, що ми хочемо додати функціонал SMS-сповіщень до NocoBase, використовуючи SMS-шлюз певної платформи.

### Створення плагіна

1. Виконайте команду для створення плагіна: `yarn pm add @nocobase/plugin-notification-example`

### Розробка клієнтської частини

Для клієнтської частини нам потрібно розробити два компоненти форми: `ChannelConfigForm` (форма конфігурації каналу) та `MessageConfigForm` (форма конфігурації повідомлення).

#### ChannelConfigForm

Для надсилання SMS-повідомлень певна платформа вимагає API-ключ та секретний ключ. Тому наша форма каналу в основному включатиме ці два пункти. Створіть новий файл `ChannelConfigForm.tsx` у каталозі `src/client` з таким вмістом:

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
            title: '{{t("Transport")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
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

Форма конфігурації повідомлень в основному включає налаштування одержувачів (`receivers`) та вмісту повідомлення (`content`). Створіть новий файл `MessageConfigForm.tsx` у каталозі `src/client`. Компонент приймає `variableOptions` як змінний параметр. Наразі форма вмісту конфігурується у вузлі робочого процесу і зазвичай потребує використання змінних вузла робочого процесу. Конкретний вміст файлу такий:

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
            title: `{{t("Receivers")}}`,
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
                    placeholder: `{{t("Phone number")}}`,
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
                title: `{{t("Add phone number")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Content")}}`,
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

#### Реєстрація клієнтського компонента

Після розробки компонентів конфігурації форми їх потрібно зареєструвати в ядрі управління сповіщеннями. Припустімо, що назва нашої платформи — Example. Тоді відредагований файл `src/client/index.tsx` матиме такий вміст:

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

На цьому розробку клієнтської частини завершено.

### Розробка серверної частини

Основою розробки серверної частини є успадкування абстрактного класу `BaseNotificationChannel` та реалізація методу `send`. Метод `send` містить бізнес-логіку для надсилання сповіщень через розширений плагін. Оскільки це приклад, ми просто виведемо отримані аргументи. У каталозі `src/server` додайте файл `example-server.ts` з таким вмістом:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

Далі потрібно зареєструвати розширений плагін серверної частини, викликавши метод `registerChannelType` ядра серверної частини сповіщень. Відредагований файл `src/server/plugin.ts` матиме такий вміст:

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(
      PluginNotificationManagerServer,
    ) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({
      type: 'example-sms',
      Channel: ExampleSever,
    });
  }
}

export default PluginNotificationExampleServer;
```

### Реєстрація та запуск плагіна

1. Виконайте команду реєстрації: `yarn pm add @nocobase/plugin-notification-example`
2. Виконайте команду активації: `yarn pm enable @nocobase/plugin-notification-example`

### Конфігурація каналу

Тепер, відвідавши сторінку каналів управління сповіщеннями, ви побачите, що канал `Example SMS` активовано.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Додайте зразковий канал.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Створіть новий робочий процес і налаштуйте вузол сповіщення.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Запустіть виконання робочого процесу, і ви побачите наступну інформацію у виводі консолі:
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)