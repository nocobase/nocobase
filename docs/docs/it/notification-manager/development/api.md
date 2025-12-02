:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Riferimento API

## Lato Server

### `BaseNotificationChannel`

Questa classe astratta funge da base per i diversi tipi di canali di notifica. Definisce le interfacce essenziali per l'implementazione di un canale. Per aggiungere un nuovo tipo di canale di notifica, è necessario estendere questa classe e implementarne i metodi.

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

Questo `plugin` lato server è uno strumento per la gestione delle notifiche, che fornisce metodi per la registrazione dei tipi di canali di notifica e per l'invio delle notifiche.

#### `registerChannelType()`

Questo metodo registra un nuovo tipo di canale lato server. Di seguito è riportato un esempio di utilizzo.

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

##### Firma

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Il metodo `send` viene utilizzato per inviare notifiche tramite un canale specificato.

```ts
send('in-app-message',
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: '站内信测试',
    title: '站内信测试标题'
  ],
  triggerFrom: 'workflow')

  send('email',
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: '邮箱测试',
    title: '邮箱测试标题'
  ],
  triggerFrom: 'workflow')
```

##### Firma

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Il campo `receivers` attualmente supporta due formati: gli ID utente NocoBase (`userId`) o le configurazioni personalizzate del canale (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Informazioni Dettagliate

`sendConfig`

| Proprietà         | Tipo         | Descrizione            |
| ----------------- | ------------ | ---------------------- |
| `channelName`     | `string`     | Identificatore del canale |
| `message`         | `object`     | Oggetto messaggio      |
| `receivers`       | `ReceiversType` | Destinatari            |
| `triggerFrom`     | `string`     | Origine del trigger    |

## Lato Client

### `PluginNotificationManagerClient`

#### `channelTypes`

La libreria dei tipi di canale registrati.

##### Firma

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registra un tipo di canale lato client.

##### Firma

`registerChannelType(params: registerTypeOptions)`

##### Tipo

```ts
type registerTypeOptions = {
  title: string; // Titolo visualizzato per il canale
  type: string;  // Identificatore del canale
  components: {
    ChannelConfigForm?: ComponentType // Componente del modulo di configurazione del canale;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Componente del modulo di configurazione del messaggio;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Componente del modulo di configurazione del contenuto (solo per il contenuto del messaggio, esclusa la configurazione dei destinatari);
  };
  meta?: { // Metadati per la configurazione del canale
    createable?: boolean // Indica se è possibile aggiungere nuovi canali;
    editable?: boolean  // Indica se la configurazione del canale è modificabile;
    deletable?: boolean // Indica se la configurazione del canale è eliminabile;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```