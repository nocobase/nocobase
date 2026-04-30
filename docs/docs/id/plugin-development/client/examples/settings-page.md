---
title: "Membuat Halaman Pengaturan Plugin"
description: "Praktik plugin NocoBase: membuat halaman pengaturan plugin dengan pluginSettingsManager + Component + ctx.api, mengelola API Key pihak ketiga."
keywords: "Halaman Pengaturan Plugin,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Membuat Halaman Pengaturan Plugin

Banyak plugin memerlukan halaman pengaturan untuk memungkinkan user mengonfigurasi parameter — seperti API Key dari layanan pihak ketiga, alamat Webhook, dll. Contoh ini menunjukkan cara membuat halaman pengaturan plugin yang lengkap dengan `pluginSettingsManager` + Component React + `ctx.api`.

Contoh ini tidak melibatkan FlowEngine, murni kombinasi Plugin + Router + Component + Context.

:::tip Bacaan Pendahuluan

Disarankan memahami konten berikut terlebih dahulu agar pengembangan lebih lancar:

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Pembuatan plugin dan struktur direktori
- [Plugin](../plugin) — Entry point Plugin dan lifecycle `load()`
- [Router](../router) — Registrasi halaman pengaturan `pluginSettingsManager`
- [Pengembangan Component](../component/index.md) — Cara menulis Component React dan useFlowContext
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan `useT()`

:::


## Hasil Akhir

Yang akan kita buat adalah halaman pengaturan "External Service Configuration":

- Muncul di menu "Konfigurasi Plugin"
- Menyediakan UI form dengan Antd Form
- Memanggil interface backend untuk membaca dan menyimpan konfigurasi melalui `ctx.api`
- Memberikan notifikasi setelah berhasil disimpan

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Source code lengkap lihat [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Jika Anda ingin langsung menjalankannya secara lokal untuk melihat hasilnya:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

Berikutnya, mari kita bangun plugin ini dari nol, langkah demi langkah.

## Langkah 1: Membuat Skeleton Plugin

Eksekusi di direktori root repository:

```bash
yarn pm create @my-project/plugin-settings-page
```

Ini akan menghasilkan struktur file dasar di `packages/plugins/@my-project/plugin-settings-page`, termasuk direktori `src/client-v2/`, `src/server/`, `src/locale/`, dll. Untuk penjelasan detail lihat [Menulis Plugin Pertama Anda](../../write-your-first-plugin).

## Langkah 2: Mendaftarkan Halaman Pengaturan

Edit `src/client-v2/plugin.tsx`, daftarkan halaman pengaturan dengan `this.pluginSettingsManager` di `load()`. Dua langkah — pertama daftarkan menu entry dengan `addMenuItem()`, lalu daftarkan halaman aktual dengan `addPageTabItem()`:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // Mendaftarkan menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Icon Ant Design, lihat https://5x.ant.design/components/icon
    });

    // Tab 1: Konfigurasi API (key adalah 'index', dipetakan ke path root menu /admin/settings/external-api)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // Nilai sort lebih kecil berada lebih depan
    });

    // Tab 2: Halaman About (dipetakan ke /admin/settings/external-api/about)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'about',
      title: this.t('About'),
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}

export default PluginSettingsPageClient;
```

Setelah didaftarkan, di menu "Konfigurasi Plugin" akan muncul entry "External Service Configuration" dengan dua tab di bagian atas — "API Configuration" dan "About". Ketika hanya ada satu halaman di bawah menu, tab bar akan otomatis disembunyikan; di sini kita mendaftarkan dua halaman sehingga akan otomatis ditampilkan. `this.t()` akan secara otomatis menggunakan nama paket plugin saat ini sebagai i18n namespace, untuk detail lihat [Context → Kapabilitas Umum](../ctx/common-capabilities#国际化ctxt--ctxi18n).

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Langkah 3: Menulis Component Halaman Pengaturan

Buat `src/client-v2/pages/ExternalApiSettingsPage.tsx`. Halaman pengaturan adalah Component React biasa, di sini kita menggunakan `Form` dan `Card` dari Antd untuk membangun UI, menggunakan `useFlowContext()` untuk mendapatkan `ctx.api` untuk berinteraksi dengan backend, dan menggunakan `useT()` untuk mendapatkan function terjemahan.

```tsx
// src/client-v2/pages/ExternalApiSettingsPage.tsx
import React from 'react';
import { Form, Input, Button, Card, Space, message } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';

