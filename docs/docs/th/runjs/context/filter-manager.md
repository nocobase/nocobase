:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/filter-manager)
:::

# ctx.filterManager

ตัวจัดการการเชื่อมต่อการกรอง (Filter Connection Manager) ใช้สำหรับจัดการความสัมพันธ์ในการกรองระหว่างแบบฟอร์มการกรอง (FilterForm) และบล็อกข้อมูล (ตาราง, รายการ, แผนภูมิ ฯลฯ) โดยถูกจัดเตรียมโดย `BlockGridModel` และจะใช้งานได้เฉพาะในบริบทของมันเท่านั้น (เช่น บล็อกแบบฟอร์มการกรอง, บล็อกข้อมูล)

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **บล็อกแบบฟอร์มการกรอง** | จัดการการตั้งค่าการเชื่อมต่อระหว่างรายการกรองและบล็อกเป้าหมาย รีเฟรชข้อมูลเป้าหมายเมื่อการกรองเปลี่ยนแปลง |
| **บล็อกข้อมูล (ตาราง/รายการ)** | ทำหน้าที่เป็นเป้าหมายการกรอง โดยผูกเงื่อนไขการกรองผ่าน `bindToTarget` |
| **กฎการเชื่อมโยง / FilterModel แบบกำหนดเอง** | เรียกใช้ `refreshTargetsByFilter` ภายใน `doFilter` หรือ `doReset` เพื่อกระตุ้นการรีเฟรชข้อมูลเป้าหมาย |
| **การตั้งค่าฟิลด์การเชื่อมต่อ** | ใช้ `getConnectFieldsConfig` และ `saveConnectFieldsConfig` เพื่อรักษาการจับคู่ฟิลด์ระหว่างตัวกรองและเป้าหมาย |

> หมายเหตุ: `ctx.filterManager` จะใช้งานได้เฉพาะในบริบท RunJS ที่มี `BlockGridModel` เท่านั้น (เช่น ภายในหน้าที่ประกอบด้วยแบบฟอร์มการกรอง) หากเป็น JSBlock ทั่วไปหรือหน้าอิสระจะมีค่าเป็น `undefined` แนะนำให้ใช้ optional chaining ก่อนเข้าถึงครับ

## การกำหนดประเภท (Type Definitions)

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID ของโมเดลตัวกรอง
  targetId: string;   // UID ของโมเดลบล็อกข้อมูลเป้าหมาย
  filterPaths?: string[];  // เส้นทางฟิลด์ของบล็อกเป้าหมาย
  operator?: string;  // ตัวดำเนินการกรอง (Filter operator)
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## เมธอดที่ใช้บ่อย

| เมธอด | คำอธิบาย |
|------|------|
| `getFilterConfigs()` | รับการตั้งค่าการเชื่อมต่อการกรองทั้งหมดในปัจจุบัน |
| `getConnectFieldsConfig(filterId)` | รับการตั้งค่าฟิลด์การเชื่อมต่อสำหรับตัวกรองที่ระบุ |
| `saveConnectFieldsConfig(filterId, config)` | บันทึกการตั้งค่าฟิลด์การเชื่อมต่อสำหรับตัวกรอง |
| `addFilterConfig(config)` | เพิ่มการตั้งค่าการกรอง (filterId + targetId + filterPaths) |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | ลบการตั้งค่าการกรอง ตาม filterId หรือ targetId หรือทั้งคู่ |
| `bindToTarget(targetId)` | ผูกการตั้งค่าการกรองกับบล็อกเป้าหมาย เพื่อกระตุ้นให้ resource ของบล็อกนั้นใช้การกรอง |
| `unbindFromTarget(targetId)` | ยกเลิกการผูกการกรองจากบล็อกเป้าหมาย |
| `refreshTargetsByFilter(filterId หรือ filterId[])` | รีเฟรชข้อมูลบล็อกเป้าหมายที่เกี่ยวข้องตามตัวกรอง |

## แนวคิดหลัก (Core Concepts)

- **FilterModel**: โมเดลที่ให้เงื่อนไขการกรอง (เช่น FilterFormItemModel) ซึ่งต้องมีการปรับใช้ (implement) `getFilterValue()` เพื่อส่งคืนค่าการกรองปัจจุบัน
- **TargetModel**: บล็อกข้อมูลที่ถูกกรอง โดย `resource` ของบล็อกนั้นต้องรองรับ `addFilterGroup`, `removeFilterGroup` และ `refresh`

## ตัวอย่าง

### การเพิ่มการตั้งค่าการกรอง

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### การรีเฟรชบล็อกเป้าหมาย

```ts
// ภายใน doFilter / doReset ของแบบฟอร์มการกรอง
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// รีเฟรชเป้าหมายที่เกี่ยวข้องกับหลายตัวกรอง
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### การตั้งค่าฟิลด์การเชื่อมต่อ

```ts
// รับการตั้งค่าการเชื่อมต่อ
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// บันทึกการตั้งค่าการเชื่อมต่อ
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### การลบการตั้งค่า

```ts
// ลบการตั้งค่าทั้งหมดของตัวกรองที่ระบุ
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// ลบการตั้งค่าการกรองทั้งหมดของเป้าหมายที่ระบุ
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](./resource.md): resource ของบล็อกเป้าหมายต้องรองรับอินเทอร์เฟซการกรอง
- [ctx.model](./model.md): ใช้สำหรับรับ UID ของโมเดลปัจจุบันเพื่อใช้เป็น filterId / targetId