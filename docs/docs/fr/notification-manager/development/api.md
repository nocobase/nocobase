:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Référence de l'API

## Côté Serveur

### `BaseNotificationChannel`

Cette classe abstraite sert de base pour les différents types de canaux de notification. Elle définit les interfaces essentielles requises pour l'implémentation d'un canal. Pour étendre NocoBase avec un nouveau type de canal de notification, vous devez hériter de cette classe et implémenter ses méthodes.

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{
    message: Message;
    status: 'success' | 'fail';
    reason?: string;
  }>;
}
```

### `PluginNotificationManagerServer`

Ce **plugin** côté serveur est un outil de gestion des notifications. Il met à votre disposition des méthodes pour enregistrer les types de canaux de notification et pour envoyer des notifications.

#### `registerChannelType()`

Cette méthode enregistre un nouveau type de canal côté serveur. Vous trouverez un exemple d'utilisation ci-dessous.

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

##### Signature

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

La méthode `send` permet d'envoyer des notifications via un canal spécifié.

```ts
// Message intégré à l'application
send({
  channelName: 'in-app-message',
  message: {
    title: 'Titre du message intégré à l'application (test)',
    content: 'Contenu du message intégré à l'application (test)'
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
    title: 'Titre de l\'e-mail (test)',
    content: 'Contenu de l\'e-mail (test)'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Signature

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Le champ `receivers` prend actuellement en charge deux formats : les identifiants d'utilisateur NocoBase (`userId`) ou les configurations de canal personnalisées (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Informations détaillées

`sendConfig`

| Propriété     | Type            | Description           |
| ------------- | --------------- | --------------------- |
| `channelName` | `string`        | Identifiant du canal  |
| `message`     | `object`        | Objet message         |
| `receivers`   | `ReceiversType` | Destinataires         |
| `triggerFrom` | `string`        | Source du déclencheur |

## Côté Client

### `PluginNotificationManagerClient`

#### `channelTypes`

La bibliothèque des types de canaux enregistrés.

##### Signature

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Enregistre un type de canal côté client.

##### Signature

`registerChannelType(params: registerTypeOptions)`

##### Type

```ts
type registerTypeOptions = {
  title: string; // Titre affiché pour le canal
  type: string; // Identifiant du canal
  components: {
    ChannelConfigForm?: ComponentType; // Composant du formulaire de configuration du canal ;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Composant du formulaire de configuration du message ;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Composant du formulaire de configuration du contenu (pour le contenu du message uniquement, sans la configuration des destinataires) ;
  };
  meta?: {
    // Métadonnées pour la configuration du canal
    createable?: boolean; // Indique si de nouveaux canaux peuvent être ajoutés ;
    editable?: boolean; // Indique si la configuration du canal est modifiable ;
    deletable?: boolean; // Indique si la configuration du canal est supprimable ;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```