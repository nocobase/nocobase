:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# FlowDefinition

`FlowDefinition` กำหนดโครงสร้างพื้นฐานและการตั้งค่าของโฟลว์ ซึ่งเป็นหนึ่งในแนวคิดหลักของ Flow Engine ครับ/ค่ะ โดยจะอธิบายถึงเมตาเดตา เงื่อนไขการทริกเกอร์ และขั้นตอนการทำงานของโฟลว์

## การนิยามประเภท

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

## วิธีลงทะเบียน

```ts
class MyModel extends FlowModel {}

// ลงทะเบียนโฟลว์ผ่านคลาสโมเดล
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

## รายละเอียดคุณสมบัติ

### key

**ประเภท**: `string`  
**จำเป็น**: ใช่  
**คำอธิบาย**: ตัวระบุเฉพาะสำหรับโฟลว์

แนะนำให้ใช้รูปแบบการตั้งชื่อ `xxxSettings` ที่สอดคล้องกัน เช่น:
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

การตั้งชื่อแบบนี้ช่วยให้ระบุและบำรุงรักษาได้ง่ายขึ้น และแนะนำให้ใช้ให้สอดคล้องกันทั่วทั้งโปรเจกต์ครับ/ค่ะ

**ตัวอย่าง**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**ประเภท**: `string`  
**จำเป็น**: ไม่  
**คำอธิบาย**: ชื่อเรื่องของโฟลว์ที่มนุษย์อ่านเข้าใจได้

แนะนำให้ใช้รูปแบบการตั้งชื่อ `Xxx settings` ที่สอดคล้องกับ `key` เช่น:
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

การตั้งชื่อแบบนี้จะชัดเจนและเข้าใจง่ายขึ้น ช่วยให้การแสดงผลบน UI และการทำงานร่วมกันเป็นทีมสะดวกขึ้นครับ/ค่ะ

**ตัวอย่าง**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**ประเภท**: `boolean`  
**จำเป็น**: ไม่  
**ค่าเริ่มต้น**: `false`  
**คำอธิบาย**: กำหนดว่าโฟลว์จะทำงานด้วยตนเองเท่านั้นหรือไม่

- `true`: โฟลว์จะถูกทริกเกอร์ด้วยตนเองเท่านั้นและจะไม่ทำงานโดยอัตโนมัติ
- `false`: โฟลว์สามารถทำงานโดยอัตโนมัติได้ (หากไม่มีคุณสมบัติ `on` จะทำงานโดยอัตโนมัติเป็นค่าเริ่มต้น)

**ตัวอย่าง**:
```ts
manual: true  // ทำงานด้วยตนเองเท่านั้น
manual: false // สามารถทำงานโดยอัตโนมัติได้
```

### sort

**ประเภท**: `number`  
**จำเป็น**: ไม่  
**ค่าเริ่มต้น**: `0`  
**คำอธิบาย**: ลำดับการทำงานของโฟลว์ ค่าที่น้อยกว่าจะทำงานก่อน

สามารถใช้ค่าติดลบเพื่อควบคุมลำดับการทำงานของหลายโฟลว์ได้ครับ/ค่ะ

**ตัวอย่าง**:
```ts
sort: -1  // ทำงานก่อน
sort: 0   // ลำดับเริ่มต้น
sort: 1   // ทำงานทีหลัง
```

### on

**ประเภท**: `FlowEvent<TModel>`  
**จำเป็น**: ไม่  
**คำอธิบาย**: การตั้งค่าเหตุการณ์ที่อนุญาตให้โฟลว์นี้ถูกทริกเกอร์โดย `dispatchEvent`

ใช้สำหรับประกาศชื่อเหตุการณ์ที่จะทริกเกอร์เท่านั้น (เป็นสตริงหรือ `{ eventName }`) โดยไม่รวมฟังก์ชันสำหรับจัดการเหตุการณ์

**ประเภทเหตุการณ์ที่รองรับ**:
- `'click'` - เหตุการณ์คลิก
- `'submit'` - เหตุการณ์ส่งข้อมูล
- `'reset'` - เหตุการณ์รีเซ็ต
- `'remove'` - เหตุการณ์ลบ
- `'openView'` - เหตุการณ์เปิดมุมมอง
- `'dropdownOpen'` - เหตุการณ์เปิดดรอปดาวน์
- `'popupScroll'` - เหตุการณ์เลื่อนป๊อปอัป
- `'search'` - เหตุการณ์ค้นหา
- `'customRequest'` - เหตุการณ์คำขอที่กำหนดเอง
- `'collapseToggle'` - เหตุการณ์สลับการยุบ/ขยาย
- หรือสตริงที่กำหนดเองใดๆ

**ตัวอย่าง**:
```ts
on: 'click'  // ทริกเกอร์เมื่อคลิก
on: 'submit' // ทริกเกอร์เมื่อส่งข้อมูล
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**ประเภท**: `Record<string, StepDefinition<TModel>>`  
**จำเป็น**: ใช่  
**คำอธิบาย**: คำจำกัดความของขั้นตอนในโฟลว์

กำหนดขั้นตอนทั้งหมดที่อยู่ในโฟลว์ โดยแต่ละขั้นตอนจะมีคีย์เฉพาะตัว

**ตัวอย่าง**:
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

**ประเภท**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**จำเป็น**: ไม่  
**คำอธิบาย**: พารามิเตอร์เริ่มต้นระดับโฟลว์

เมื่อมีการสร้างอินสแตนซ์ของโมเดล (createModel) ระบบจะเติมค่าเริ่มต้นให้กับพารามิเตอร์ของขั้นตอนใน "โฟลว์ปัจจุบัน" โดยจะเติมเฉพาะค่าที่ขาดหายไปเท่านั้น ไม่มีการเขียนทับค่าที่มีอยู่แล้ว รูปแบบการคืนค่าที่แน่นอนคือ: `{ [stepKey]: params }`

**ตัวอย่าง**:
```ts
// พารามิเตอร์เริ่มต้นแบบคงที่
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// พารามิเตอร์เริ่มต้นแบบไดนามิก
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// พารามิเตอร์เริ่มต้นแบบอะซิงโครนัส
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## ตัวอย่างที่สมบูรณ์

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