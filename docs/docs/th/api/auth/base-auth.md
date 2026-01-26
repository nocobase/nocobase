:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# BaseAuth

## ภาพรวม

`BaseAuth` สืบทอดมาจากคลาสแบบนามธรรม [Auth](./auth) และเป็นการนำไปใช้งานพื้นฐานสำหรับประเภทการยืนยันตัวตนผู้ใช้ โดยใช้ JWT เป็นวิธีการยืนยันตัวตน โดยส่วนใหญ่แล้ว การขยายประเภทการยืนยันตัวตนผู้ใช้สามารถทำได้โดยการสืบทอดจาก `BaseAuth` ซึ่งไม่จำเป็นต้องสืบทอดโดยตรงจากคลาสแบบนามธรรม `Auth` ครับ

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // กำหนดคอลเลกชันผู้ใช้
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // โลจิกการยืนยันตัวตนผู้ใช้ ซึ่งถูกเรียกโดย `auth.signIn`
  // ส่งคืนข้อมูลผู้ใช้
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## เมธอดของคลาส

### `constructor()`

คอนสตรักเตอร์สำหรับสร้างอินสแตนซ์ของ `BaseAuth` ครับ

#### ซิกเนเจอร์

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### รายละเอียด

| พารามิเตอร์      | ชนิด         | คำอธิบาย                                                                                                |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | ดู [Auth - AuthConfig](./auth#authconfig)                                                               |
| `userCollection` | `Collection` | คอลเลกชันผู้ใช้ เช่น `db.getCollection('users')` ดู [DataBase - Collection](../database/collection) |

### `user()`

แอคเซสเซอร์สำหรับกำหนดและดึงข้อมูลผู้ใช้ โดยค่าเริ่มต้น จะใช้ `ctx.state.currentUser` ออบเจกต์ในการเข้าถึงครับ

#### ซิกเนเจอร์

- `set user()`
- `get user()`

### `check()`

ยืนยันตัวตนผ่านโทเค็นที่ส่งมาในคำขอ และส่งคืนข้อมูลผู้ใช้ครับ

### `signIn()`

เข้าสู่ระบบผู้ใช้และสร้างโทเค็น

### `signUp()`

ลงทะเบียนผู้ใช้

### `signOut()`

ออกจากระบบผู้ใช้และทำให้โทเค็นหมดอายุ

### `validate()` \*

โลจิกหลักของการยืนยันตัวตน ซึ่งถูกเรียกโดยอินเทอร์เฟซ `signIn` เพื่อตรวจสอบว่าผู้ใช้สามารถเข้าสู่ระบบได้สำเร็จหรือไม่ครับ