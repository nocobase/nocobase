---
title: "FlowDefinition Definisi Flow"
description: "FlowDefinition mendefinisikan struktur dasar dan konfigurasi flow: key, on, steps, defaultParams, mendeskripsikan meta info flow, kondisi trigger, langkah eksekusi, tipe inti FlowEngine."
keywords: "FlowDefinition,definisi flow,konfigurasi Flow,on,steps,defaultParams,tipe FlowEngine,NocoBase"
---

# FlowDefinition

FlowDefinition mendefinisikan struktur dasar dan konfigurasi flow, adalah salah satu konsep inti flow engine. Mendeskripsikan meta info, kondisi trigger, langkah eksekusi flow, dll.

## Definisi Tipe

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

Tipe `on` adalah sebagai berikut:

```ts
type FlowEventPhase =
  | 'beforeAllFlows'
  | 'afterAllFlows'
  | 'beforeFlow'
  | 'afterFlow'
  | 'beforeStep'
  | 'afterStep';

type FlowEvent<TModel extends FlowModel = FlowModel> =
  | string
  | {
      eventName: string;
      defaultParams?: Record<string, any>;
      phase?: FlowEventPhase;
      flowKey?: string;
      stepKey?: string;
    };
```

## Cara Registrasi

```ts
class MyModel extends FlowModel {}

// Mendaftarkan flow melalui class model
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Penjelasan Property

### key

**Tipe**: `string`  
**Wajib**: Ya  
**Deskripsi**: Identifier unik flow

Disarankan menggunakan gaya penamaan terpadu `xxxSettings`, contoh:
- `pageSettings`, `tableSettings`, `cardSettings`, `formSettings`, `buttonSettings`

Penamaan ini memudahkan identifikasi dan maintenance, disarankan terpadu secara global.

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul flow yang dapat dibaca manusia

Disarankan menjaga gaya yang konsisten dengan key, menggunakan penamaan `Xxx settings`, seperti `Page settings`, `Table settings`, dll.

### manual

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Default**: `false`  
**Deskripsi**: Apakah flow hanya dieksekusi secara manual

- `true`: Flow hanya dapat dipicu secara manual, tidak akan dieksekusi otomatis
- `false`: Flow dapat dieksekusi otomatis (saat tidak ada property `on` default eksekusi otomatis)

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Default**: `0`  
**Deskripsi**: Urutan eksekusi flow, semakin kecil semakin dieksekusi terlebih dahulu

Dapat berupa negatif, untuk mengontrol urutan eksekusi beberapa flow.

### on

**Tipe**: `FlowEvent<TModel>`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi event yang mengizinkan flow ini dipicu oleh `dispatchEvent`

Digunakan untuk mendeklarasikan nama event trigger (string atau `{ eventName }`), dan timing eksekusi opsional (`phase`). Tidak termasuk function handler (logika pemrosesan ada di `steps`).

**Tipe Event yang Didukung**:
- `'beforeRender'` - Event sebelum rendering, otomatis dipicu saat Component pertama kali dirender
- `'click'` - Event klik
- `'submit'` - Event submit
- `'reset'` - Event reset
- `'remove'` - Event delete
- `'openView'` - Event buka view
- `'dropdownOpen'` - Event dropdown terbuka
- `'popupScroll'` - Event scroll modal
- `'search'` - Event pencarian
- `'customRequest'` - Event request kustom
- `'collapseToggle'` - Event toggle collapse
- Atau string kustom apa pun

#### Timing Eksekusi (phase)

Saat ada beberapa event flow di satu event yang sama (seperti `click`), dapat menggunakan `phase / flowKey / stepKey` untuk menentukan posisi flow ini disisipkan dalam static flow bawaan untuk dieksekusi:

| phase | Arti | Field yang Diperlukan |
| --- | --- | --- |
| `beforeAllFlows` (Default) | Eksekusi sebelum semua static flow bawaan | - |
| `afterAllFlows` | Eksekusi setelah semua static flow bawaan | - |
| `beforeFlow` | Eksekusi sebelum static flow bawaan tertentu dimulai | `flowKey` |
| `afterFlow` | Eksekusi setelah static flow bawaan tertentu selesai | `flowKey` |
| `beforeStep` | Eksekusi sebelum step tertentu dari static flow bawaan dimulai | `flowKey` + `stepKey` |
| `afterStep` | Eksekusi setelah step tertentu dari static flow bawaan selesai | `flowKey` + `stepKey` |

### steps

**Tipe**: `Record<string, StepDefinition<TModel>>`  
**Wajib**: Ya  
**Deskripsi**: Definisi step flow

Mendefinisikan semua step yang termasuk dalam flow, setiap step memiliki nama key yang unik.

### defaultParams

**Tipe**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Wajib**: Tidak  
**Deskripsi**: Parameter default level flow

Saat instansiasi model (createModel), mengisi nilai awal untuk parameter step "flow saat ini". Hanya melengkapi yang hilang, tidak overwrite yang sudah ada. Bentuk return tetap: `{ [stepKey]: params }`
