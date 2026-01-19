:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# FlowModel เทียบกับ React.Component

## การเปรียบเทียบหน้าที่พื้นฐาน

| คุณสมบัติ/ความสามารถ | `React.Component`       | `FlowModel`                            |
| :------------------ | :---------------------- | :------------------------------------- |
| ความสามารถในการเรนเดอร์ | ใช่, เมธอด `render()` ใช้สร้าง UI    | ใช่, เมธอด `render()` ใช้สร้าง UI                   |
| การจัดการสถานะ (State) | มี `state` และ `setState` ในตัว | ใช้ `props` แต่การจัดการสถานะจะอิงตามโครงสร้าง Model Tree มากกว่า |
| วงจรชีวิต            | ใช่, เช่น `componentDidMount` | ใช่, เช่น `onInit`, `onMount`, `onUnmount`     |
| วัตถุประสงค์การใช้งาน   | สร้างคอมโพเนนต์ UI                | สร้าง 'Model Tree' ที่ขับเคลื่อนด้วยข้อมูล, เป็นแบบ Flow และมีโครงสร้าง |
| โครงสร้างข้อมูล      | Component Tree          | Model Tree (รองรับ Parent-Child Model, และการ Fork หลายอินสแตนซ์) |
| คอมโพเนนต์ลูก        | ใช้ JSX ในการซ้อนคอมโพเนนต์             | ใช้ `setSubModel`/`addSubModel` เพื่อกำหนด Sub-Model อย่างชัดเจน |
| พฤติกรรมแบบไดนามิก    | การผูก Event, การอัปเดตสถานะเพื่อขับเคลื่อน UI | การลงทะเบียน/ส่ง Flow, การจัดการ Auto Flow                      |
| การคงอยู่ของข้อมูล (Persistence) | ไม่มีกลไกในตัว                   | รองรับการคงอยู่ของข้อมูล (เช่น `model.save()`)                |
| รองรับการ Fork (การเรนเดอร์หลายครั้ง) | ไม่ (ต้องนำกลับมาใช้ใหม่ด้วยตนเอง)                | ใช่ (`createFork` สำหรับการสร้างหลายอินสแตนซ์)                   |
| การควบคุมโดย Engine   | ไม่มี                       | ใช่, ถูกจัดการ, ลงทะเบียน และโหลดโดย `FlowEngine`              |

## การเปรียบเทียบวงจรชีวิต

| Hook วงจรชีวิต | `React.Component`                 | `FlowModel`                                  |
| :----------- | :-------------------------------- | :------------------------------------------- |
| การเริ่มต้น    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| การยกเลิกการติดตั้ง | `componentWillUnmount`            | `onUnmount`                                  |
| การตอบสนองต่ออินพุต | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| การจัดการข้อผิดพลาด | `componentDidCatch`               | `onAutoFlowsError`                      |

## การเปรียบเทียบโครงสร้างการสร้าง

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Component Tree เทียบกับ Model Tree

*   **React Component Tree**: คือโครงสร้างการเรนเดอร์ UI ที่เกิดจากการซ้อนกันของ JSX ในขณะรันไทม์
*   **FlowModel Model Tree**: คือโครงสร้างเชิงตรรกะที่จัดการโดย FlowEngine ซึ่งสามารถคงอยู่ของข้อมูลได้ (Persist), ลงทะเบียนและควบคุม Sub-Model ได้แบบไดนามิก เหมาะสำหรับการสร้าง Page Block, Action Flow, Data Model และอื่นๆ

## คุณสมบัติพิเศษ (เฉพาะ FlowModel)

| ฟังก์ชัน                               | คำอธิบาย                     |
| :----------------------------------- | :---------------------- |
| `registerFlow`                       | ลงทะเบียน Flow             |
| `applyFlow` / `dispatchEvent`        | เรียกใช้/ทริกเกอร์ Flow             |
| `setSubModel` / `addSubModel`        | ควบคุมการสร้างและการผูก Sub-Model อย่างชัดเจน          |
| `createFork`                         | รองรับการนำ Logic ของ Model มาใช้ซ้ำเพื่อเรนเดอร์หลายครั้ง (เช่น แต่ละแถวในตาราง) |
| `openFlowSettings`                   | การตั้งค่าขั้นตอน Flow |
| `save` / `saveStepParams()`          | Model สามารถคงอยู่ของข้อมูลได้ (Persist) และเชื่อมต่อกับ Backend           |

## สรุป

| รายการ   | React.Component | FlowModel              |
| :----- | :-------------- | :--------------------- |
| สถานการณ์ที่เหมาะสม | การจัดระเบียบคอมโพเนนต์ในเลเยอร์ UI        | การจัดการ Flow และ Block ที่ขับเคลื่อนด้วยข้อมูล           |
| แนวคิดหลัก | UI แบบ Declarative          | Flow ที่มีโครงสร้างแบบ Model-Driven             |
| วิธีการจัดการ | React ควบคุมวงจรชีวิต    | FlowModel ควบคุมวงจรชีวิตและโครงสร้างของ Model |
| ข้อดี   | Ecosystem และ Toolchain ที่หลากหลาย        | มีโครงสร้างที่แข็งแกร่ง, Flow สามารถคงอยู่ของข้อมูลได้ (Persist), และ Sub-Model สามารถควบคุมได้      |

> FlowModel สามารถใช้ร่วมกับ React ได้อย่างสมบูรณ์: โดยใช้ React ในการเรนเดอร์ภายใน FlowModel ในขณะที่ FlowEngine จะเป็นผู้จัดการวงจรชีวิตและโครงสร้างของมัน