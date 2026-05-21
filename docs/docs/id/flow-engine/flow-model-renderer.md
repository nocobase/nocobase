---
title: "FlowModelRenderer Merender FlowModel"
description: "FlowModelRenderer merender FlowModel menjadi Component React, penggunaan dan konfigurasi rendering FlowModel, entry rendering FlowEngine."
keywords: "FlowModelRenderer,rendering FlowModel,Component React,rendering FlowEngine,NocoBase"
---

# Merender FlowModel

FlowModelRenderer adalah Component React inti yang digunakan untuk merender FlowModel, bertanggung jawab mengkonversi instance FlowModel menjadi Component React yang dapat divisualisasikan.

## Penggunaan Dasar

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Penggunaan dasar
<FlowModelRenderer model={myModel} />
```

```tsx file="./_demos/flow-model-renderer.tsx" preview
```

### FieldModelRenderer

Untuk Model field yang dikontrol, gunakan FieldModelRenderer untuk render:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Rendering field yang dikontrol
<FieldModelRenderer model={fieldModel} />
```

## Parameter Props

### FlowModelRendererProps

| Parameter | Tipe | Default | Penjelasan |
|------|------|--------|------|
| `model` | `FlowModel` | - | Instance FlowModel yang akan dirender |
| `uid` | `string` | - | Identifier unik flow model |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Konten fallback saat rendering gagal |
| `showFlowSettings` | `boolean \| object` | `false` | Apakah menampilkan entry pengaturan flow |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Gaya interaksi pengaturan flow |
| `hideRemoveInSettings` | `boolean` | `false` | Apakah menyembunyikan tombol remove dalam pengaturan |
| `showTitle` | `boolean` | `false` | Apakah menampilkan judul model di pojok kiri atas border |
| `skipApplyAutoFlows` | `boolean` | `false` | Apakah melewati auto apply flow |
| `inputArgs` | `Record<string, any>` | - | Konteks tambahan yang dilewatkan ke useApplyAutoFlows |
| `showErrorFallback` | `boolean` | `true` | Apakah membungkus Component FlowErrorFallback di lapisan terluar |
| `settingsMenuLevel` | `number` | - | Level menu pengaturan: 1=hanya model saat ini, 2=termasuk sub model |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Item toolbar tambahan |

### Konfigurasi Detail showFlowSettings

Saat `showFlowSettings` adalah objek, mendukung konfigurasi berikut:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Menampilkan background
  showBorder: true,        // Menampilkan border
  showDragHandle: true,    // Menampilkan drag handle
  style: {},              // Custom style toolbar
  toolbarPosition: 'inside' // Posisi toolbar: 'inside' | 'above' | 'below'
}}
```

## Siklus Hidup Rendering

Seluruh siklus rendering akan memanggil method berikut secara berurutan:

1. **model.dispatchEvent('beforeRender')** - Event sebelum rendering
2. **model.render()** - Mengeksekusi method rendering model
3. **model.onMount()** - Hook mounting Component
4. **model.onUnmount()** - Hook unmounting Component

## Contoh Penggunaan

### Rendering Dasar

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Loading...</div>}
    />
  );
}
```

### Rendering dengan Pengaturan Flow

```tsx pure
// Menampilkan pengaturan tetapi menyembunyikan tombol delete
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Menampilkan pengaturan dan judul
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Menggunakan mode menu kanan klik
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Custom Toolbar

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Action Kustom',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Action kustom');
      }
    }
  ]}
/>
```

### Melewati Auto Flow

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Rendering Field Model

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

FlowModelRenderer memiliki mekanisme penanganan error bawaan yang lengkap:

- **Error Boundary Otomatis**: Default mengaktifkan `showErrorFallback={true}`
- **Error Auto Flow**: Menangkap dan menangani error saat eksekusi auto flow
- **Error Rendering**: Menampilkan konten fallback saat rendering model gagal

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendering gagal, silakan coba lagi</div>}
/>
```

## Optimasi Performa

### Melewati Auto Flow

Untuk skenario yang tidak memerlukan auto flow, dapat dilewati untuk meningkatkan performa:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Update Reaktif

FlowModelRenderer menggunakan `observer` dari `@formily/reactive-react` untuk update reaktif, memastikan Component dapat secara otomatis re-render saat status model berubah.

## Perhatian

1. **Validasi Model**: Pastikan `model` yang dilewatkan memiliki method `render` yang valid
2. **Manajemen Siklus Hidup**: Hook siklus hidup model akan dipanggil pada waktu yang tepat
3. **Error Boundary**: Disarankan mengaktifkan error boundary di environment production untuk memberikan pengalaman pengguna yang lebih baik
4. **Pertimbangan Performa**: Untuk skenario rendering banyak model, pertimbangkan menggunakan opsi `skipApplyAutoFlows`
