---
title: "Event Flow dan Konfigurasi FlowModel"
description: "Event flow dan konfigurasi FlowModel: registerFlow untuk mendaftarkan Flow, mengkonfigurasi Flow, event, dan properti dalam pembuatan UI, mewujudkan orkestrasi no-code."
keywords: "Konfigurasi FlowModel,registerFlow,Konfigurasi event flow,Orkestrasi no-code,Pembuatan UI,FlowEngine,NocoBase"
---

# Event Flow dan Konfigurasi FlowModel

FlowModel menyediakan cara untuk mengimplementasikan logika konfigurasi komponen berdasarkan "event flow (Flow)", sehingga perilaku dan konfigurasi komponen menjadi lebih dapat diperluas dan visual.

## Model Kustom

Anda dapat membuat model komponen kustom dengan mewarisi `FlowModel`. Model perlu mengimplementasikan metode `render()` untuk mendefinisikan logika render komponen.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Mendaftarkan Flow (Event Flow)

Setiap model dapat mendaftarkan satu atau lebih **Flow** untuk mendeskripsikan logika konfigurasi dan langkah-langkah interaksi komponen.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Pengaturan Tombol',
  steps: {
    general: {
      title: 'Konfigurasi Umum',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Judul Tombol',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Penjelasan

-   `key`: Identifier unik dari Flow.
-   `title`: Nama Flow, digunakan untuk tampilan UI.
-   `steps`: Mendefinisikan langkah-langkah konfigurasi (Step). Setiap langkah meliputi:
    -   `title`: Judul langkah.
    -   `uiSchema`: Struktur form konfigurasi (kompatibel dengan Formily Schema).
    -   `defaultParams`: Parameter default.
    -   `handler(ctx, params)`: Dipicu saat menyimpan, digunakan untuk memperbarui state model.

## Render Model

Saat merender model komponen, Anda dapat mengontrol apakah fitur konfigurasi diaktifkan melalui parameter `showFlowSettings`. Jika `showFlowSettings` diaktifkan, entry konfigurasi (seperti ikon pengaturan atau tombol) akan otomatis ditampilkan di pojok kanan atas komponen.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Menggunakan openFlowSettings untuk Membuka Form Konfigurasi Secara Manual

Selain membuka form konfigurasi melalui entry interaksi bawaan, Anda juga dapat memanggil `openFlowSettings()` secara manual dalam kode.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definisi Parameter

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Wajib, instance model yang dimiliki
  preset?: boolean;               // Hanya merender step yang ditandai preset=true (default false)
  flowKey?: string;               // Menentukan satu Flow
  flowKeys?: string[];            // Menentukan beberapa Flow (diabaikan jika flowKey juga disediakan)
  stepKey?: string;               // Menentukan satu step (biasanya digunakan dengan flowKey)
  uiMode?: 'dialog' | 'drawer';   // Container tampilan form, default 'dialog'
  onCancel?: () => void;          // Callback saat tombol batal diklik
  onSaved?: () => void;           // Callback setelah konfigurasi berhasil disimpan
}
```

### Contoh: Membuka Form Konfigurasi Flow Tertentu dengan Mode Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Konfigurasi tombol telah disimpan');
  },
});
```
