:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ActionDefinition

`ActionDefinition` คือการกำหนดแอคชันที่สามารถนำกลับมาใช้ซ้ำได้ ซึ่งสามารถอ้างอิงได้ในหลายๆ เวิร์กโฟลว์และขั้นตอนต่างๆ ครับ แอคชันถือเป็นหน่วยการทำงานหลักใน FlowEngine ที่รวบรวมตรรกะทางธุรกิจที่เฉพาะเจาะจงไว้ด้วยกันครับ

## การกำหนดประเภท (Type Definition)

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

## วิธีการลงทะเบียน (Registration Method)

```ts
// การลงทะเบียนแบบ Global (ผ่าน FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // ตรรกะการประมวลผล
  }
});

// การลงทะเบียนระดับโมเดล (ผ่าน FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // ตรรกะการประมวลผล
  }
});

// การใช้งานในเวิร์กโฟลว์
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // อ้างอิงแอคชันแบบ Global
    },
    step2: {
      use: 'processDataAction', // อ้างอิงแอคชันระดับโมเดล
    }
  }
});
```

## คำอธิบายคุณสมบัติ (Property Descriptions)

### name

**ประเภท**: `string`  
**จำเป็น**: ใช่  
**คำอธิบาย**: ตัวระบุเฉพาะสำหรับแอคชันครับ

ใช้สำหรับอ้างอิงแอคชันในขั้นตอนต่างๆ ผ่านคุณสมบัติ `use` ครับ

**ตัวอย่าง**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**ประเภท**: `string`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ชื่อเรื่องสำหรับแสดงผลของแอคชันครับ

ใช้สำหรับการแสดงผลบน UI และการดีบักครับ

**ตัวอย่าง**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**ประเภท**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**จำเป็น**: ใช่  
**คำอธิบาย**: ฟังก์ชัน handler สำหรับแอคชันครับ

เป็นตรรกะหลักของแอคชันที่รับ context และ parameters แล้วส่งคืนผลลัพธ์ของการประมวลผลครับ

**ตัวอย่าง**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // ดำเนินการตามตรรกะที่เฉพาะเจาะจง
    const result = await performAction(params);
    
    // ส่งคืนผลลัพธ์
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

**ประเภท**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: พารามิเตอร์เริ่มต้นสำหรับแอคชันครับ

ใช้สำหรับกำหนดค่าเริ่มต้นให้กับพารามิเตอร์ก่อนที่แอคชันจะถูกดำเนินการครับ

**ตัวอย่าง**:
```ts
// พารามิเตอร์เริ่มต้นแบบ Static
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// พารามิเตอร์เริ่มต้นแบบ Dynamic
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// พารามิเตอร์เริ่มต้นแบบ Asynchronous
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

**ประเภท**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: Schema การกำหนดค่า UI สำหรับแอคชันครับ

กำหนดวิธีการแสดงผลของแอคชันใน UI และการกำหนดค่าฟอร์มครับ

**ตัวอย่าง**:
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

**ประเภท**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่ทำงานก่อนบันทึกพารามิเตอร์ครับ

จะทำงานก่อนที่พารามิเตอร์ของแอคชันจะถูกบันทึก ซึ่งสามารถใช้สำหรับการตรวจสอบหรือแปลงพารามิเตอร์ได้ครับ

**ตัวอย่าง**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // การตรวจสอบพารามิเตอร์
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // การแปลงพารามิเตอร์
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // บันทึกการเปลี่ยนแปลง
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**ประเภท**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่ทำงานหลังบันทึกพารามิเตอร์ครับ

จะทำงานหลังจากที่พารามิเตอร์ของแอคชันถูกบันทึก ซึ่งสามารถใช้เพื่อเรียกใช้งานอื่นๆ ได้ครับ

**ตัวอย่าง**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // บันทึก Log
  console.log('Action params saved:', params);
  
  // เรียกใช้งาน Event
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // อัปเดต Cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**ประเภท**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: กำหนดว่าจะใช้พารามิเตอร์แบบ Raw หรือไม่ครับ

หากเป็น `true` พารามิเตอร์แบบ Raw จะถูกส่งผ่านไปยังฟังก์ชัน handler โดยตรงโดยไม่มีการประมวลผลใดๆ ครับ

**ตัวอย่าง**:
```ts
// การตั้งค่าแบบ Static
useRawParams: true

// การตั้งค่าแบบ Dynamic
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**ประเภท**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: โหมดการแสดงผล UI สำหรับแอคชันครับ

ใช้ควบคุมวิธีการแสดงผลของแอคชันใน UI ครับ

**โหมดที่รองรับ**:
- `'dialog'` - โหมดกล่องโต้ตอบ (Dialog)
- `'drawer'` - โหมดลิ้นชัก (Drawer)
- `'embed'` - โหมดฝัง (Embed)
- หรือออบเจกต์การกำหนดค่าแบบกำหนดเอง

**ตัวอย่าง**:
```ts
// โหมดง่ายๆ
uiMode: 'dialog'

// การกำหนดค่าแบบกำหนดเอง
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// โหมด Dynamic
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**ประเภท**: `ActionScene | ActionScene[]`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: สถานการณ์การใช้งานสำหรับแอคชันครับ

ใช้จำกัดการใช้งานแอคชันให้อยู่ในสถานการณ์ที่เฉพาะเจาะจงเท่านั้นครับ

**สถานการณ์ที่รองรับ**:
- `'settings'` - สถานการณ์การตั้งค่า (Settings scene)
- `'runtime'` - สถานการณ์รันไทม์ (Runtime scene)
- `'design'` - สถานการณ์ออกแบบ (Design-time scene)

**ตัวอย่าง**:
```ts
scene: 'settings'  // ใช้เฉพาะในสถานการณ์การตั้งค่าเท่านั้น
scene: ['settings', 'runtime']  // ใช้ได้ทั้งในสถานการณ์การตั้งค่าและรันไทม์
```

### sort

**ประเภท**: `number`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: น้ำหนักการจัดเรียงสำหรับแอคชันครับ

ใช้ควบคุมลำดับการแสดงผลของแอคชันในรายการ โดยค่าที่น้อยกว่าจะแสดงผลก่อนครับ

**ตัวอย่าง**:
```ts
sort: 0  // ตำแหน่งแรกสุด
sort: 10 // ตำแหน่งกลางๆ
sort: 100 // ตำแหน่งท้ายๆ
```

## ตัวอย่างฉบับเต็ม (Complete Example)

```ts
class DataProcessingModel extends FlowModel {}

// ลงทะเบียนแอคชันโหลดข้อมูล
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

// ลงทะเบียนแอคชันประมวลผลข้อมูล
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