---
title: "EventDefinition Definisi Event"
description: "EventDefinition mendefinisikan logika pemrosesan event dalam Flow, merespons trigger event, adalah alias dari ActionDefinition, digunakan untuk konfigurasi event Flow."
keywords: "EventDefinition,Definisi event,Event Flow,ActionDefinition,Pemrosesan event,FlowEngine,NocoBase"
---

# EventDefinition

EventDefinition mendefinisikan logika pemrosesan event dalam Flow, digunakan untuk merespons trigger event tertentu. Event adalah mekanisme penting dalam Flow Engine untuk memicu eksekusi Flow.

## Definisi Tipe

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition pada dasarnya adalah alias dari ActionDefinition, sehingga memiliki properti dan metode yang sama.

## Cara Pendaftaran

```ts
// Pendaftaran global (melalui FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logika pemrosesan event
  }
});

// Pendaftaran level model (melalui FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logika pemrosesan event
  }
});

// Penggunaan dalam Flow
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Mereferensikan event yang sudah terdaftar
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Penjelasan Properti

### name

**Tipe**: `string`  
**Wajib**: Ya  
**Deskripsi**: Identifier unik event

Digunakan untuk mereferensikan event dalam Flow melalui properti `on`.

**Contoh**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul tampilan event

Digunakan untuk tampilan UI dan debugging.

**Contoh**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Tipe**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Wajib**: Ya  
**Deskripsi**: Fungsi handler event

Logika inti dari event, menerima context dan parameter, mengembalikan hasil pemrosesan.

**Contoh**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Eksekusi logika pemrosesan event
    const result = await handleEvent(params);
    
    // Mengembalikan hasil
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**Deskripsi**: Parameter default event

Saat event terpicu, mengisi nilai default untuk parameter.

**Contoh**:
```ts
// Parameter default statis
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Parameter default dinamis
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Parameter default asynchronous
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Tipe**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wajib**: Tidak  
**Deskripsi**: Mode konfigurasi UI event

Mendefinisikan cara tampilan event di UI dan konfigurasi form.

**Contoh**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Hook function sebelum parameter disimpan

Dieksekusi sebelum parameter event disimpan, dapat digunakan untuk validasi atau konversi parameter.

**Contoh**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validasi parameter
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Konversi parameter
  params.eventType = params.eventType.toLowerCase();
  
  // Mencatat perubahan
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Hook function setelah parameter disimpan

Dieksekusi setelah parameter event disimpan, dapat digunakan untuk memicu operasi lainnya.

**Contoh**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Mencatat log
  console.log('Event params saved:', params);
  
  // Memicu event
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Memperbarui cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Tipe**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wajib**: Tidak  
**Deskripsi**: Mode tampilan UI event

Mengontrol cara tampilan event di UI.

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
    width: 600,
    title: 'Event Configuration'
  }
}

// Mode dinamis
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Tipe Event Built-in

Flow Engine memiliki tipe event umum berikut yang sudah built-in:

- `'click'` - Event klik
- `'submit'` - Event submit
- `'reset'` - Event reset
- `'remove'` - Event hapus
- `'openView'` - Event buka view
- `'dropdownOpen'` - Event dropdown terbuka
- `'popupScroll'` - Event scroll popup
- `'search'` - Event search
- `'customRequest'` - Event request kustom
- `'collapseToggle'` - Event toggle collapse

## Contoh Lengkap

```ts
class FormModel extends FlowModel {}

// Mendaftarkan event submit form
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Validasi data form
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Memproses submit form
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Mendaftarkan event perubahan data
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Mencatat perubahan data
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Memicu operasi terkait
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Menggunakan event dalam Flow
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```
