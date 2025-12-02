:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extender tipos de canales de notificación

NocoBase le permite extender los tipos de canales de notificación según sus necesidades, como notificaciones por SMS o notificaciones push de aplicaciones.

## Cliente

### Registro de tipos de canal

La configuración del canal del cliente y la interfaz de configuración de mensajes se registran a través del método `registerChannelType` que proporciona el cliente del **plugin** de gestión de notificaciones:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Nombre del tipo de canal
      type: 'example-sms', // Identificador del tipo de canal
      components: {
        ChannelConfigForm, // Formulario de configuración del canal
        MessageConfigForm, // Formulario de configuración del mensaje
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Servidor

### Extender la clase abstracta

El núcleo del desarrollo del servidor implica extender la clase abstracta `BaseNotificationChannel` e implementar el método `send`. Este método contiene la lógica de negocio para que el **plugin** extendido envíe notificaciones.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Registro en el servidor

A continuación, debe llamar al método `registerChannelType` del núcleo del servidor de notificaciones para registrar la clase de implementación del servidor que ha desarrollado.

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

## Ejemplo completo

A continuación, le mostraremos un ejemplo de **plugin** de extensión de notificaciones para describir en detalle cómo desarrollar uno.
Supongamos que queremos añadir la funcionalidad de notificación por SMS a NocoBase utilizando la pasarela de SMS de una plataforma.

### Creación del **plugin**

1. Ejecute el comando para crear el **plugin**: `yarn pm add @nocobase/plugin-notification-example`

### Desarrollo del cliente

Para la parte del cliente, necesitamos desarrollar dos componentes de formulario: `ChannelConfigForm` (formulario de configuración del canal) y `MessageConfigForm` (formulario de configuración del mensaje).

#### ChannelConfigForm

Para enviar mensajes SMS, se requieren una clave API (`apiKey`) y un secreto (`secret`). Por lo tanto, el contenido de nuestro formulario de canal incluirá principalmente estos dos elementos. Cree un nuevo archivo llamado `ChannelConfigForm.tsx` en el directorio `src/client` con el siguiente contenido:

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

El formulario de configuración de mensajes incluye principalmente la configuración de los destinatarios (`receivers`) y el contenido del mensaje (`content`). Cree un nuevo archivo llamado `MessageConfigForm.tsx` en el directorio `src/client`. El componente recibe `variableOptions` como parámetro de variable. El formulario de contenido se configura en el nodo del **flujo de trabajo** y, por lo general, necesita consumir variables de dicho nodo. El contenido específico del archivo es el siguiente:

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

#### Registro de componentes del cliente

Una vez que haya desarrollado los componentes de configuración del formulario, debe registrarlos en el núcleo de gestión de notificaciones. Suponiendo que el nombre de nuestra plataforma es "Example", el contenido del archivo `src/client/index.tsx` editado será el siguiente:

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

Con esto, el desarrollo del cliente está completo.

### Desarrollo del servidor

El núcleo del desarrollo del servidor implica extender la clase abstracta `BaseNotificationChannel` e implementar el método `send`. Este método contiene la lógica de negocio para que el **plugin** de extensión envíe notificaciones. Como esto es solo un ejemplo, simplemente imprimiremos los argumentos recibidos. En el directorio `src/server`, añada un archivo llamado `example-server.ts` con el siguiente contenido:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleServer extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleServer send', args);
    return { status: 'success', message: args.message };
  }
}
```

A continuación, registre el **plugin** de extensión del servidor llamando al método `registerChannelType` del núcleo del servidor de notificaciones. El contenido del archivo `src/server/plugin.ts` editado será el siguiente:

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

### Registro y activación del **plugin**

1. Ejecute el comando de registro: `yarn pm add @nocobase/plugin-notification-example`
2. Ejecute el comando de activación: `yarn pm enable @nocobase/plugin-notification-example`

### Configuración del canal

Al visitar la página de canales de gestión de notificaciones, podrá ver que el canal `Example SMS` ha sido activado.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Añada un canal de ejemplo.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Cree un nuevo **flujo de trabajo** y configure el nodo de notificación.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Active la ejecución del **flujo de trabajo** para ver la siguiente información en la consola.
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)