interface ExternalApiSettings {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

export default function ExternalApiSettingsPage() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm<ExternalApiSettings>();

  // Memuat konfigurasi yang sudah ada
  const { loading } = useRequest(
    () =>
      ctx.api.request({
        url: 'externalApi:get',
        method: 'get',
      }),
    {
      onSuccess(response) {
        if (response?.data?.data) {
          form.setFieldsValue(response.data.data);
        }
      },
    },
  );

  // Menyimpan konfigurasi
  const { run: save, loading: saving } = useRequest(
    (values: ExternalApiSettings) =>
      ctx.api.request({
        url: 'externalApi:set',
        method: 'post',
        data: values,
      }),
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully'));
      },
      onError() {
        message.error(t('Save failed'));
      },
    },
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    save(values);
  };

  return (
    <Card title={t('External API Settings')} loading={loading}>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: t('Please enter API Key') }]}
        >
          <Input placeholder="sk-xxxxxxxxxxxx" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="API Secret"
          name="apiSecret"
          rules={[{ required: true, message: t('Please enter API Secret') }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Endpoint"
          name="endpoint"
          rules={[{ required: true, message: t('Please enter endpoint URL') }]}
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('Save')}
            </Button>
            <Button onClick={() => form.resetFields()}>
              {t('Reset')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
```

Beberapa poin penting:

- **`useFlowContext()`** — Diimpor dari `@nocobase/flow-engine`, untuk mendapatkan kapabilitas Context seperti `ctx.api`, dll.
- **`useT()`** — Hook terjemahan yang diimpor dari `locale.ts`, sudah ter-bind dengan namespace plugin, untuk detail lihat [i18n Internasionalisasi](../component/i18n)
- **`useRequest()`** — Berasal dari [ahooks](https://ahooks.js.org/hooks/use-request/index), menangani state loading dan error request. `manual: true` artinya tidak mengirim request secara otomatis, perlu memanggil `run()` secara manual
- **`ctx.api.request()`** — Penggunaan sama dengan Axios, NocoBase akan secara otomatis menambahkan informasi autentikasi

## Langkah 4: Menambahkan File Multibahasa

Edit file terjemahan di `src/locale/` plugin:

```json
// src/locale/zh-CN.json
{
  "External API Settings": "外部服务配置",
  "API Configuration": "API 配置",
  "About": "关于",
  "Plugin name": "插件名称",
  "Version": "版本",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "这是一个演示插件，展示如何注册带多个 Tab 的设置页。",
  "Please enter API Key": "请输入 API Key",
  "Please enter API Secret": "请输入 API Secret",
  "Please enter endpoint URL": "请输入接口地址",
  "Save": "保存",
  "Reset": "重置",
  "Saved successfully": "保存成功",
  "Save failed": "保存失败"
}
```

```json
// src/locale/en-US.json
{
  "External API Settings": "External API Settings",
  "API Configuration": "API Configuration",
  "About": "About",
  "Plugin name": "Plugin name",
  "Version": "Version",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "This is a demo plugin showing how to register a settings page with multiple tabs.",
  "Please enter API Key": "Please enter API Key",
  "Please enter API Secret": "Please enter API Secret",
  "Please enter endpoint URL": "Please enter endpoint URL",
  "Save": "Save",
  "Reset": "Reset",
  "Saved successfully": "Saved successfully",
  "Save failed": "Save failed"
}
```

:::warning Perhatian

Pertama kali menambahkan file bahasa perlu restart aplikasi agar berlaku.

:::

Untuk cara penulisan file terjemahan, hook `useT()`, `tExpr()` dan penggunaan lainnya, lihat [i18n Internasionalisasi](../component/i18n).

## Langkah 5: Interface Server

Form di client memerlukan dua interface dari backend yaitu `externalApi:get` dan `externalApi:set`. Bagian server tidak rumit — definisikan tabel data untuk menyimpan konfigurasi, lalu daftarkan dua interface.

### Mendefinisikan Tabel Data

Buat `src/server/collections/externalApiSettings.ts`. NocoBase akan secara otomatis memuat definisi collection di direktori ini:

```ts
// src/server/collections/externalApiSettings.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'externalApiSettings',
  fields: [
    { name: 'apiKey', type: 'string', title: 'API Key' },
    { name: 'apiSecret', type: 'string', title: 'API Secret' },
    { name: 'endpoint', type: 'string', title: 'Endpoint' },
  ],
});
```

### Mendaftarkan Resource dan Interface

Edit `src/server/plugin.ts`, daftarkan resource dengan `resourceManager.define()`, lalu konfigurasikan hak akses ACL:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // Mendaftarkan resource dan interface
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — Membaca konfigurasi
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — Menyimpan konfigurasi
        async set(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const values = ctx.action.params.values;
          const existing = await repo.findOne();
          if (existing) {
            await repo.update({ values, filter: { id: existing.id } });
          } else {
            await repo.create({ values });
          }
          ctx.body = { ok: true };
          await next();
        },
      },
    });

    // User yang sudah login dapat membaca konfigurasi
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Beberapa poin penting:

- **`ctx.db.getRepository()`** — Mendapatkan object operasi data berdasarkan nama collection
- **`ctx.action.params.values`** — Data body request POST
- **`acl.allow()`** — `'loggedIn'` artinya user yang sudah login dapat mengaksesnya. Interface `set` tidak secara eksplisit di-allow, default-nya hanya admin yang dapat memanggilnya
- **`await next()`** — Setiap action harus memanggil ini di akhir, ini adalah konvensi middleware Koa

## Langkah 6: Menulis Halaman "About"

Di langkah 2 kita mendaftarkan dua tab, Component halaman "API Configuration" sudah ditulis di langkah 3, sekarang mari menulis halaman tab "About".

Buat `src/client-v2/pages/AboutPage.tsx`:

```tsx
// src/client-v2/pages/AboutPage.tsx
import React from 'react';
import { Card, Descriptions, Typography } from 'antd';
import { useT } from '../locale';

