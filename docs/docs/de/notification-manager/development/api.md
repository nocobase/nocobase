:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# API-Referenz

## Serverseitig

### `BaseNotificationChannel`

`BaseNotificationChannel` ist eine abstrakte Klasse, die als Grundlage für verschiedene Arten von Benachrichtigungskanälen dient. Sie definiert die notwendigen Schnittstellen für die Kanalimplementierung. Um einen neuen Benachrichtigungskanal hinzuzufügen, müssen Sie diese Klasse erweitern und ihre Methoden implementieren.

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

Dieses serverseitige **Plugin** dient als Benachrichtigungsmanagement-Tool und stellt Methoden zur Registrierung von Benachrichtigungskanal-Typen sowie zum Versenden von Benachrichtigungen bereit.

#### `registerChannelType()`

Diese Methode registriert einen neuen Kanal-Typ auf der Serverseite. Ein Anwendungsbeispiel finden Sie unten.

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

##### Signatur

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Die `send`-Methode wird verwendet, um Benachrichtigungen über einen bestimmten Kanal zu versenden.

```ts
// In-App-Nachricht
send({
  channelName: 'in-app-message',
  message: {
    title: 'Titel der Test-Nachricht im System',
    content: 'Test-Nachricht im System'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// E-Mail
send({
  channelName: 'email',
  message: {
    title: 'E-Mail-Testtitel',
    content: 'E-Mail-Test'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@163.com', 'b@163.com']
  },
  triggerFrom: 'workflow'
});
```

##### Signatur

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Das Feld `receivers` unterstützt derzeit zwei Formate: NocoBase Benutzer-IDs (`userId`) oder kanalspezifische Konfigurationen (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Detaillierte Informationen

`sendConfig`

| Property      | Type            | Beschreibung               |
| ------------- | --------------- | -------------------------- |
| `channelName` | `string`        | Kanal-Identifikator        |
| `message`     | `object`        | Nachrichtenobjekt          |
| `receivers`   | `ReceiversType` | Empfänger                  |
| `triggerFrom` | `string`        | Auslöserquelle             |

## Clientseitig

### `PluginNotificationManagerClient`

#### `channelTypes`

Die Bibliothek der registrierten Kanal-Typen.

##### Signatur

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registriert einen clientseitigen Kanal-Typ.

##### Signatur

`registerChannelType(params: registerTypeOptions)`

##### Typ

```ts
type registerTypeOptions = {
  title: string; // Anzeigename für den Kanal
  type: string; // Kanal-Identifikator
  components: {
    ChannelConfigForm?: ComponentType; // Formular-Komponente für die Kanal-Konfiguration;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Formular-Komponente für die Nachrichten-Konfiguration;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Formular-Komponente für die Inhalts-Konfiguration (nur für den Nachrichteninhalts, ohne Empfänger-Konfiguration);
  };
  meta?: {
    // Metadaten für die Kanal-Konfiguration
    createable?: boolean; // Gibt an, ob neue Kanäle hinzugefügt werden können;
    editable?: boolean; // Gibt an, ob die Kanal-Konfiguration bearbeitbar ist;
    deletable?: boolean; // Gibt an, ob die Kanal-Konfiguration löschbar ist;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```