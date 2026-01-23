:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# สตอเรจ

## ภาพรวม

คลาส `Storage` ใช้สำหรับจัดเก็บข้อมูลฝั่งไคลเอนต์ โดยจะใช้ `localStorage` เป็นค่าเริ่มต้นครับ/ค่ะ

### การใช้งานเบื้องต้น

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## เมธอดของคลาส

### `setItem()`

ใช้สำหรับจัดเก็บข้อมูลครับ/ค่ะ

#### Signature

- `setItem(key: string, value: string): void`

### `getItem()`

ใช้สำหรับดึงข้อมูลครับ/ค่ะ

#### Signature

- `getItem(key: string): string | null`

### `removeItem()`

ใช้สำหรับลบข้อมูลครับ/ค่ะ

#### Signature

- `removeItem(key: string): void`

### `clear()`

ใช้สำหรับล้างข้อมูลทั้งหมดครับ/ค่ะ

#### Signature

- `clear(): void`