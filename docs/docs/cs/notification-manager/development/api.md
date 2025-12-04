:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Referenční příručka API

## Na straně serveru

### `BaseNotificationChannel`

Jedná se o abstraktní třídu, která slouží jako základ pro různé typy notifikačních kanálů. Definuje základní rozhraní potřebná pro implementaci kanálu. Chcete-li přidat nový typ notifikačního kanálu, musíte tuto třídu rozšířit a implementovat její metody.

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

Tento serverový plugin slouží jako nástroj pro správu notifikací a poskytuje metody pro registraci typů notifikačních kanálů a odesílání notifikací.

#### `registerChannelType()`

Tato metoda registruje nový typ kanálu na straně serveru. Příklad použití naleznete níže.

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

##### Signatura

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Metoda `send` slouží k odesílání notifikací prostřednictvím specifikovaného kanálu.

```ts
// Zpráva v aplikaci
send({
  channelName: 'in-app-message',
  message: {
    title: 'Nadpis testu zprávy v aplikaci',
    content: 'Test zprávy v aplikaci'
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
    title: 'Nadpis testu e-mailu',
    content: 'Test e-mailu'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Signatura

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Pole `receivers` aktuálně podporuje dva formáty: ID uživatelů NocoBase (`userId`) nebo vlastní konfigurace kanálu (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Podrobné informace

`sendConfig`

| Vlastnost     | Typ             | Popis                  |
| ------------- | --------------- | ---------------------- |
| `channelName` | `string`        | Identifikátor kanálu   |
| `message`     | `object`        | Objekt zprávy          |
| `receivers`   | `ReceiversType` | Příjemci               |
| `triggerFrom` | `string`        | Zdroj spouštění        |

## Na straně klienta

### `PluginNotificationManagerClient`

#### `channelTypes`

Knihovna registrovaných typů kanálů.

##### Signatura

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registruje typ kanálu na straně klienta.

##### Signatura

`registerChannelType(params: registerTypeOptions)`

##### Typ

```ts
type registerTypeOptions = {
  title: string; // Zobrazovaný název kanálu
  type: string; // Identifikátor kanálu
  components: {
    ChannelConfigForm?: ComponentType; // Komponenta formuláře pro konfiguraci kanálu;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Komponenta formuláře pro konfiguraci zprávy;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Komponenta formuláře pro konfiguraci obsahu (pouze pro obsah zprávy, bez konfigurace příjemců);
  };
  meta?: {
    // Metadata pro konfiguraci kanálu
    createable?: boolean; // Zda lze přidávat nové kanály;
    editable?: boolean; // Zda je konfigurace kanálu editovatelná;
    deletable?: boolean; // Zda je konfigurace kanálu smazatelná;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```