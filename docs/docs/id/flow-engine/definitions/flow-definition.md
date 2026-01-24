:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# FlowDefinition

FlowDefinition mendefinisikan struktur dasar dan konfigurasi sebuah alur kerja, menjadikannya salah satu konsep inti dari FlowEngine. Ini menjelaskan metadata, kondisi pemicu, langkah-langkah eksekusi, dan informasi lainnya dari alur kerja.

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

## Metode Pendaftaran

```ts
class MyModel extends FlowModel {}

// Daftarkan alur kerja melalui kelas model
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

## Deskripsi Properti

### key

**Tipe**: `string`  
**Wajib**: Ya  
**Deskripsi**: Pengidentifikasi unik untuk alur kerja.

Disarankan untuk menggunakan gaya penamaan `xxxSettings` yang konsisten, misalnya:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Konvensi penamaan ini mempermudah identifikasi dan pemeliharaan, serta disarankan untuk digunakan secara konsisten di seluruh proyek.

**Contoh**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul alur kerja yang mudah dibaca manusia.

Disarankan untuk mempertahankan gaya yang konsisten dengan `key`, menggunakan penamaan `Xxx settings`, misalnya:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Konvensi penamaan ini lebih jelas dan mudah dipahami, memfasilitasi tampilan antarmuka pengguna (UI) dan kolaborasi tim.

**Contoh**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Nilai Bawaan**: `false`  
**Deskripsi**: Menentukan apakah alur kerja hanya dapat dieksekusi secara manual.

- `true`: Alur kerja hanya dapat dipicu secara manual dan tidak akan dieksekusi secara otomatis.
- `false`: Alur kerja dapat dieksekusi secara otomatis (secara bawaan akan dieksekusi otomatis jika properti `on` tidak ada).

**Contoh**:
```ts
manual: true  // Hanya dieksekusi secara manual
manual: false // Dapat dieksekusi secara otomatis
```

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Nilai Bawaan**: `0`  
**Deskripsi**: Urutan eksekusi alur kerja. Semakin kecil nilainya, semakin awal dieksekusi.

Dapat berupa angka negatif, digunakan untuk mengontrol urutan eksekusi beberapa alur kerja.

**Contoh**:
```ts
sort: -1  // Dieksekusi dengan prioritas
sort: 0   // Urutan bawaan
sort: 1   // Dieksekusi belakangan
```

### on

**Tipe**: `FlowEvent<TModel>`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi event yang memungkinkan alur kerja ini dipicu oleh `dispatchEvent`.

Hanya digunakan untuk mendeklarasikan nama event pemicu (string atau `{ eventName }`), tidak termasuk fungsi penangan (handler).

**Tipe Event yang Didukung**:
- `'click'` - Event klik
- `'submit'` - Event submit
- `'reset'` - Event reset
- `'remove'` - Event hapus
- `'openView'` - Event buka tampilan
- `'dropdownOpen'` - Event buka dropdown
- `'popupScroll'` - Event scroll popup
- `'search'` - Event pencarian
- `'customRequest'` - Event permintaan kustom
- `'collapseToggle'` - Event toggle collapse
- Atau string kustom apa pun

**Contoh**:
```ts
on: 'click'  // Dipicu saat diklik
on: 'submit' // Dipicu saat disubmit
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Tipe**: `Record<string, StepDefinition<TModel>>`  
**Wajib**: Ya  
**Deskripsi**: Definisi langkah-langkah alur kerja.

Mendefinisikan semua langkah yang terkandung dalam alur kerja, dengan setiap langkah memiliki kunci unik.

**Contoh**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Tipe**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Wajib**: Tidak  
**Deskripsi**: Parameter bawaan tingkat alur kerja.

Saat model diinstansiasi (createModel), ini mengisi nilai awal untuk parameter langkah dari "alur kerja saat ini". Ini hanya mengisi nilai yang hilang dan tidak menimpa nilai yang sudah ada. Bentuk pengembalian yang tetap adalah: `{ [stepKey]: params }`

**Contoh**:
```ts
// Parameter bawaan statis
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Parameter bawaan dinamis
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Parameter bawaan asinkron
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Contoh Lengkap

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```