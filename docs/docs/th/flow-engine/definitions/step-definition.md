:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# StepDefinition

StepDefinition คือการกำหนดขั้นตอนเดียวในโฟลว์ โดยแต่ละขั้นตอนอาจเป็นการทำงาน (action), การจัดการเหตุการณ์ (event handling) หรือการดำเนินการอื่น ๆ ครับ ขั้นตอนนี้ถือเป็นหน่วยการทำงานพื้นฐานของโฟลว์เลยครับ

## คำจำกัดความประเภท (Type Definition)

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

## วิธีการใช้งาน

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
        // โลจิกการประมวลผลที่กำหนดเอง
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## คำอธิบายคุณสมบัติ

### `key`

**ชนิด**: `string`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ตัวระบุที่ไม่ซ้ำกันสำหรับขั้นตอนภายในโฟลว์ครับ

ถ้าไม่ได้ระบุ ระบบจะใช้ชื่อคีย์ของขั้นตอนในออบเจกต์ `steps` แทนครับ

**ตัวอย่าง**:
```ts
steps: {
  loadData: {  // `key` คือ 'loadData'
    use: 'loadDataAction'
  }
}
```

### `use`

**ชนิด**: `string`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ชื่อของ ActionDefinition ที่ลงทะเบียนไว้ซึ่งต้องการนำมาใช้งานครับ

คุณสมบัติ `use` ช่วยให้คุณสามารถอ้างอิงถึงแอคชันที่ลงทะเบียนไว้ได้ ทำให้ไม่ต้องกำหนดซ้ำซ้อนครับ

**ตัวอย่าง**:
```ts
// ลงทะเบียนแอคชันก่อน
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // โลจิกสำหรับการโหลดข้อมูล
  }
});

// นำไปใช้ในขั้นตอน
steps: {
  step1: {
    use: 'loadDataAction',  // อ้างอิงถึงแอคชันที่ลงทะเบียนไว้
    title: 'Load Data'
  }
}
```

### `title`

**ชนิด**: `string`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ชื่อเรื่องที่จะแสดงสำหรับขั้นตอนครับ

ใช้สำหรับแสดงผลในส่วนติดต่อผู้ใช้ (UI) และการดีบักครับ

**ตัวอย่าง**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### `sort`

**ชนิด**: `number`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ลำดับการทำงานของขั้นตอนครับ ค่าที่น้อยกว่าจะถูกประมวลผลก่อน

ใช้เพื่อควบคุมลำดับการทำงานของหลายขั้นตอนในโฟลว์เดียวกันครับ

**ตัวอย่าง**:
```ts
steps: {
  step1: { sort: 0 },  // ทำงานเป็นอันดับแรก
  step2: { sort: 1 },  // ทำงานเป็นอันดับถัดไป
  step3: { sort: 2 }   // ทำงานเป็นอันดับสุดท้าย
}
```

### `handler`

**ชนิด**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ฟังก์ชันสำหรับจัดการขั้นตอนครับ

เมื่อไม่ได้ใช้คุณสมบัติ `use` คุณสามารถกำหนดฟังก์ชันจัดการได้โดยตรงเลยครับ

**ตัวอย่าง**:
```ts
handler: async (ctx, params) => {
  // ดึงข้อมูลบริบท (context)
  const { model, flowEngine } = ctx;
  
  // โลจิกการประมวลผล
  const result = await processData(params);
  
  // คืนค่าผลลัพธ์
  return { success: true, data: result };
}
```

### `defaultParams`

**ชนิด**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: พารามิเตอร์เริ่มต้นสำหรับขั้นตอนครับ

ก่อนที่ขั้นตอนจะทำงาน ระบบจะเติมค่าเริ่มต้นให้กับพารามิเตอร์ครับ

**ตัวอย่าง**:
```ts
// พารามิเตอร์เริ่มต้นแบบคงที่
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// พารามิเตอร์เริ่มต้นแบบไดนามิก
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// พารามิเตอร์เริ่มต้นแบบอะซิงโครนัส
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### `uiSchema`

**ชนิด**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: สคีมาการกำหนดค่า UI สำหรับขั้นตอนครับ

กำหนดวิธีการแสดงผลของขั้นตอนในส่วนติดต่อผู้ใช้ (interface) และการกำหนดค่าฟอร์มครับ

**ตัวอย่าง**:
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

### `beforeParamsSave`

**ชนิด**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่จะทำงานก่อนการบันทึกพารามิเตอร์ครับ

ฟังก์ชันนี้จะทำงานก่อนการบันทึกพารามิเตอร์ของขั้นตอนครับ ซึ่งสามารถใช้สำหรับการตรวจสอบ (validation) หรือการแปลง (transformation) พารามิเตอร์ได้

**ตัวอย่าง**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // การตรวจสอบพารามิเตอร์
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // การแปลงพารามิเตอร์
  params.name = params.name.trim().toLowerCase();
}
```

