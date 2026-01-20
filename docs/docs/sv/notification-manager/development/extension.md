:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka typer av meddelandekanaler

NocoBase stöder att utöka typer av meddelandekanaler vid behov, till exempel för SMS-meddelanden och push-notiser i appar.

## Klient

### Registrering av kanaltyp

Klientens gränssnitt för kanal- och meddelandekonfiguration registreras via metoden `registerChannelType` som tillhandahålls av klienten för meddelandehanterings-**pluginen**:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Namn på kanaltyp
      type: 'example-sms', // Identifierare för kanaltyp
      components: {
        ChannelConfigForm, // Formulär för kanalkonfiguration
        MessageConfigForm, // Formulär för meddelandekonfiguration
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Server

### Ärva abstrakt klass

Kärnan i serverutvecklingen är att ärva den abstrakta klassen `BaseNotificationChannel` och implementera metoden `send`. Inuti `send`-metoden finns affärslogiken för att skicka meddelanden via den utökade **pluginen**.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Serverregistrering

Därefter behöver ni anropa metoden `registerChannelType` i meddelandeserverns kärna för att registrera den utvecklade serverimplementeringsklassen i kärnan:

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

## Komplett exempel

Här följer ett exempel på en meddelandeutökning för att i detalj beskriva hur ni utvecklar en sådan **plugin**.
Anta att vi vill lägga till SMS-meddelandefunktioner i NocoBase med hjälp av en viss plattforms SMS-gateway.

### Skapa **plugin**

1. Kör kommandot för att skapa **pluginen**: `yarn pm add @nocobase/plugin-notification-example`

### Klientutveckling

För klientdelen behöver vi utveckla två formulärkomponenter: `ChannelConfigForm` (formulär för kanalkonfiguration) och `MessageConfigForm` (formulär för meddelandekonfiguration).

#### ChannelConfigForm

När en plattform skickar SMS krävs en API-nyckel och en hemlighet (secret). Därför kommer vårt kanalformulär huvudsakligen att inkludera dessa två poster. Skapa en ny fil med namnet `ChannelConfigForm.tsx` i katalogen `src/client`. Filens innehåll är följande:

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

Formuläret för meddelandekonfiguration inkluderar huvudsakligen konfigurationen för mottagare (`receivers`) och meddelandeinnehåll (`content`). Skapa en ny fil med namnet `MessageConfigForm.tsx` i katalogen `src/client`. Komponenten tar emot `variableOptions` som en variabelparameter. Innehållsformuläret konfigureras för närvarande i **arbetsflödesnoden** och behöver vanligtvis konsumera **arbetsflödesnodvariabler**. Det specifika filinnehållet är följande:

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

#### Klientkomponentregistrering

När formulärkonfigurationskomponenterna är färdigutvecklade behöver ni registrera dem i meddelandehanteringskärnan. Anta att vår plattforms namn är "Example". Det redigerade innehållet i filen `src/client/index.tsx` är då följande:

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

Härmed är klientutvecklingen klar.

### Serverutveckling

Kärnan i serverutvecklingen är att ärva den abstrakta klassen `BaseNotificationChannel` och implementera metoden `send`. Inuti `send`-metoden finns affärslogiken för **pluginen** att skicka meddelanden. Eftersom detta är ett exempel kommer vi här bara att skriva ut de mottagna argumenten. I katalogen `src/server` lägger ni till en fil med namnet `example-server.ts`. Filens innehåll är följande:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

Därefter behöver ni anropa metoden `registerChannelType` i meddelandeserverns kärna för att registrera serverutöknings-**pluginen**. Det redigerade innehållet i filen `src/server/plugin.ts` är följande:

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

### Registrering och start av **plugin**

1. Kör registreringskommandot: `yarn pm add @nocobase/plugin-notification-example`
2. Kör aktiveringskommandot: `yarn pm enable @nocobase/plugin-notification-example`

### Kanalkonfiguration

När ni besöker sidan för kanaler under meddelandehantering kan ni se att kanalen `Example SMS` har aktiverats.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Lägg till en exempelkanal.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Skapa ett nytt **arbetsflöde** och konfigurera meddelandenoden.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Utlös **arbetsflödesexekveringen** för att se följande information i konsolen.
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)