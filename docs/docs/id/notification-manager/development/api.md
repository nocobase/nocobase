---
title: "Referensi API Notification Manager"
description: "Referensi API Notification Manager: BaseNotificationChannel, registerChannelType, PluginNotificationManagerServer, mengirim notifikasi, registrasi channel, konfigurasi template dan subscription user."
keywords: "API notification manager,BaseNotificationChannel,registerChannelType,channel notifikasi,kirim notifikasi,NocoBase"
---

# Referensi API

## Server-side

### `BaseNotificationChannel`

Adalah abstract class untuk tipe channel user, mendefinisikan interface yang dibutuhkan oleh channel notifikasi. Untuk memperluas tipe channel notifikasi baru perlu meng-inherit class ini, dan mengimplementasikan method-nya.

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

Plugin notification manager server-side, menyediakan method untuk registrasi tipe channel notifikasi dan method pengiriman notifikasi.

#### `registerChannelType()`

Mendaftarkan server-side dari tipe channel, lihat contoh berikut

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

##### Signature

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Method pengiriman notifikasi, panggil method ini untuk mengirim notifikasi

```ts
send('in-app-message', 
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: 'in-app message test',
    title: 'in-app message test title'
  ],
  triggerFrom: 'workflow')

  send('email', 
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: 'email test',
    title: 'email test title'
  ],
  triggerFrom: 'workflow')
```

##### Signature

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Penerima `receivers` saat ini hanya mendukung dua format: NocoBase user ID dalam aplikasi `userId` dan konfigurasi spesifik channel `channel-self-defined`

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Detail

sendConfig

| Property         | Tipe         |  Deskripsi   |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Identifier channel   |
| `message`   | `object`   | Object pesan      |
| `receivers`     | `ReceiversType`  | Penerima |
| `triggerFrom`     | `string`  | Sumber trigger |

## Client-side

### `PluginNotificationManagerClient`

#### `channelTypes`

Library tipe channel yang sudah terdaftar

##### Signature

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Mendaftarkan tipe channel client-side

##### Signature

`registerChannelType(params: registerTypeOptions)`

##### Tipe

```ts
type registerTypeOptions = {
  title: string; // Judul tampilan channel
  type: string;  // Identifier channel
  components: {
    ChannelConfigForm?: ComponentType // Komponen form konfigurasi channel;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // Komponen form konfigurasi pesan;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // Komponen form konfigurasi content (hanya konten pesan, tidak termasuk konfigurasi penerima);
  };
  meta?: { // Meta-info konfigurasi channel
    createable?: boolean // Apakah mendukung penambahan channel;
    editable?: boolean  // Apakah informasi konfigurasi channel dapat diedit;
    deletable?: boolean // Apakah informasi konfigurasi channel dapat dihapus;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```
