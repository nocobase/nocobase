:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Referencje API

## Po Stronie Serwera

### `BaseNotificationChannel`

Jest to abstrakcyjna klasa bazowa dla różnych typów kanałów powiadomień. Definiuje ona niezbędne interfejsy do implementacji kanału. Aby dodać nowy typ kanału powiadomień, należy rozszerzyć tę klasę i zaimplementować jej metody.

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

Ta wtyczka po stronie serwera służy jako narzędzie do zarządzania powiadomieniami, udostępniając metody do rejestrowania typów kanałów powiadomień oraz do wysyłania powiadomień.

#### `registerChannelType()`

Ta metoda rejestruje nowy typ kanału po stronie serwera. Poniżej znajdą Państwo przykład użycia.

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

##### Sygnatura

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Metoda `send` służy do wysyłania powiadomień za pośrednictwem określonego kanału.

```ts
// Wiadomość w aplikacji
send({
  channelName: 'in-app-message',
  message: {
    title: 'Tytuł testowej wiadomości w aplikacji',
    content: 'Testowa wiadomość w aplikacji'
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
    title: 'Tytuł testowego e-maila',
    content: 'Testowy e-mail'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Sygnatura

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Pole `receivers` obsługuje obecnie dwa formaty: identyfikatory użytkowników NocoBase (`userId`) lub niestandardowe konfiguracje kanałów (`channel-self-defined`).

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Szczegółowe informacje

`sendConfig`

| Właściwość    | Typ             | Opis               |
| ------------- | --------------- | ------------------ |
| `channelName` | `string`        | Identyfikator kanału |
| `message`     | `object`        | Obiekt wiadomości  |
| `receivers`   | `ReceiversType` | Odbiorcy           |
| `triggerFrom` | `string`        | Źródło wyzwalacza  |

## Po Stronie Klienta

### `PluginNotificationManagerClient`

#### `channelTypes`

Biblioteka zarejestrowanych typów kanałów.

##### Sygnatura

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Rejestruje typ kanału po stronie klienta.

##### Sygnatura

`registerChannelType(params: registerTypeOptions)`

##### Typ

```ts
type registerTypeOptions = {
  title: string; // Tytuł wyświetlany dla kanału
  type: string;  // Identyfikator kanału
  components: {
    ChannelConfigForm?: ComponentType // Komponent formularza konfiguracji kanału;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Komponent formularza konfiguracji wiadomości;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Komponent formularza konfiguracji treści (tylko dla treści wiadomości, bez konfiguracji odbiorców);
  };
  meta?: { // Metadane konfiguracji kanału
    createable?: boolean // Czy można dodawać nowe kanały;
    editable?: boolean  // Czy konfiguracja kanału jest edytowalna;
    deletable?: boolean // Czy konfiguracja kanału jest usuwalna;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```