:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# API Referansı

## Sunucu Tarafı

### `BaseNotificationChannel`

Bu soyut sınıf, farklı bildirim kanalı türleri için bir temel oluşturur ve kanal uygulaması için gerekli arayüzleri tanımlar. Yeni bir bildirim kanalı türü eklemek için bu sınıfı genişletmeli ve metotlarını uygulamalısınız.

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

Bu sunucu tarafı eklenti, bir bildirim yönetim aracı olarak hizmet verir; bildirim kanalı türlerini kaydetme ve bildirim gönderme metotları sunar.

#### `registerChannelType()`

Bu metot, sunucu tarafında yeni bir kanal türü kaydeder. Örnek kullanımı aşağıda verilmiştir.

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

##### İmza

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

`send` metodu, belirtilen bir kanal aracılığıyla bildirimleri göndermek için kullanılır.

```ts
// Uygulama içi mesaj
send({
  channelName: 'in-app-message',
  message: {
    title: 'Uygulama içi mesaj test başlığı',
    content: 'Uygulama içi mesaj testi'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// E-posta
send({
  channelName: 'email',
  message: {
    title: 'E-posta test başlığı',
    content: 'E-posta testi'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### İmza

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

`receivers` alanı şu anda iki formatı desteklemektedir: NocoBase kullanıcı ID'leri `userId` veya özel kanal yapılandırmaları `channel-self-defined`.

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Detaylı Bilgi

`sendConfig`

| Özellik       | Tip             | Açıklama           |
| ------------- | --------------- | ------------------ |
| `channelName` | `string`        | Kanal tanımlayıcı  |
| `message`     | `object`        | Mesaj nesnesi      |
| `receivers`   | `ReceiversType` | Alıcılar           |
| `triggerFrom` | `string`        | Tetikleme kaynağı  |

## İstemci Tarafı

### `PluginNotificationManagerClient`

#### `channelTypes`

Kayıtlı kanal türlerinin kütüphanesi.

##### İmza

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

İstemci tarafı bir kanal türü kaydeder.

##### İmza

`registerChannelType(params: registerTypeOptions)`

##### Tip

```ts
type registerTypeOptions = {
  title: string; // Kanalın görünen başlığı
  type: string; // Kanal tanımlayıcı
  components: {
    ChannelConfigForm?: ComponentType; // Kanal yapılandırma formu bileşeni;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Mesaj yapılandırma formu bileşeni;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // İçerik yapılandırma formu bileşeni (yalnızca mesaj içeriği için, alıcı yapılandırması hariç);
  };
  meta?: {
    // Kanal yapılandırması için meta veri
    createable?: boolean; // Yeni kanalların eklenip eklenemeyeceği;
    editable?: boolean; // Kanal yapılandırma bilgilerinin düzenlenip düzenlenemeyeceği;
    deletable?: boolean; // Kanal yapılandırma bilgilerinin silinip silinemeyeceği;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```