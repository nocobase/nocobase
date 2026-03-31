:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estendendo Tipos de Canal de Notificação

O NocoBase permite que você estenda os tipos de canal de notificação conforme sua necessidade, como para notificações por SMS e notificações push de aplicativos.

## Cliente

### Registro de Tipo de Canal

A interface de configuração de canal e de mensagens do cliente é registrada através do método `registerChannelType` fornecido pelo cliente do **plugin** de gerenciamento de notificações:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Nome do tipo de canal
      type: 'example-sms', // Identificador do tipo de canal
      components: {
        ChannelConfigForm, // Formulário de configuração do canal
        MessageConfigForm, // Formulário de configuração da mensagem
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Servidor

### Estendendo a Classe Abstrata

O ponto central do desenvolvimento no servidor é estender a classe abstrata `BaseNotificationChannel` e implementar o método `send`. Este método contém a lógica de negócio para o **plugin** estendido enviar notificações.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Registro no Servidor

Em seguida, você deve chamar o método `registerChannelType` do núcleo do servidor de notificações para registrar a classe de implementação do servidor que você desenvolveu:

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

## Exemplo Completo

A seguir, apresentamos um exemplo de **plugin** de extensão de notificação para descrever em detalhes como desenvolver um **plugin** de extensão. Suponha que queremos adicionar a funcionalidade de notificação por SMS ao NocoBase usando um gateway de SMS de uma plataforma.

### Criação do Plugin

1. Execute o comando para criar o **plugin**: `yarn pm add @nocobase/plugin-notification-example`

### Desenvolvimento do Cliente

Para o cliente, precisamos desenvolver dois componentes de formulário: `ChannelConfigForm` (Formulário de Configuração do Canal) e `MessageConfigForm` (Formulário de Configuração da Mensagem).

#### ChannelConfigForm

Para enviar mensagens SMS, são necessárias uma chave de API (`apiKey`) e um segredo (`secret`). Crie um novo arquivo chamado `ChannelConfigForm.tsx` no diretório `src/client` com o seguinte conteúdo:

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
            title: '{{t("Transporte")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transporte")}}',
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

O formulário de configuração da mensagem inclui principalmente a configuração para os destinatários (`receivers`) e o conteúdo da mensagem (`content`). Crie um novo arquivo chamado `MessageConfigForm.tsx` no diretório `src/client`. O componente recebe `variableOptions` como um parâmetro de variável. O formulário de conteúdo é configurado no nó do **fluxo de trabalho** e geralmente precisa consumir variáveis do nó do **fluxo de trabalho**. O conteúdo específico do arquivo é o seguinte:

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
            title: `{{t("Destinatários")}}`,
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
                    placeholder: `{{t("Número de telefone")}}`,
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
                title: `{{t("Adicionar número de telefone")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Conteúdo")}}`,
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

#### Registro de Componentes do Cliente

Após desenvolver os componentes de configuração do formulário, você precisa registrá-los no núcleo de gerenciamento de notificações. Supondo que o nome da nossa plataforma seja "Example", o conteúdo editado do arquivo `src/client/index.tsx` é o seguinte:

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

Neste ponto, o desenvolvimento do cliente está completo.

### Desenvolvimento do Servidor

O ponto central do desenvolvimento no servidor é estender a classe abstrata `BaseNotificationChannel` e implementar o método `send`. Este método contém a lógica de negócio para o **plugin** de extensão enviar notificações. Como este é um exemplo, vamos simplesmente imprimir os argumentos recebidos. No diretório `src/server`, adicione um arquivo chamado `example-server.ts` com o seguinte conteúdo:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

Em seguida, registre o **plugin** de extensão do servidor chamando o método `registerChannelType` do núcleo do servidor de notificações. O conteúdo editado do arquivo `src/server/plugin.ts` é o seguinte:

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

### Registro e Ativação do Plugin

1. Execute o comando de registro: `yarn pm add @nocobase/plugin-notification-example`
2. Execute o comando de ativação: `yarn pm enable @nocobase/plugin-notification-example`

### Configuração do Canal

Ao acessar a página de canais do gerenciamento de Notificações, você verá que o canal `Example SMS` foi ativado.

![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Adicione um canal de exemplo.

![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Crie um novo **fluxo de trabalho** e configure o nó de notificação.

![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Acione a execução do **fluxo de trabalho** para visualizar as seguintes informações no console.

![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)