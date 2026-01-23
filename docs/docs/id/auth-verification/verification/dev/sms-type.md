:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Penyedia Layanan SMS

Artikel ini menjelaskan cara memperluas fungsionalitas penyedia layanan SMS dalam fitur [Verifikasi: SMS](../sms) melalui sebuah plugin.

## Klien

### Mendaftarkan Formulir Konfigurasi

Saat mengonfigurasi verifikator SMS, setelah memilih jenis penyedia layanan SMS, akan muncul formulir konfigurasi yang terkait dengan jenis penyedia tersebut. Formulir konfigurasi ini perlu didaftarkan oleh pengembang di sisi klien.

![](https://static-docs.nocobase.com/202503011221912.png)

```ts
import { Plugin, SchemaComponent } from '@nocobase/client';
import PluginVerificationClient from '@nocobase/plugin-verification/client';
import React from 'react';

const CustomSMSProviderSettingsForm: React.FC = () => {
  return <SchemaComponent schema={{
    type: 'void',
    properties: {
      accessKeyId: {
        title: `{{t("Access Key ID", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Access Key Secret", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        'x-component-props': { password: true },
        required: true,
      },
    }
  }} />
}

class PluginCustomSMSProviderClient extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationClient;
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      components: {
        AdminSettingsForm: CustomSMSProviderSettingsForm,
      },
    });
  }
}
```

## Server

### Mengimplementasikan Antarmuka Pengiriman

Plugin verifikasi telah mengemas proses pembuatan kata sandi dinamis satu kali (OTP). Jadi, pengembang hanya perlu mengimplementasikan logika pengiriman pesan untuk berinteraksi dengan penyedia layanan SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options adalah objek konfigurasi dari klien
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### Mendaftarkan Jenis Verifikasi

Setelah antarmuka pengiriman diimplementasikan, antarmuka tersebut perlu didaftarkan.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // nama harus sesuai dengan yang digunakan di klien
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```