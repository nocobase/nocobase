:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Tipe Saluran Notifikasi

NocoBase mendukung perluasan tipe saluran notifikasi sesuai kebutuhan, seperti notifikasi SMS dan notifikasi push aplikasi.

## Klien

### Registrasi Tipe Saluran

Antarmuka konfigurasi saluran dan konfigurasi pesan klien didaftarkan melalui metode `registerChannelType` yang disediakan oleh klien plugin manajemen notifikasi:

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // Nama tipe saluran
      type: 'example-sms', // Pengidentifikasi tipe saluran
      components: {
        ChannelConfigForm, // Formulir konfigurasi saluran
        MessageConfigForm, // Formulir konfigurasi pesan
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## Server

### Mewarisi Kelas Abstrak

Inti dari pengembangan server adalah mewarisi kelas abstrak `BaseNotificationChannel` dan mengimplementasikan metode `send`. Metode `send` berisi logika bisnis untuk pengiriman notifikasi melalui plugin yang diperluas.

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### Registrasi Server

Selanjutnya, Anda perlu memanggil metode `registerChannelType` dari inti server notifikasi untuk mendaftarkan kelas implementasi server yang telah dikembangkan ke dalam inti:

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

## Contoh Lengkap

Berikut adalah contoh plugin perluasan notifikasi untuk menjelaskan secara rinci cara mengembangkan sebuah plugin perluasan.
Misalnya, kita ingin menambahkan fungsionalitas notifikasi SMS ke NocoBase menggunakan gateway SMS dari suatu platform.

### Pembuatan Plugin

1.  Jalankan perintah untuk membuat plugin: `yarn pm add @nocobase/plugin-notification-example`

### Pengembangan Klien

Untuk bagian klien, kita perlu mengembangkan dua komponen formulir: `ChannelConfigForm` (Formulir Konfigurasi Saluran) dan `MessageConfigForm` (Formulir Konfigurasi Pesan).

#### ChannelConfigForm

Untuk mengirim pesan SMS, diperlukan API key dan secret. Oleh karena itu, isi formulir saluran kita akan mencakup kedua item ini. Buat file baru bernama `ChannelConfigForm.tsx` di direktori `src/client`, dengan isi sebagai berikut:

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

Formulir konfigurasi pesan, terutama mencakup konfigurasi untuk penerima (`receivers`) dan konten pesan (`content`). Buat file baru bernama `MessageConfigForm.tsx` di direktori `src/client`. Komponen ini menerima `variableOptions` sebagai parameter variabel. Formulir konten saat ini akan dikonfigurasi di node alur kerja, dan umumnya perlu mengonsumsi variabel node alur kerja. Isi file spesifiknya adalah sebagai berikut:

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
            title: `{{t("Penerima")}}`,
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
                    placeholder: `{{t("Nomor telepon")}}`,
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
                title: `{{t("Tambah nomor telepon")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Konten")}}`,
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

#### Registrasi Komponen Klien

Setelah komponen konfigurasi formulir selesai dikembangkan, Anda perlu memanggil inti manajemen notifikasi untuk mendaftarkannya. Misalkan nama platform kita adalah Example, maka isi file `src/client/index.tsx` yang telah diedit adalah sebagai berikut:

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

Dengan demikian, pengembangan klien telah selesai.

### Pengembangan Server

Inti dari pengembangan server adalah mewarisi kelas abstrak `BaseNotificationChannel` dan mengimplementasikan metode `send`. Metode `send` berisi logika bisnis untuk plugin perluasan dalam mengirim notifikasi. Karena ini adalah contoh, kita hanya akan mencetak argumen yang diterima. Di direktori `src/server`, tambahkan file `example-server.ts` dengan isi sebagai berikut:

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

Selanjutnya, Anda perlu memanggil metode `registerChannelType` dari inti server notifikasi untuk mendaftarkan plugin perluasan server. Isi file `src/server/plugin.ts` yang telah diedit adalah sebagai berikut:

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

### Registrasi dan Peluncuran Plugin

1.  Jalankan perintah registrasi: `yarn pm add @nocobase/plugin-notification-example`
2.  Jalankan perintah pengaktifan: `yarn pm enable @nocobase/plugin-notification-example`

### Konfigurasi Saluran

Saat ini, jika Anda mengunjungi halaman saluran manajemen notifikasi, Anda dapat melihat bahwa `Example SMS` telah diaktifkan.
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

Tambahkan saluran contoh.
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

Buat alur kerja baru dan konfigurasikan node notifikasi.
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

Picu eksekusi alur kerja, dan Anda akan melihat informasi berikut ditampilkan di konsol.
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)