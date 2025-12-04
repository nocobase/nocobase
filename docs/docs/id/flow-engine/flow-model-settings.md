:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# FlowModel: Alur dan Konfigurasi

FlowModel menyediakan pendekatan berbasis "Alur" untuk mengimplementasikan logika konfigurasi komponen, membuat perilaku dan konfigurasi komponen lebih mudah diperluas dan divisualisasikan.

## Model Kustom

Anda dapat membuat model komponen kustom dengan mewarisi `FlowModel`. Model ini perlu mengimplementasikan metode `render()` untuk mendefinisikan logika rendering komponen.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Mendaftarkan Alur

Setiap model dapat mendaftarkan satu atau lebih **Alur** untuk menjelaskan logika konfigurasi dan langkah-langkah interaksi komponen.

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

Deskripsi

-   `key`: Pengidentifikasi unik untuk Alur.
-   `title`: Nama Alur, digunakan untuk tampilan UI.
-   `steps`: Mendefinisikan langkah-langkah konfigurasi (Step). Setiap langkah meliputi:
    -   `title`: Judul langkah.
    -   `uiSchema`: Struktur formulir konfigurasi (kompatibel dengan Formily Schema).
    -   `defaultParams`: Parameter bawaan.
    -   `handler(ctx, params)`: Dipicu saat disimpan, digunakan untuk memperbarui status model.

## Merender Model

Saat merender model komponen, Anda dapat menggunakan parameter `showFlowSettings` untuk mengontrol apakah akan mengaktifkan fitur konfigurasi. Jika `showFlowSettings` diaktifkan, entri konfigurasi (seperti ikon pengaturan atau tombol) akan secara otomatis muncul di sudut kanan atas komponen.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Membuka Formulir Konfigurasi Secara Manual dengan openFlowSettings

Selain membuka formulir konfigurasi melalui entri interaksi bawaan, Anda juga dapat memanggil
`openFlowSettings()` secara manual dalam kode.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definisi Parameter

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Wajib, instans model yang terkait
  preset?: boolean;               // Hanya merender langkah-langkah yang ditandai preset=true (default false)
  flowKey?: string;               // Menentukan satu Alur
  flowKeys?: string[];            // Menentukan beberapa Alur (diabaikan jika flowKey juga disediakan)
  stepKey?: string;               // Menentukan satu langkah (biasanya digunakan dengan flowKey)
  uiMode?: 'dialog' | 'drawer';   // Kontainer untuk menampilkan formulir, default 'dialog'
  onCancel?: () => void;          // Callback saat tombol batal diklik
  onSaved?: () => void;           // Callback setelah konfigurasi berhasil disimpan
}
```

### Contoh: Membuka Formulir Konfigurasi Alur Tertentu dalam Mode Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Konfigurasi tombol telah disimpan');
  },
});
```