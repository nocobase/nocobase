:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie typów kanałów powiadomień

NocoBase umożliwia rozszerzanie typów kanałów powiadomień zgodnie z potrzebami, na przykład o powiadomienia SMS czy powiadomienia push w aplikacjach.

## Klient

### Rejestracja typu kanału

Interfejs konfiguracji kanału klienta oraz konfiguracji wiadomości rejestruje się za pomocą metody `registerChannelType` dostarczanej przez klienta wtyczki do zarządzania powiadomieniami:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Nazwa typu kanału
      type: 'example-sms', // Identyfikator typu kanału
      components: {
        ChannelConfigForm, // Formularz konfiguracji kanału
        MessageConfigForm, // Formularz konfiguracji wiadomości
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Serwer

### Rozszerzanie klasy abstrakcyjnej

Kluczowym elementem rozwoju po stronie serwera jest rozszerzenie abstrakcyjnej klasy `BaseNotificationChannel` i zaimplementowanie metody `send`. Metoda `send` zawiera logikę biznesową odpowiedzialną za wysyłanie powiadomień przez rozszerzoną wtyczkę.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Rejestracja serwera

Następnie należy wywołać metodę `registerChannelType` jądra serwera powiadomień, aby zarejestrować w nim zaimplementowaną klasę serwera:

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

## Pełny przykład

Poniżej przedstawiamy przykładową wtyczkę rozszerzającą powiadomienia, aby szczegółowo opisać, jak ją stworzyć. Załóżmy, że chcemy dodać funkcję powiadomień SMS do NocoBase, korzystając z bramki SMS wybranej platformy.

### Tworzenie wtyczki

1. Proszę uruchomić polecenie tworzenia wtyczki: `yarn pm add @nocobase/plugin-notification-example`

### Rozwój po stronie klienta

Po stronie klienta musimy opracować dwa komponenty formularzy: `ChannelConfigForm` (formularz konfiguracji kanału) i `MessageConfigForm` (formularz konfiguracji wiadomości).

#### ChannelConfigForm

Aby wysyłać wiadomości SMS, wymagane są klucz API i sekret. Proszę utworzyć nowy plik `ChannelConfigForm.tsx` w katalogu `src/client`. Zawartość pliku powinna być następująca:

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

Formularz konfiguracji wiadomości obejmuje głównie konfigurację odbiorców (`receivers`) i treści wiadomości (`content`). Proszę utworzyć nowy plik `MessageConfigForm.tsx` w katalogu `src/client`. Komponent przyjmuje `variableOptions` jako parametr zmiennej. Formularz treści jest konfigurowany w węźle przepływu pracy i zazwyczaj wymaga wykorzystania zmiennych węzła przepływu pracy. Poniżej przedstawiono zawartość pliku:

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
            title: `{{t("Odbiorcy")}}`,
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
                    placeholder: `{{t("Numer telefonu")}}`,
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
                title: `{{t("Dodaj numer telefonu")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Treść")}}`,
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

#### Rejestracja komponentu klienta

Po opracowaniu komponentów konfiguracji formularzy należy je zarejestrować w jądrze zarządzania powiadomieniami. Zakładając, że nazwa naszej platformy to „Example”, edytowany plik `src/client/index.tsx` powinien wyglądać następująco:

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

W tym momencie rozwój po stronie klienta został zakończony.

### Rozwój po stronie serwera

Kluczowym elementem rozwoju po stronie serwera jest rozszerzenie abstrakcyjnej klasy `BaseNotificationChannel` i zaimplementowanie metody `send`. Metoda `send` zawiera logikę biznesową wtyczki rozszerzającej do wysyłania powiadomień. Ponieważ jest to przykład, po prostu wyświetlimy otrzymane argumenty. Proszę dodać plik `example-server.ts` w katalogu `src/server`. Zawartość pliku powinna być następująca:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

Następnie należy zarejestrować wtyczkę rozszerzającą serwera, wywołując metodę `registerChannelType` jądra serwera powiadomień. Edytowany plik `src/server/plugin.ts` powinien wyglądać następująco:

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

### Rejestracja i uruchomienie wtyczki

1. Proszę uruchomić polecenie rejestracji: `yarn pm add @nocobase/plugin-notification-example`
2. Proszę uruchomić polecenie włączania: `yarn pm enable @nocobase/plugin-notification-example`

### Konfiguracja kanału

Po przejściu na stronę kanałów zarządzania powiadomieniami zobaczą Państwo, że kanał `Example SMS` został włączony.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Proszę dodać przykładowy kanał.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Proszę utworzyć nowy przepływ pracy i skonfigurować węzeł powiadomień.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Proszę uruchomić wykonanie przepływu pracy, aby zobaczyć następujące informacje w konsoli.
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)