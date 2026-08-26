---
title: "FlowContext"
description: "API FlowContext NocoBase: referensi lengkap properti dan method dari objek ctx di handler registerFlow."
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

Di step handler `registerFlow`, parameter `ctx` adalah instance `FlowRuntimeContext`. Melalui rantai delegasi, dia dapat mengakses semua properti dan method di level model dan engine.

Rantai delegasi:

```
FlowRuntimeContext (konteks runtime dari flow saat ini)
  → FlowModelContext (model.context, level model)
    → FlowEngineContext (engine.context, level global)
```

## Properti Umum

Properti `ctx` yang paling sering digunakan dalam pengembangan plugin:

| Properti | Tipe | Penjelasan |
|------|------|------|
| `ctx.model` | `FlowModel` | Instance FlowModel saat ini |
| `ctx.api` | `APIClient` | HTTP request client, dari `@nocobase/sdk` |
| `ctx.viewer` | `FlowViewer` | Manajer dialog/drawer, menyediakan method `dialog()`, `drawer()`, dll |
| `ctx.message` | `MessageInstance` | Instance message dari Antd, contoh `ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Instance notification dari Antd |
| `ctx.modal` | `HookAPI` | Instance Modal.useModal dari Antd |
| `ctx.t(key, options?)` | `(string, object?) => string` | Method translasi internasional |
| `ctx.router` | `Router` | Instance router dari react-router |
| `ctx.route` | `RouteOptions` | Informasi route saat ini (observable) |
| `ctx.location` | `Location` | Objek location dari URL saat ini (observable) |
| `ctx.ref` | `React.RefObject` | DOM ref dari container view model saat ini |
| `ctx.flowKey` | `string` | Key dari flow saat ini |
| `ctx.mode` | `'runtime' \| 'settings'` | Mode eksekusi saat ini, runtime adalah saat dijalankan, settings adalah panel konfigurasi |
| `ctx.token` | `string` | Token autentikasi user saat ini |
| `ctx.role` | `string` | Role user saat ini |
| `ctx.auth` | `object` | Informasi autentikasi: `{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Token tema Antd, digunakan untuk mendapatkan warna tema dll |
| `ctx.dataSourceManager` | `DataSourceManager` | Manajer data source |
| `ctx.engine` | `FlowEngine` | Instance FlowEngine |
| `ctx.app` | `Application` | Instance Application NocoBase |
| `ctx.i18n` | `i18n` | Instance i18next |

## Method Umum

### Terkait Request

| Method | Penjelasan |
|------|------|
| `ctx.request(options)` | Melakukan HTTP request, URL internal melalui `APIClient`, URL eksternal melalui `axios` |
| `ctx.makeResource(ResourceClass)` | Membuat instance Resource (contoh `MultiRecordResource`, `SingleRecordResource`) |
| `ctx.initResource(className)` | Menginisialisasi resource di model context |

### Terkait Dialog

| Method | Penjelasan |
|------|------|
| `ctx.viewer.dialog(options)` | Membuka dialog, `options.content` menerima `(view) => JSX`, gunakan `view.close()` untuk menutup |
| `ctx.viewer.drawer(options)` | Membuka drawer |
| `ctx.openView(uid, options)` | Membuka view yang sudah didaftarkan (popup / drawer / dialog) |

### Kontrol Eksekusi Flow

| Method | Penjelasan |
|------|------|
| `ctx.exit()` | Menghentikan eksekusi flow saat ini |
| `ctx.exitAll()` | Menghentikan eksekusi semua flow |
| `ctx.getStepParams(stepKey)` | Mendapatkan parameter yang disimpan oleh step tertentu |
| `ctx.setStepParams(stepKey, params)` | Mengatur parameter step tertentu |
| `ctx.getStepResults(stepKey)` | Mendapatkan hasil eksekusi step tertentu sebelumnya |

### Action dan Event

| Method | Penjelasan |
|------|------|
| `ctx.runAction(actionName, params?)` | Mengeksekusi action yang sudah didaftarkan |
| `ctx.getAction(name)` | Mendapatkan definisi action yang sudah didaftarkan |
| `ctx.getActions()` | Mendapatkan semua action yang sudah didaftarkan |
| `ctx.getEvents()` | Mendapatkan semua event yang sudah didaftarkan |

### Permission

| Method | Penjelasan |
|------|------|
| `ctx.aclCheck(params)` | Memeriksa permission ACL |
| `ctx.acl` | Instance ACL |

### Lainnya

| Method | Penjelasan |
|------|------|
| `ctx.resolveJsonTemplate(template)` | Mengurai template ekspresi `{{ ctx.xxx }}` |
| `ctx.getVar(path)` | Mengurai path ekspresi `ctx.xxx.yyy` tunggal |
| `ctx.runjs(code, variables?, options?)` | Mengeksekusi kode JavaScript secara dinamis |
| `ctx.requireAsync(url)` | Memuat module secara dinamis (gaya CommonJS) |
| `ctx.importAsync(url)` | Memuat module secara dinamis (gaya ESM) |
| `ctx.loadCSS(href)` | Memuat file CSS secara dinamis |
| `ctx.onRefReady(ref, callback, timeout)` | Menunggu React ref siap lalu mengeksekusi callback |
| `ctx.defineProperty(key, options)` | Mendaftarkan properti baru secara dinamis |
| `ctx.defineMethod(name, fn, info?)` | Mendaftarkan method baru secara dinamis |

## Pola Penggunaan Umum dalam Pengembangan Plugin

### Menampilkan pesan di click handler

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Operasi berhasil'));
      },
    },
  },
});
```

### Membuat record melalui dialog

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('Buat record baru'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### Mendapatkan data baris saat ini (operasi level record)

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`Baris ke-${index}: ${record.title}`);
      },
    },
  },
});
```

### Mengoperasikan data melalui resource

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // Membuat record
  await resource.create({ title: 'New item', completed: false });
  // Memuat ulang data
  await resource.refresh();
}
```

## Tautan Terkait

- [Ikhtisar FlowEngine (Pengembangan Plugin)](../../plugin-development/client/flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [Definisi Flow FlowDefinition](../../flow-engine/definitions/flow-definition.md) — Penjelasan parameter lengkap registerFlow
- [Dokumentasi Lengkap FlowEngine](../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow
