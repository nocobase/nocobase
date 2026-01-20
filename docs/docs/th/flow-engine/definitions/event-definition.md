:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# EventDefinition

`EventDefinition` กำหนดตรรกะการจัดการเหตุการณ์ในโฟลว์ ซึ่งใช้เพื่อตอบสนองต่อการทริกเกอร์เหตุการณ์ที่เฉพาะเจาะจง เหตุการณ์เป็นกลไกสำคัญใน FlowEngine สำหรับการทริกเกอร์การทำงานของโฟลว์ครับ/ค่ะ

## ประเภทที่กำหนด (Type Definition)

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` เป็นชื่อเรียกแทน (alias) ของ `ActionDefinition` ครับ/ค่ะ ดังนั้นจึงมีคุณสมบัติและเมธอดเหมือนกัน

## วิธีการลงทะเบียน

```ts
// การลงทะเบียนแบบ Global (ผ่าน FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // ตรรกะการจัดการเหตุการณ์
  }
});

// การลงทะเบียนระดับโมเดล (ผ่าน FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // ตรรกะการจัดการเหตุการณ์
  }
});

// การใช้งานในโฟลว์
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // อ้างอิงถึงเหตุการณ์ที่ลงทะเบียนไว้แล้ว
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## คำอธิบายคุณสมบัติ

### name

**ประเภท**: `string`  
**จำเป็น**: ใช่  
**คำอธิบาย**: ตัวระบุเฉพาะของเหตุการณ์

ใช้สำหรับอ้างอิงเหตุการณ์ในโฟลว์ผ่านคุณสมบัติ `on` ครับ/ค่ะ

**ตัวอย่าง**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**ประเภท**: `string`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ชื่อเรื่องสำหรับแสดงผลของเหตุการณ์

ใช้สำหรับการแสดงผลใน UI และการดีบักครับ/ค่ะ

**ตัวอย่าง**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**ประเภท**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**จำเป็น**: ใช่  
**คำอธิบาย**: ฟังก์ชันสำหรับจัดการเหตุการณ์

เป็นตรรกะหลักของเหตุการณ์ครับ/ค่ะ โดยจะรับค่า Context และ Parameters แล้วส่งคืนผลลัพธ์ของการประมวลผล

**ตัวอย่าง**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // ดำเนินการตรรกะการจัดการเหตุการณ์
    const result = await handleEvent(params);
    
    // ส่งคืนผลลัพธ์
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

**ประเภท**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: พารามิเตอร์เริ่มต้นสำหรับเหตุการณ์

ใช้สำหรับกำหนดค่าเริ่มต้นให้กับพารามิเตอร์เมื่อเหตุการณ์ถูกทริกเกอร์ครับ/ค่ะ

**ตัวอย่าง**:
```ts
// พารามิเตอร์เริ่มต้นแบบ Static
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// พารามิเตอร์เริ่มต้นแบบ Dynamic
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// พารามิเตอร์เริ่มต้นแบบ Asynchronous
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**ประเภท**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: Schema การกำหนดค่า UI สำหรับเหตุการณ์

กำหนดวิธีการแสดงผลของเหตุการณ์ใน UI และการตั้งค่าฟอร์มครับ/ค่ะ

**ตัวอย่าง**:
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

**ประเภท**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่ทำงานก่อนบันทึกพารามิเตอร์

จะทำงานก่อนที่พารามิเตอร์ของเหตุการณ์จะถูกบันทึกครับ/ค่ะ สามารถใช้สำหรับการตรวจสอบความถูกต้องของพารามิเตอร์หรือการแปลงค่าได้

**ตัวอย่าง**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // การตรวจสอบพารามิเตอร์
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // การแปลงพารามิเตอร์
  params.eventType = params.eventType.toLowerCase();
  
  // บันทึกการเปลี่ยนแปลง
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**ประเภท**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: ฟังก์ชัน Hook ที่ทำงานหลังบันทึกพารามิเตอร์

จะทำงานหลังจากที่พารามิเตอร์ของเหตุการณ์ถูกบันทึกครับ/ค่ะ สามารถใช้เพื่อทริกเกอร์การดำเนินการอื่นๆ ได้

**ตัวอย่าง**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // บันทึก Log
  console.log('Event params saved:', params);
  
  // ทริกเกอร์เหตุการณ์
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // อัปเดตแคช
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**ประเภท**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**จำเป็น**: ไม่ใช่  
**คำอธิบาย**: โหมดการแสดงผล UI สำหรับเหตุการณ์

ควบคุมวิธีการแสดงผลของเหตุการณ์ใน UI ครับ/ค่ะ

**โหมดที่รองรับ**:
- `'dialog'` - โหมดกล่องโต้ตอบ (Dialog)
- `'drawer'` - โหมดลิ้นชัก (Drawer)
- `'embed'` - โหมดฝังตัว (Embed)
- หรือออบเจกต์การกำหนดค่าแบบกำหนดเอง

**ตัวอย่าง**:
```ts
// โหมดง่ายๆ
uiMode: 'dialog'

// การกำหนดค่าแบบกำหนดเอง
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// โหมด Dynamic
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## ประเภทเหตุการณ์ในตัว (Built-in Event Types)

FlowEngine มีประเภทเหตุการณ์ที่ใช้บ่อยดังต่อไปนี้ในตัวครับ/ค่ะ:

- `'click'` - เหตุการณ์คลิก
- `'submit'` - เหตุการณ์ส่งข้อมูล
- `'reset'` - เหตุการณ์รีเซ็ต
- `'remove'` - เหตุการณ์ลบ
- `'openView'` - เหตุการณ์เปิดมุมมอง
- `'dropdownOpen'` - เหตุการณ์เปิด Dropdown
- `'popupScroll'` - เหตุการณ์เลื่อน Popup
- `'search'` - เหตุการณ์ค้นหา
- `'customRequest'` - เหตุการณ์คำขอแบบกำหนดเอง
- `'collapseToggle'` - เหตุการณ์สลับการยุบ/ขยาย

## ตัวอย่างฉบับเต็ม

```ts
class FormModel extends FlowModel {}

// ลงทะเบียนเหตุการณ์ส่งฟอร์ม
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูลฟอร์ม
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // ประมวลผลการส่งฟอร์ม
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

// ลงทะเบียนเหตุการณ์ข้อมูลเปลี่ยนแปลง
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // บันทึกการเปลี่ยนแปลงข้อมูล
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // ทริกเกอร์การดำเนินการที่เกี่ยวข้อง
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

// การใช้งานเหตุการณ์ในโฟลว์
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