:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# API-referens

## Serversidan

### `BaseNotificationChannel`

`BaseNotificationChannel` är en abstrakt klass som fungerar som grund för olika typer av meddelandekanaler. Den definierar de nödvändiga gränssnitten för kanalimplementering. För att lägga till en ny meddelandekanal måste ni ärva från denna klass och implementera dess metoder.

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

Detta är en `plugin` på serversidan för meddelandehantering. Den tillhandahåller metoder för att registrera meddelandekanaltyper och skicka meddelanden.

#### `registerChannelType()`

Denna metod registrerar en ny kanaltyp på serversidan. Ett exempel på användning finns nedan.

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

##### Signatur

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Metoden `send()` används för att skicka meddelanden via en specificerad kanal.

```ts
// Meddelande i appen
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

// E-post
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

##### Signatur

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Fältet `receivers` stöder för närvarande två format: NocoBase användar-ID:n (`userId`) eller anpassade kanalkonfigurationer (`channel-self-defined`).

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Detaljerad information

`sendConfig`

| Egenskap         | Typ         |  Beskrivning       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Kanalidentifierare   |
| `message`   | `object`   | Meddelandeobjekt      |
| `receivers`     | `ReceiversType`  | Mottagare |
| `triggerFrom`     | `string`  | Utlösande källa |

## Klientsidan

### `PluginNotificationManagerClient`

#### `channelTypes`

Biblioteket med registrerade kanaltyper.

##### Signatur

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registrerar en kanaltyp på klientsidan.

##### Signatur

`registerChannelType(params: registerTypeOptions)`

##### Typ

```ts
type registerTypeOptions = {
  title: string; // Visningsrubrik för kanalen
  type: string;  // Kanalidentifierare
  components: {
    ChannelConfigForm?: ComponentType // Komponent för kanalens konfigurationsformulär;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Komponent för meddelandets konfigurationsformulär;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Komponent för innehållskonfigurationsformulär (endast för meddelandeinnehåll, exklusive mottagarkonfiguration);
  };
  meta?: { // Metadata för kanalkonfiguration
    createable?: boolean // Anger om nya kanaler kan läggas till;
    editable?: boolean  // Anger om kanalkonfigurationen är redigerbar;
    deletable?: boolean // Anger om kanalkonfigurationen kan tas bort;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```