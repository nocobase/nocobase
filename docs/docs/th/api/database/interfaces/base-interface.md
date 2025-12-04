:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# BaseInterface

## ภาพรวม

`BaseInterface` เป็นคลาสพื้นฐานสำหรับ `Interface` ทุกประเภท ผู้ใช้สามารถสืบทอดคลาสนี้เพื่อนำไปใช้สร้าง `Interface` แบบกำหนดเองได้ครับ/ค่ะ

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // โค้ดสำหรับ toValue แบบกำหนดเอง
  }

  toString(value: any, ctx?: any) {
    // โค้ดสำหรับ toString แบบกำหนดเอง
  }
}
// ลงทะเบียน Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

ฟังก์ชันนี้จะแปลงสตริงภายนอกให้เป็นค่าจริงของ Interface ซึ่งค่าที่ได้สามารถส่งตรงไปยัง Repository เพื่อดำเนินการเขียนข้อมูลได้เลยครับ/ค่ะ

### toString(value: any, ctx?: any)

ฟังก์ชันนี้จะแปลงค่าจริงของ Interface ให้เป็นประเภทสตริง ซึ่งสตริงที่ได้สามารถนำไปใช้สำหรับการส่งออก (export) หรือการแสดงผลได้ครับ/ค่ะ