:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# ActionDefinition

ActionDefinition mendefinisikan aksi yang dapat digunakan kembali, yang dapat direferensikan dalam berbagai alur kerja dan langkah. Sebuah aksi adalah unit eksekusi inti dalam FlowEngine, yang merangkum logika bisnis spesifik.

## Definisi Tipe

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Metode Pendaftaran

```ts
// Pendaftaran global (melalui FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Logika pemrosesan
  }
});

// Pendaftaran tingkat model (melalui FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logika pemrosesan
  }
});

// Penggunaan dalam alur kerja
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Mereferensikan aksi global
    },
    step2: {
      use: 'processDataAction', // Mereferensikan aksi tingkat model
    }
  }
});
```

## Deskripsi Properti

### name

**Tipe**: `string`  
**Wajib**: Ya  
**Deskripsi**: Pengidentifikasi unik untuk aksi

Digunakan untuk mereferensikan aksi dalam sebuah langkah melalui properti `use`.

**Contoh**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul tampilan untuk aksi

Digunakan untuk tampilan UI dan debugging.

**Contoh**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Tipe**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Wajib**: Ya  
**Deskripsi**: Fungsi handler untuk aksi

Logika inti dari aksi, yang menerima konteks dan parameter, dan mengembalikan hasil pemrosesan.

**Contoh**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Jalankan logika spesifik
    const result = await performAction(params);
    
    // Kembalikan hasil
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Tipe**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Wajib**: Tidak  
**Deskripsi**: Parameter default untuk aksi

Mengisi parameter dengan nilai default sebelum aksi dieksekusi.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Parameter default asinkron
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Tipe**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wajib**: Tidak  
**Deskripsi**: Skema konfigurasi UI untuk aksi

Mendefinisikan bagaimana aksi ditampilkan di UI dan konfigurasi formulirnya.

**Contoh**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Fungsi hook yang dieksekusi sebelum menyimpan parameter

Dieksekusi sebelum parameter aksi disimpan, dapat digunakan untuk validasi atau transformasi parameter.

**Contoh**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validasi parameter
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Transformasi parameter
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Catat perubahan
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Fungsi hook yang dieksekusi setelah menyimpan parameter

Dieksekusi setelah parameter aksi disimpan, dapat digunakan untuk memicu operasi lain.

**Contoh**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Catat log
  console.log('Action params saved:', params);
  
  // Picu event
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Perbarui cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tipe**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Wajib**: Tidak  
**Deskripsi**: Apakah akan menggunakan parameter mentah

Jika `true`, parameter mentah akan langsung diteruskan ke fungsi handler tanpa pemrosesan apa pun.

**Contoh**:
```ts
// Konfigurasi statis
useRawParams: true

// Konfigurasi dinamis
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Tipe**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wajib**: Tidak  
**Deskripsi**: Mode tampilan UI untuk aksi

Mengontrol bagaimana aksi ditampilkan di UI.

**Mode yang didukung**:
- `'dialog'` - Mode dialog
- `'drawer'` - Mode drawer
- `'embed'` - Mode embed
- atau objek konfigurasi kustom

**Contoh**:
```ts
// Mode sederhana
uiMode: 'dialog'

// Konfigurasi kustom
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Mode dinamis
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Tipe**: `ActionScene | ActionScene[]`  
**Wajib**: Tidak  
**Deskripsi**: Skenario penggunaan untuk aksi

Membatasi aksi untuk digunakan hanya dalam skenario tertentu.

**Skenario yang didukung**:
- `'settings'` - Skenario pengaturan
- `'runtime'` - Skenario runtime
- `'design'` - Skenario waktu desain

**Contoh**:
```ts
scene: 'settings'  // Hanya digunakan dalam skenario pengaturan
scene: ['settings', 'runtime']  // Digunakan dalam skenario pengaturan dan runtime
```

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Bobot pengurutan untuk aksi

Mengontrol urutan tampilan aksi dalam daftar. Nilai yang lebih kecil berarti posisi yang lebih tinggi.

**Contoh**:
```ts
sort: 0  // Posisi teratas
sort: 10 // Posisi tengah
sort: 100 // Posisi terbawah
```

## Contoh Lengkap

```ts
class DataProcessingModel extends FlowModel {}

// Daftarkan aksi pemuatan data
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Daftarkan aksi pemrosesan data
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```