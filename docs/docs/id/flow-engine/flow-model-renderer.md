:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Merender FlowModel

`FlowModelRenderer` adalah komponen React inti yang digunakan untuk merender `FlowModel`. Komponen ini bertanggung jawab untuk mengubah instance `FlowModel` menjadi komponen React yang dapat divisualisasikan.

## Penggunaan Dasar

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Penggunaan dasar
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Untuk Model bidang (field) yang terkontrol, gunakan `FieldModelRenderer` untuk merender:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Merender bidang yang terkontrol
<FieldModelRenderer model={fieldModel} />
```

## Properti (Props)

### FlowModelRendererProps

| Parameter | Tipe | Nilai Default | Deskripsi |
|------|------|--------|------|
| `model` | `FlowModel` | - | Instance FlowModel yang akan dirender |
| `uid` | `string` | - | Pengidentifikasi unik untuk model alur |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Konten fallback yang ditampilkan saat rendering gagal |
| `showFlowSettings` | `boolean \| object` | `false` | Apakah akan menampilkan entri untuk pengaturan alur |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Gaya interaksi untuk pengaturan alur |
| `hideRemoveInSettings` | `boolean` | `false` | Apakah akan menyembunyikan tombol hapus di pengaturan |
| `showTitle` | `boolean` | `false` | Apakah akan menampilkan judul model di sudut kiri atas batas |
| `skipApplyAutoFlows` | `boolean` | `false` | Apakah akan melewati penerapan alur otomatis |
| `inputArgs` | `Record<string, any>` | - | Konteks tambahan yang diteruskan ke `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Apakah akan membungkus lapisan terluar dengan komponen `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Tingkat menu pengaturan: 1=hanya model saat ini, 2=termasuk model anak |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Item bilah alat tambahan |

### Konfigurasi Detail showFlowSettings

Ketika `showFlowSettings` berupa objek, konfigurasi berikut didukung:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Tampilkan latar belakang
  showBorder: true,        // Tampilkan batas
  showDragHandle: true,    // Tampilkan pegangan seret
  style: {},              // Gaya bilah alat kustom
  toolbarPosition: 'inside' // Posisi bilah alat: 'inside' | 'above' | 'below'
}}
```

## Siklus Hidup Rendering

Seluruh siklus rendering memanggil metode-metode berikut secara berurutan:

1.  **model.dispatchEvent('beforeRender')** - Event sebelum rendering
2.  **model.render()** - Mengeksekusi metode render model
3.  **model.onMount()** - Hook pemasangan komponen
4.  **model.onUnmount()** - Hook pelepasan komponen

## Contoh Penggunaan

### Rendering Dasar

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Memuat...</div>}
    />
  );
}
```

### Rendering dengan Pengaturan Alur

```tsx pure
// Tampilkan pengaturan tetapi sembunyikan tombol hapus
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Tampilkan pengaturan dan judul
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Gunakan mode menu konteks
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Bilah Alat Kustom

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Aksi Kustom',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Aksi kustom');
      }
    }
  ]}
/>
```

### Melewati Alur Otomatis

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Rendering Model Bidang

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Penanganan Error

`FlowModelRenderer` memiliki mekanisme penanganan error bawaan yang komprehensif:

-   **Batas Error Otomatis**: `showErrorFallback={true}` diaktifkan secara default
-   **Error Alur Otomatis**: Menangkap dan menangani error selama eksekusi alur otomatis
-   **Error Rendering**: Menampilkan konten fallback saat rendering model gagal

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendering gagal, silakan coba lagi</div>}
/>
```

## Optimasi Performa

### Melewati Alur Otomatis

Untuk skenario di mana alur otomatis tidak diperlukan, Anda dapat melewatinya untuk meningkatkan performa:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Pembaruan Reaktif

`FlowModelRenderer` menggunakan `observer` dari `@formily/reactive-react` untuk pembaruan reaktif, memastikan bahwa komponen secara otomatis merender ulang saat status model berubah.

## Catatan

1.  **Validasi Model**: Pastikan `model` yang diteruskan memiliki metode `render` yang valid.
2.  **Manajemen Siklus Hidup**: Hook siklus hidup model akan dipanggil pada waktu yang tepat.
3.  **Batas Error**: Disarankan untuk mengaktifkan batas error di lingkungan produksi untuk memberikan pengalaman pengguna yang lebih baik.
4.  **Pertimbangan Performa**: Untuk skenario yang melibatkan rendering sejumlah besar model, pertimbangkan untuk menggunakan opsi `skipApplyAutoFlows`.