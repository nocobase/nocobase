:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweiterung von Benachrichtigungskanal-Typen

NocoBase ermöglicht es Ihnen, Benachrichtigungskanal-Typen bei Bedarf zu erweitern, zum Beispiel für SMS-Benachrichtigungen oder App-Push-Benachrichtigungen.

## Client

### Registrierung von Kanal-Typen

Die Konfigurationsschnittstellen für Client-Kanäle und Nachrichten werden über die `registerChannelType`-Methode registriert, die vom Client des Benachrichtigungsmanagement-Plugins bereitgestellt wird:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Kanal-Typ-Name
      type: 'example-sms', // Kanal-Typ-Bezeichner
      components: {
        ChannelConfigForm, // Kanal-Konfigurationsformular
        MessageConfigForm, // Nachrichten-Konfigurationsformular
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Server

### Abstrakte Klasse erweitern

Der Kern der Server-Entwicklung besteht darin, die abstrakte Klasse `BaseNotificationChannel` zu erweitern und die `send`-Methode zu implementieren. Diese `send`-Methode enthält die Geschäftslogik für das Senden von Benachrichtigungen über das erweiterte Plugin.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Server-Registrierung

Als Nächstes müssen Sie die `registerChannelType`-Methode des Benachrichtigungs-Server-Kerns aufrufen, um die entwickelte Server-Implementierungsklasse im Kern zu registrieren:

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

## Vollständiges Beispiel

Im Folgenden wird anhand eines Beispiel-Plugins für Benachrichtigungserweiterungen detailliert beschrieben, wie Sie ein solches Erweiterungs-Plugin entwickeln können.
Angenommen, wir möchten NocoBase um eine SMS-Benachrichtigungsfunktion erweitern, indem wir ein SMS-Gateway einer bestimmten Plattform nutzen.

### Plugin-Erstellung

1. Führen Sie den Befehl zur Plugin-Erstellung aus: `yarn pm add @nocobase/plugin-notification-example`

### Client-Entwicklung

Für den Client müssen wir zwei Formular-Komponenten entwickeln: `ChannelConfigForm` (Kanal-Konfigurationsformular) und `MessageConfigForm` (Nachrichten-Konfigurationsformular).

#### ChannelConfigForm

Um SMS-Nachrichten über eine bestimmte Plattform zu versenden, sind ein API-Schlüssel und ein Secret erforderlich. Daher umfasst unser Kanal-Formular hauptsächlich diese beiden Felder. Erstellen Sie eine neue Datei namens `ChannelConfigForm.tsx` im Verzeichnis `src/client`. Der Dateiinhalt sieht wie folgt aus:

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

Das Nachrichten-Konfigurationsformular beinhaltet hauptsächlich die Konfiguration für Empfänger (`receivers`) und den Nachrichteninhalt (`content`). Erstellen Sie eine neue Datei namens `MessageConfigForm.tsx` im Verzeichnis `src/client`. Die Komponente empfängt `variableOptions` als Variablenparameter. Das Inhaltsformular wird derzeit im Workflow-Knoten konfiguriert und muss in der Regel Workflow-Knotenvariablen verarbeiten. Der spezifische Dateiinhalt sieht wie folgt aus:

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

#### Registrierung von Client-Komponenten

Nachdem die Formular-Konfigurationskomponenten entwickelt wurden, müssen diese im Kern des Benachrichtigungsmanagements registriert werden. Angenommen, der Name unserer Plattform ist "Example", dann sieht der bearbeitete Inhalt der Datei `src/client/index.tsx` wie folgt aus:

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

Damit ist die Entwicklung des Clients abgeschlossen.

### Server-Entwicklung

Der Kern der Server-Entwicklung besteht darin, die abstrakte Klasse `BaseNotificationChannel` zu erweitern und die `send`-Methode zu implementieren. Die `send`-Methode enthält die Geschäftslogik für das Senden von Benachrichtigungen durch das Erweiterungs-Plugin. Da es sich hier um ein Beispiel handelt, werden wir die empfangenen Argumente einfach ausgeben. Erstellen Sie im Verzeichnis `src/server` eine neue Datei namens `example-server.ts`. Der Dateiinhalt sieht wie folgt aus:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

Als Nächstes müssen Sie das Server-Erweiterungs-Plugin registrieren, indem Sie die `registerChannelType`-Methode des Benachrichtigungs-Server-Kerns aufrufen. Der bearbeitete Inhalt der Datei `src/server/plugin.ts` sieht wie folgt aus:

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

### Plugin-Registrierung und -Start

1. Führen Sie den Registrierungsbefehl aus: `yarn pm add @nocobase/plugin-notification-example`
2. Führen Sie den Aktivierungsbefehl aus: `yarn pm enable @nocobase/plugin-notification-example`

### Kanal-Konfiguration

Wenn Sie nun die Kanal-Seite der Benachrichtigungsverwaltung aufrufen, sehen Sie, dass der Kanal `Example SMS` aktiviert wurde.

![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Fügen Sie einen Beispiel-Kanal hinzu.

![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Erstellen Sie einen neuen Workflow und konfigurieren Sie den Benachrichtigungs-Knoten.

![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Lösen Sie die Workflow-Ausführung aus, um die folgende Ausgabe in der Konsole zu sehen.

![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)