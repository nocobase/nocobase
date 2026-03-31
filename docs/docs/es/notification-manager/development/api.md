:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Referencia de la API

## Lado del Servidor

### `BaseNotificationChannel`

Esta clase abstracta sirve como base para los diferentes tipos de canales de notificación. Define las interfaces esenciales para la implementación de un canal. Para añadir un nuevo tipo de canal de notificación, debe extender esta clase e implementar sus métodos.

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

Este `plugin` del lado del servidor funciona como una herramienta de gestión de notificaciones, ofreciendo métodos para registrar tipos de canales de notificación y para enviar notificaciones.

#### `registerChannelType()`

Este método registra un nuevo tipo de canal en el lado del servidor. A continuación, le mostramos un ejemplo de uso.

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

El método `send` se utiliza para enviar notificaciones a través de un canal específico.

```ts
// Mensaje en la aplicación
send({
  channelName: 'in-app-message',
  message: {
    title: 'Título de prueba de mensaje en la aplicación',
    content: 'Prueba de mensaje en la aplicación'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// Correo electrónico
send({
  channelName: 'email',
  message: {
    title: 'Título de prueba de correo electrónico',
    content: 'Prueba de correo electrónico'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@163.com', 'b@163.com']
  },
  triggerFrom: 'workflow'
});
```

##### Firma

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Actualmente, el campo `receivers` (destinatarios) solo admite dos formatos: los ID de usuario de NocoBase (`userId`) o configuraciones de canal personalizadas (`channel-self-defined`).

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Información detallada

`sendConfig`

| Propiedad         | Tipo         | Descripción        |
| ----------------- | ------------ | ------------------ |
| `channelName`     | `string`     | Identificador del canal |
| `message`         | `object`     | Objeto del mensaje |
| `receivers`       | `ReceiversType` | Destinatarios      |
| `triggerFrom`     | `string`     | Origen del disparador |

## Lado del Cliente

### `PluginNotificationManagerClient`

#### `channelTypes`

La biblioteca de tipos de canales registrados.

##### Firma

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Registra un tipo de canal del lado del cliente.

##### Firma

`registerChannelType(params: registerTypeOptions)`

##### Tipo

```ts
type registerTypeOptions = {
  title: string; // Título a mostrar para el canal
  type: string;  // Identificador del canal
  components: {
    ChannelConfigForm?: ComponentType // Componente del formulario de configuración del canal;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Componente del formulario de configuración del mensaje;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Componente del formulario de configuración del contenido (solo para el contenido del mensaje, sin incluir la configuración de destinatarios);
  };
  meta?: { // Metadatos para la configuración del canal
    createable?: boolean // Indica si se pueden añadir nuevos canales;
    editable?: boolean  // Indica si la configuración del canal es editable;
    deletable?: boolean // Indica si la configuración del canal es eliminable;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```