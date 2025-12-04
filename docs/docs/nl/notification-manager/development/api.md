:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API-referentie

## Serverzijde

### `BaseNotificationChannel`

Dit is een abstracte klasse die dient als basis voor verschillende typen notificatiekanalen. Het definieert de essentiële interfaces die nodig zijn voor de implementatie van een kanaal. Om een nieuw notificatiekanaal toe te voegen, moet u deze klasse uitbreiden en de methoden ervan implementeren.

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

Deze server-side **plugin** functioneert als een tool voor notificatiebeheer. Het biedt methoden voor het registreren van notificatiekanaaltypen en het verzenden van notificaties.

#### `registerChannelType()`

Deze methode registreert een nieuw kanaaltype aan de serverzijde. Hieronder vindt u een voorbeeld van het gebruik.

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

##### Handtekening

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

De `send`-methode wordt gebruikt om notificaties via een gespecificeerd kanaal te verzenden.

```ts
// In-app bericht
send({
  channelName: 'in-app-message',
  message: {
    title: 'Titel in-app bericht test',
    content: 'In-app bericht test'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// E-mail
send({
  channelName: 'email',
  message: {
    title: 'Titel e-mail test',
    content: 'E-mail test'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Handtekening

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Het veld `receivers` ondersteunt momenteel twee formaten: NocoBase gebruikers-ID's (`userId`) of aangepaste kanaalconfiguraties (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Gedetailleerde informatie

`sendConfig`

| Eigenschap      | Type            | Beschrijving        |
| ------------- | --------------- | ------------------ |
| `channelName` | `string`        | Kanaal-ID          |
| `message`     | `object`        | Berichtobject      |
| `receivers`   | `ReceiversType` | Ontvangers         |
| `triggerFrom` | `string`        | Bron van trigger   |

## Clientzijde

### `PluginNotificationManagerClient`

#### `channelTypes`

De bibliotheek met geregistreerde kanaaltypen.

##### Handtekening

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registreert een client-side kanaaltype.

##### Handtekening

`registerChannelType(params: registerTypeOptions)`

##### Type

```ts
type registerTypeOptions = {
  title: string; // Weergavetitel voor het kanaal
  type: string; // Kanaal-ID
  components: {
    ChannelConfigForm?: ComponentType; // Component voor het kanaalconfiguratieformulier;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Component voor het berichtconfiguratieformulier;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Component voor het inhoudsconfiguratieformulier (alleen voor berichtinhoud, exclusief ontvangerconfiguratie);
  };
  meta?: {
    // Metadata voor kanaalconfiguratie
    createable?: boolean; // Geeft aan of nieuwe kanalen kunnen worden toegevoegd;
    editable?: boolean; // Geeft aan of de kanaalconfiguratie bewerkbaar is;
    deletable?: boolean; // Geeft aan of de kanaalconfiguratie verwijderbaar is;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```