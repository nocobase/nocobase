:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การเรนเดอร์ FlowModel

`FlowModelRenderer` เป็นคอมโพเนนต์ React หลักที่ใช้สำหรับเรนเดอร์ `FlowModel` ครับ/ค่ะ โดยมีหน้าที่แปลงอินสแตนซ์ของ `FlowModel` ให้เป็นคอมโพเนนต์ React ที่แสดงผลได้

## การใช้งานพื้นฐาน

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// การใช้งานพื้นฐาน
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

สำหรับ Field Model ที่มีการควบคุม (controlled field Model) ให้ใช้ `FieldModelRenderer` ในการเรนเดอร์ครับ/ค่ะ:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// การเรนเดอร์ฟิลด์แบบควบคุม
<FieldModelRenderer model={fieldModel} />
```

## พารามิเตอร์ Props

### FlowModelRendererProps

| พารามิเตอร์ | ชนิดข้อมูล | ค่าเริ่มต้น | คำอธิบาย |
|------|------|--------|------|
| `model` | `FlowModel` | - | อินสแตนซ์ของ `FlowModel` ที่ต้องการเรนเดอร์ |
| `uid` | `string` | - | ตัวระบุเฉพาะสำหรับ Flow Model |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | เนื้อหาสำรองที่จะแสดงเมื่อเรนเดอร์ไม่สำเร็จ |
| `showFlowSettings` | `boolean \| object` | `false` | กำหนดว่าจะแสดงทางเข้าสู่การตั้งค่าเวิร์กโฟลว์หรือไม่ |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | รูปแบบการโต้ตอบสำหรับการตั้งค่าเวิร์กโฟลว์ |
| `hideRemoveInSettings` | `boolean` | `false` | กำหนดว่าจะซ่อนปุ่มลบในการตั้งค่าหรือไม่ |
| `showTitle` | `boolean` | `false` | กำหนดว่าจะแสดงชื่อ Model ที่มุมซ้ายบนของกรอบหรือไม่ |
| `skipApplyAutoFlows` | `boolean` | `false` | กำหนดว่าจะข้ามการใช้เวิร์กโฟลว์อัตโนมัติหรือไม่ |
| `inputArgs` | `Record<string, any>` | - | ข้อมูลบริบทเพิ่มเติมที่ส่งไปยัง `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | กำหนดว่าจะห่อหุ้มคอมโพเนนต์ `FlowErrorFallback` ที่เลเยอร์นอกสุดหรือไม่ |
| `settingsMenuLevel` | `number` | - | ระดับเมนูการตั้งค่า: 1=เฉพาะ Model ปัจจุบัน, 2=รวมถึง Model ย่อย |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | รายการเครื่องมือเพิ่มเติมในแถบเครื่องมือ |

### การตั้งค่าโดยละเอียดของ `showFlowSettings`

เมื่อ `showFlowSettings` เป็นออบเจกต์ จะรองรับการตั้งค่าดังต่อไปนี้ครับ/ค่ะ:

```tsx pure
showFlowSettings={{
  showBackground: true,    // แสดงพื้นหลัง
  showBorder: true,        // แสดงเส้นขอบ
  showDragHandle: true,    // แสดงตัวจับสำหรับลาก
  style: {},              // สไตล์แถบเครื่องมือที่กำหนดเอง
  toolbarPosition: 'inside' // ตำแหน่งแถบเครื่องมือ: 'inside' | 'above' | 'below'
}}
```

## วงจรชีวิตของการเรนเดอร์

วงจรชีวิตของการเรนเดอร์ทั้งหมดจะเรียกใช้เมธอดต่อไปนี้ตามลำดับครับ/ค่ะ:

1.  **model.dispatchEvent('beforeRender')** - อีเวนต์ก่อนการเรนเดอร์ (`beforeRender`)
2.  **model.render()** - เรียกใช้เมธอดเรนเดอร์ของ Model
3.  **model.onMount()** - ฮุกเมื่อคอมโพเนนต์ถูกเมาท์ (mount)
4.  **model.onUnmount()** - ฮุกเมื่อคอมโพเนนต์ถูกอันเมาท์ (unmount)

## ตัวอย่างการใช้งาน

### การเรนเดอร์พื้นฐาน

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>กำลังโหลด...</div>}
    />
  );
}
```

### การเรนเดอร์พร้อมการตั้งค่าเวิร์กโฟลว์

```tsx pure
// แสดงการตั้งค่าแต่ซ่อนปุ่มลบ
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// แสดงการตั้งค่าและชื่อเรื่อง
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// ใช้โหมดเมนูคลิกขวา
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### แถบเครื่องมือที่กำหนดเอง

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'การดำเนินการที่กำหนดเอง',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('การดำเนินการที่กำหนดเอง');
      }
    }
  ]}
/>
```

### การข้ามเวิร์กโฟลว์อัตโนมัติ

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### การเรนเดอร์ Field Model

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## การจัดการข้อผิดพลาด

`FlowModelRenderer` มีกลไกการจัดการข้อผิดพลาดที่สมบูรณ์แบบในตัวครับ/ค่ะ:

-   **ขอบเขตข้อผิดพลาดอัตโนมัติ (Automatic Error Boundary)**: เปิดใช้งาน `showErrorFallback={true}` โดยค่าเริ่มต้น
-   **ข้อผิดพลาดของเวิร์กโฟลว์อัตโนมัติ**: ดักจับและจัดการข้อผิดพลาดที่เกิดขึ้นระหว่างการทำงานของเวิร์กโฟลว์อัตโนมัติ
-   **ข้อผิดพลาดในการเรนเดอร์**: แสดงเนื้อหาสำรองเมื่อการเรนเดอร์ Model ล้มเหลว

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>การเรนเดอร์ล้มเหลว โปรดลองอีกครั้ง</div>}
/>
```

## การเพิ่มประสิทธิภาพ

### การข้ามเวิร์กโฟลว์อัตโนมัติ

สำหรับสถานการณ์ที่ไม่จำเป็นต้องใช้เวิร์กโฟลว์อัตโนมัติ คุณสามารถข้ามการทำงานส่วนนี้เพื่อเพิ่มประสิทธิภาพได้ครับ/ค่ะ:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### การอัปเดตแบบ Reactive

`FlowModelRenderer` ใช้ `observer` จาก `@formily/reactive-react` สำหรับการอัปเดตแบบ Reactive เพื่อให้มั่นใจว่าคอมโพเนนต์จะเรนเดอร์ใหม่โดยอัตโนมัติเมื่อสถานะของ Model มีการเปลี่ยนแปลงครับ/ค่ะ

## ข้อควรทราบ

1.  **การตรวจสอบ Model**: ตรวจสอบให้แน่ใจว่า `model` ที่ส่งเข้ามามีเมธอด `render` ที่ถูกต้อง
2.  **การจัดการวงจรชีวิต**: ฮุกวงจรชีวิตของ Model จะถูกเรียกใช้ในเวลาที่เหมาะสม
3.  **ขอบเขตข้อผิดพลาด (Error Boundary)**: แนะนำให้เปิดใช้งานขอบเขตข้อผิดพลาดในสภาพแวดล้อมการใช้งานจริง (production environment) เพื่อมอบประสบการณ์ผู้ใช้ที่ดีขึ้น
4.  **ข้อควรพิจารณาด้านประสิทธิภาพ**: สำหรับสถานการณ์ที่มีการเรนเดอร์ Model จำนวนมาก ควรพิจารณาใช้ตัวเลือก `skipApplyAutoFlows` ครับ/ค่ะ