### `afterParamsSave`

**ชนิด**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่จะทำงานหลังการบันทึกพารามิเตอร์ครับ

ฟังก์ชันนี้จะทำงานหลังการบันทึกพารามิเตอร์ของขั้นตอนครับ ซึ่งสามารถใช้เพื่อกระตุ้นการทำงานอื่น ๆ ได้

**ตัวอย่าง**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // บันทึก Log
  console.log('Step params saved:', params);
  
  // กระตุ้นการทำงานอื่น ๆ
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### `uiMode`

**ชนิด**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: โหมดการแสดงผล UI สำหรับขั้นตอนครับ

ใช้ควบคุมวิธีการแสดงผลของขั้นตอนในส่วนติดต่อผู้ใช้ครับ

**โหมดที่รองรับ**:
- `'dialog'` - โหมดกล่องโต้ตอบ (Dialog)
- `'drawer'` - โหมดลิ้นชัก (Drawer)
- `'embed'` - โหมดฝังตัว (Embed)
- หรือออบเจกต์การกำหนดค่าที่กำหนดเอง

**ตัวอย่าง**:
```ts
// โหมดง่าย ๆ
uiMode: 'dialog'

// การกำหนดค่าแบบกำหนดเอง
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// โหมดไดนามิก
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### `preset`

**ชนิด**: `boolean`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ระบุว่าเป็นขั้นตอนที่ตั้งค่าไว้ล่วงหน้า (preset) หรือไม่ครับ

พารามิเตอร์สำหรับขั้นตอนที่มี `preset: true` จะต้องกรอกข้อมูลให้ครบถ้วนตั้งแต่ตอนสร้างครับ ส่วนขั้นตอนที่ไม่ได้ระบุ `preset` สามารถกรอกข้อมูลในภายหลังหลังจากสร้างโมเดลแล้วได้

**ตัวอย่าง**:
```ts
steps: {
  step1: {
    preset: true,  // ต้องกรอกพารามิเตอร์เมื่อสร้าง
    use: 'requiredAction'
  },
  step2: {
    preset: false, // สามารถกรอกพารามิเตอร์ในภายหลังได้
    use: 'optionalAction'
  }
}
```

### `paramsRequired`

**ชนิด**: `boolean`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ระบุว่าพารามิเตอร์ของขั้นตอนจำเป็นต้องระบุหรือไม่ครับ

ถ้าตั้งค่าเป็น `true` ระบบจะเปิดกล่องโต้ตอบการกำหนดค่าขึ้นมาก่อนที่จะเพิ่มโมเดลครับ

**ตัวอย่าง**:
```ts
paramsRequired: true  // ต้องกำหนดค่าพารามิเตอร์ก่อนเพิ่มโมเดล
paramsRequired: false // สามารถกำหนดค่าพารามิเตอร์ในภายหลังได้
```

### `hideInSettings`

**ชนิด**: `boolean`  
**จำเป็นต้องระบุ**: ไม่  
**คำอธิบาย**: ระบุว่าจะซ่อนขั้นตอนในเมนูการตั้งค่าหรือไม่ครับ

**ตัวอย่าง**:
```ts
hideInSettings: true  // ซ่อนในหน้าการตั้งค่า
hideInSettings: false // แสดงในหน้าการตั้งค่า (ค่าเริ่มต้น)
```

### `isAwait`

**ชนิด**: `boolean`  
**จำเป็นต้องระบุ**: ไม่  
**ค่าเริ่มต้น**: `true`  
**คำอธิบาย**: ระบุว่าจะรอให้ฟังก์ชันจัดการ (handler function) ทำงานเสร็จสิ้นหรือไม่ครับ

**ตัวอย่าง**:
```ts
isAwait: true  // รอให้ฟังก์ชันจัดการทำงานเสร็จสิ้น (ค่าเริ่มต้น)
isAwait: false // ไม่รอ, ทำงานแบบอะซิงโครนัส
```

## ตัวอย่างแบบเต็ม

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