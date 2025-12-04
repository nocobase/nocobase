:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ICollection

`ICollection` คืออินเทอร์เฟซสำหรับโมเดลข้อมูล ซึ่งรวบรวมข้อมูลต่างๆ เช่น ชื่อของโมเดล, ฟิลด์ และความสัมพันธ์ไว้ด้วยกันครับ/ค่ะ

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## สมาชิก

### repository

อินสแตนซ์ของ `Repository` ที่ `ICollection` สังกัดอยู่ครับ/ค่ะ

## API

### updateOptions()

อัปเดตคุณสมบัติของ `Collection` ครับ/ค่ะ

#### ซิกเนเจอร์

- `updateOptions(options: any): void`

### setField()

กำหนดฟิลด์ให้กับ `Collection` ครับ/ค่ะ

#### ซิกเนเจอร์

- `setField(name: string, options: any): IField`

### removeField()

ลบฟิลด์ออกจาก `Collection` ครับ/ค่ะ

#### ซิกเนเจอร์

- `removeField(name: string): void`

### getFields()

ดึงฟิลด์ทั้งหมดของ `Collection` ครับ/ค่ะ

#### ซิกเนเจอร์

- `getFields(): Array<IField>`

### getField()

ดึงฟิลด์ของ `Collection` ตามชื่อที่ระบุครับ/ค่ะ

#### ซิกเนเจอร์

- `getField(name: string): IField`