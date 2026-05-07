---
title: "ActionDefinition Definisi Action"
description: "ActionDefinition mendefinisikan action yang dapat digunakan ulang, dapat direferensikan di banyak Flow dan Step, merangkum handler, uiSchema, defaultParams, unit eksekusi inti FlowEngine."
keywords: "ActionDefinition,Definisi action,handler,uiSchema,defaultParams,Flow Step,FlowEngine,NocoBase"
---

# ActionDefinition

ActionDefinition mendefinisikan action yang dapat digunakan ulang. Action ini dapat direferensikan di banyak Flow dan Step. Action adalah unit eksekusi inti dalam Flow Engine, yang merangkum logika bisnis spesifik.

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

## Cara Pendaftaran

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

// Pendaftaran level model (melalui FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logika pemrosesan
  }
});

// Penggunaan dalam Flow
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Mereferensikan action global
    },
    step2: {
      use: 'processDataAction', // Mereferensikan action level model
    }
  }
});
```

## Penjelasan Properti

### name

**Tipe**: `string`  
**Wajib**: Ya  
**Deskripsi**: Identifier unik untuk action

Digunakan untuk mereferensikan action dalam step melalui properti `use`.

**Contoh**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul tampilan action

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
**Deskripsi**: Fungsi handler action

Logika inti dari action, menerima context dan parameter, mengembalikan hasil pemrosesan.

**Contoh**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Eksekusi logika spesifik
    const result = await performAction(params);
    
    // Mengembalikan hasil
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
**Deskripsi**: Parameter default action

Sebelum action dieksekusi, mengisi nilai default untuk parameter.

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

// Parameter default asynchronous
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
**Deskripsi**: Mode konfigurasi UI action

Mendefinisikan cara tampilan action di UI dan konfigurasi form.

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
**Deskripsi**: Hook function sebelum parameter disimpan

Dieksekusi sebelum parameter action disimpan, dapat digunakan untuk validasi atau konversi parameter.

**Contoh**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validasi parameter
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Konversi parameter
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Mencatat perubahan
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Hook function setelah parameter disimpan

Dieksekusi setelah parameter action disimpan, dapat digunakan untuk memicu operasi lainnya.

**Contoh**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Mencatat log
  console.log('Action params saved:', params);
  
  // Memicu event
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Memperbarui cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tipe**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Wajib**: Tidak  
**Deskripsi**: Apakah menggunakan parameter mentah

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
**Deskripsi**: Mode tampilan UI action

Mengontrol cara tampilan action di UI.

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
**Deskripsi**: Skenario penggunaan action

Membatasi action untuk digunakan dalam skenario tertentu saja.

**Skenario yang didukung**:
- `'settings'` - Skenario pengaturan
- `'runtime'` - Skenario runtime
- `'design'` - Skenario design

**Contoh**:
```ts
scene: 'settings'  // Hanya digunakan dalam skenario pengaturan
scene: ['settings', 'runtime']  // Digunakan dalam skenario pengaturan dan runtime
```

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Bobot sorting action

Digunakan untuk mengontrol urutan tampilan action di list. Semakin kecil nilai, semakin awal posisinya.

**Contoh**:
```ts
sort: 0  // Paling awal
sort: 10 // Posisi tengah
sort: 100 // Lebih akhir
```

## Contoh Lengkap

```ts
class DataProcessingModel extends FlowModel {}

// Mendaftarkan action loading data
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

// Mendaftarkan action pemrosesan data
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
