:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Referência da API

## Lado do Servidor

### `BaseNotificationChannel`

Esta é uma classe abstrata que serve como base para diferentes tipos de canais de notificação. Ela define as interfaces essenciais para a implementação de um canal. Para adicionar um novo tipo de canal de notificação, você precisa estender esta classe e implementar seus métodos.

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

Este **plugin** do lado do servidor atua como uma ferramenta de gerenciamento de notificações, oferecendo métodos para registrar tipos de canais de notificação e enviar notificações.

#### `registerChannelType()`

Este método registra um novo tipo de canal no lado do servidor. Veja um exemplo de uso abaixo.

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

##### Assinatura

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

O método `send` é usado para enviar notificações através de um canal especificado.

```ts
// Mensagem no aplicativo
send({
  channelName: 'in-app-message',
  message: {
    title: 'Título do teste de mensagem no aplicativo',
    content: 'Teste de mensagem no aplicativo'
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
    title: 'Título do teste de e-mail',
    content: 'Teste de e-mail'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### Assinatura

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

O campo `receivers` atualmente suporta dois formatos: IDs de usuário do NocoBase (`userId`) ou configurações de canal personalizadas (`channel-self-defined`).

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Informações Detalhadas

`sendConfig`

| Propriedade     | Tipo            | Descrição              |
| --------------- | --------------- | ---------------------- |
| `channelName`   | `string`        | Identificador do canal |
| `message`       | `object`        | Objeto da mensagem     |
| `receivers`     | `ReceiversType` | Destinatários          |
| `triggerFrom`   | `string`        | Origem do acionamento  |

## Lado do Cliente

### `PluginNotificationManagerClient`

#### `channelTypes`

A biblioteca de tipos de canais registrados.

##### Assinatura

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registra um tipo de canal do lado do cliente.

##### Assinatura

`registerChannelType(params: registerTypeOptions)`

##### Tipo

```ts
type registerTypeOptions = {
  title: string; // Título de exibição para o canal
  type: string;  // Identificador do canal
  components: {
    ChannelConfigForm?: ComponentType // Componente do formulário de configuração do canal;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Componente do formulário de configuração da mensagem;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Componente do formulário de configuração do conteúdo (apenas para o conteúdo da mensagem, excluindo a configuração do destinatário);
  };
  meta?: { // Metadados para a configuração do canal
    createable?: boolean // Se novos canais podem ser adicionados;
    editable?: boolean  // Se a configuração do canal é editável;
    deletable?: boolean // Se a configuração do canal é deletável;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```