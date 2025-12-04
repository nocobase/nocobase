:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Referensi API

## Sisi Server

### `BaseNotificationChannel`

`BaseNotificationChannel` adalah kelas abstrak yang menjadi dasar bagi berbagai jenis saluran notifikasi. Kelas ini mendefinisikan antarmuka penting yang diperlukan untuk implementasi saluran. Jika Anda ingin menambahkan jenis saluran notifikasi baru, Anda harus mewarisi kelas ini dan mengimplementasikan metode-metode di dalamnya.

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

`PluginNotificationManagerServer` adalah plugin sisi server yang berfungsi sebagai alat manajemen notifikasi. Plugin ini menyediakan metode untuk mendaftarkan jenis saluran notifikasi dan mengirimkan notifikasi.

#### `registerChannelType()`

Metode ini mendaftarkan jenis saluran baru di sisi server. Contoh penggunaan disediakan di bawah ini.

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

##### Tanda Tangan

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

Metode `send` digunakan untuk mengirimkan notifikasi melalui saluran yang ditentukan.

```ts
// Pesan dalam aplikasi
send({
  channelName: 'in-app-message',
  message: {
    title: 'Judul tes pesan dalam aplikasi',
    content: 'Tes pesan dalam aplikasi'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'alur kerja'
});

// Email
send({
  channelName: 'email',
  message: {
    title: 'Judul tes email',
    content: 'Tes email'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'alur kerja'
});
```

##### Tanda Tangan

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

Bidang `receivers` saat ini hanya mendukung dua format: ID pengguna NocoBase `userId` atau konfigurasi saluran kustom `channel-self-defined`.

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### Informasi Detail

`sendConfig`

| Properti         | Tipe         |  Deskripsi       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | Pengidentifikasi saluran   |
| `message`   | `object`   | Objek pesan      |
| `receivers`     | `ReceiversType`  | Penerima |
| `triggerFrom`     | `string`  | Sumber pemicu |

## Sisi Klien

### `PluginNotificationManagerClient`

#### `channelTypes`

Pustaka jenis saluran yang terdaftar.

##### Tanda Tangan

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

Mendaftarkan jenis saluran sisi klien.

##### Tanda Tangan

`registerChannelType(params: registerTypeOptions)`

##### Tipe

```ts
type registerTypeOptions = {
  title: string; // Judul tampilan untuk saluran
  type: string; // Pengidentifikasi saluran
  components: {
    ChannelConfigForm?: ComponentType; // Komponen formulir konfigurasi saluran;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // Komponen formulir konfigurasi pesan;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // Komponen formulir konfigurasi konten (hanya untuk konten pesan, tidak termasuk konfigurasi penerima);
  };
  meta?: {
    // Metadata untuk konfigurasi saluran
    createable?: boolean; // Apakah saluran baru dapat ditambahkan;
    editable?: boolean; // Apakah konfigurasi saluran dapat diedit;
    deletable?: boolean; // Apakah konfigurasi saluran dapat dihapus;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```