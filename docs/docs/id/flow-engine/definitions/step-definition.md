:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# StepDefinition

`StepDefinition` mendefinisikan satu langkah dalam sebuah alur kerja. Setiap langkah dapat berupa sebuah tindakan (action), penanganan kejadian (event handling), atau operasi lainnya. Sebuah langkah adalah unit eksekusi dasar dari sebuah alur kerja.

## Definisi Tipe

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Cara Penggunaan

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Logika pemrosesan kustom
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Deskripsi Properti

### key

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Pengidentifikasi unik untuk langkah dalam alur kerja.

Jika tidak disediakan, nama kunci (key name) dari langkah dalam objek `steps` akan digunakan.

**Contoh**:
```ts
steps: {
  loadData: {  // key adalah 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Nama `ActionDefinition` yang terdaftar untuk digunakan.

Properti `use` memungkinkan Anda untuk mereferensikan tindakan (action) yang sudah terdaftar, menghindari definisi berulang.

**Contoh**:
```ts
// Daftarkan tindakan terlebih dahulu
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logika pemuatan data
  }
});

// Gunakan dalam sebuah langkah
steps: {
  step1: {
    use: 'loadDataAction',  // Mereferensikan tindakan yang terdaftar
    title: 'Load Data'
  }
}
```

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul tampilan untuk langkah.

Digunakan untuk tampilan antarmuka pengguna (UI) dan debugging.

**Contoh**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Urutan eksekusi langkah. Semakin kecil nilainya, semakin awal dieksekusi.

Digunakan untuk mengontrol urutan eksekusi beberapa langkah dalam alur kerja yang sama.

**Contoh**:
```ts
steps: {
  step1: { sort: 0 },  // Dieksekusi pertama
  step2: { sort: 1 },  // Dieksekusi berikutnya
  step3: { sort: 2 }   // Dieksekusi terakhir
}
```

### handler

**Tipe**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Wajib**: Tidak  
**Deskripsi**: Fungsi handler untuk langkah.

Ketika properti `use` tidak digunakan, Anda dapat langsung mendefinisikan fungsi handler.

**Contoh**:
```ts
handler: async (ctx, params) => {
  // Dapatkan informasi konteks
  const { model, flowEngine } = ctx;
  
  // Logika pemrosesan
  const result = await processData(params);
  
  // Kembalikan hasil
  return { success: true, data: result };
}
```

### defaultParams

**Tipe**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Wajib**: Tidak  
**Deskripsi**: Parameter default untuk langkah.

Mengisi parameter dengan nilai default sebelum langkah dieksekusi.

**Contoh**:
```ts
// Parameter default statis
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Parameter default dinamis
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Parameter default asinkron
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Tipe**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wajib**: Tidak  
**Deskripsi**: Skema konfigurasi UI untuk langkah.

Mendefinisikan bagaimana langkah ditampilkan di antarmuka dan konfigurasi formulirnya.

**Contoh**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Fungsi hook yang berjalan sebelum parameter disimpan.

Dieksekusi sebelum parameter langkah disimpan, dan dapat digunakan untuk validasi atau transformasi parameter.

**Contoh**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validasi parameter
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Transformasi parameter
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Fungsi hook yang berjalan setelah parameter disimpan.

Dieksekusi setelah parameter langkah disimpan, dan dapat digunakan untuk memicu operasi lain.

**Contoh**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Catat log
  console.log('Step params saved:', params);
  
  // Memicu operasi lain
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Tipe**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wajib**: Tidak  
**Deskripsi**: Mode tampilan UI untuk langkah.

Mengontrol bagaimana langkah ditampilkan di antarmuka.

**Mode yang didukung**:
- `'dialog'` - Mode dialog
- `'drawer'` - Mode drawer
- `'embed'` - Mode embed
- Atau objek konfigurasi kustom

**Contoh**:
```ts
// Mode sederhana
uiMode: 'dialog'

// Konfigurasi kustom
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Mode dinamis
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Menentukan apakah ini adalah langkah prasetel (preset).

Parameter untuk langkah dengan `preset: true` perlu diisi saat pembuatan. Langkah yang tidak ditandai dengan ini dapat diisi setelah model dibuat.

**Contoh**:
```ts
steps: {
  step1: {
    preset: true,  // Parameter harus diisi saat pembuatan
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameter dapat diisi nanti
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Menentukan apakah parameter langkah wajib diisi.

Jika `true`, dialog konfigurasi akan terbuka sebelum menambahkan model.

**Contoh**:
```ts
paramsRequired: true  // Parameter harus dikonfigurasi sebelum menambahkan model
paramsRequired: false // Parameter dapat dikonfigurasi nanti
```

### hideInSettings

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Menentukan apakah langkah disembunyikan di menu pengaturan.

**Contoh**:
```ts
hideInSettings: true  // Sembunyikan di pengaturan
hideInSettings: false // Tampilkan di pengaturan (default)
```

### isAwait

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Nilai Default**: `true`  
**Deskripsi**: Menentukan apakah akan menunggu fungsi handler selesai.

**Contoh**:
```ts
isAwait: true  // Tunggu fungsi handler selesai (default)
isAwait: false // Jangan tunggu, eksekusi secara asinkron
```

## Contoh Lengkap

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```