const { Paragraph } = Typography;

export default function AboutPage() {
  const t = useT();

  return (
    <Card title={t('About')}>
      <Descriptions column={1} bordered style={{ maxWidth: 600 }}>
        <Descriptions.Item label={t('Plugin name')}>
          @nocobase-example/plugin-settings-page
        </Descriptions.Item>
        <Descriptions.Item label={t('Version')}>1.0.0</Descriptions.Item>
      </Descriptions>
      <Paragraph style={{ marginTop: 16, color: '#888' }}>
        {t('This is a demo plugin showing how to register a settings page with multiple tabs.')}
      </Paragraph>
    </Card>
  );
}
```

Halaman ini sangat sederhana — menggunakan `Descriptions` dari Antd untuk menampilkan informasi plugin. Dalam proyek nyata, tab "About" dapat digunakan untuk menempatkan version, changelog, link bantuan, dll.

## Langkah 7: Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-settings-page
```

Setelah diaktifkan refresh halaman, di menu "Konfigurasi Plugin" Anda akan melihat entry "External Service Configuration".

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Source Code Lengkap

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — Contoh lengkap halaman pengaturan plugin

## Ringkasan

Kapabilitas yang digunakan dalam contoh ini:

| Kapabilitas             | Penggunaan                                                       | Dokumentasi                                                            |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Registrasi Halaman Pengaturan       | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router)                                        |
| Halaman Pengaturan Multi-Tab    | Mendaftarkan beberapa `addPageTabItem()` dengan `menuKey` yang sama                 | [Router](../router)                                        |
| API Request         | `ctx.api.request()`                                        | [Context → Kapabilitas Umum](../ctx/common-capabilities#api-请求ctxapi) |
| Internasionalisasi (Client) | `this.t()` / `useT()`                                      | [i18n Internasionalisasi](../component/i18n)                                |
| Internasionalisasi (Server) | `ctx.t()` / `plugin.t()`                                   | [i18n Internasionalisasi (Server)](../../server/i18n)                      |
| UI Form          | Antd Form                                                  | [Ant Design Form](https://5x.ant.design/components/form)        |

## Tautan Terkait

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Membuat skeleton plugin dari nol
- [Plugin](../plugin) — Entry point Plugin dan lifecycle
- [Router](../router) — Route halaman dan registrasi halaman pengaturan plugin
- [Context → Kapabilitas Umum](../ctx/common-capabilities) — ctx.api, ctx.t, dll.
- [Pengembangan Component](../component/index.md) — Cara menulis Component React
- [Ikhtisar Pengembangan Server](../../server) — Mendefinisikan interface backend
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan
- [i18n Internasionalisasi (Server)](../../server/i18n) — Terjemahan server
