:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Auth

## ภาพรวม

`Auth` เป็นคลาส Abstract ที่ใช้สำหรับจัดการประเภทการยืนยันตัวตนของผู้ใช้ครับ/ค่ะ โดยจะกำหนดอินเทอร์เฟซที่จำเป็นสำหรับการยืนยันตัวตนของผู้ใช้ให้สมบูรณ์ หากคุณต้องการเพิ่มประเภทการยืนยันตัวตนใหม่ๆ คุณจะต้องสืบทอดคลาส `Auth` นี้และนำเมธอดต่างๆ ไปใช้งาน สำหรับตัวอย่างการนำไปใช้งานพื้นฐาน สามารถดูได้ที่: [BaseAuth](./base-auth.md)

```ts
interface IAuth {
  user: Model;
  // ตรวจสอบสถานะการยืนยันตัวตนและส่งคืนผู้ใช้ปัจจุบัน
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: การยืนยันตัวตน
  async check() {
    // ...
  }
}
```

## คุณสมบัติของอินสแตนซ์

### `user`

ข้อมูลของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว

#### รูปแบบการใช้งาน

- `abstract user: Model`

## เมธอดของคลาส

### `constructor()`

คอนสตรักเตอร์ ใช้สำหรับสร้างอินสแตนซ์ของ `Auth`

#### รูปแบบการใช้งาน

- `constructor(config: AuthConfig)`

#### ชนิดข้อมูล

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### รายละเอียด

##### AuthConfig

| คุณสมบัติ            | ชนิดข้อมูล                                      | คำอธิบาย                                                                                                  |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | โมเดลข้อมูลของ Authenticator ครับ/ค่ะ ในแอปพลิเคชัน NocoBase ชนิดข้อมูลจริงคือ [AuthModel](/auth-verification/auth/dev/api#authmodel) |
| `options`       | `Record<string, any>`                           | การตั้งค่าที่เกี่ยวข้องกับ Authenticator                                                                  |
| `ctx`           | `Context`                                       | คอนเท็กซ์ของคำขอ (Request Context)                                                                        |

### `check()`

เมธอดนี้ใช้สำหรับยืนยันตัวตนผู้ใช้ครับ/ค่ะ โดยจะส่งคืนข้อมูลผู้ใช้กลับมา และเป็นเมธอด Abstract ที่ทุกประเภทการยืนยันตัวตนจะต้องนำไปใช้งาน

#### รูปแบบการใช้งาน

- `abstract check(): Promise<Model>`

### `signIn()`

ใช้สำหรับเข้าสู่ระบบของผู้ใช้

#### รูปแบบการใช้งาน

- `signIn(): Promise<any>`

### `signUp()`

ใช้สำหรับลงทะเบียนผู้ใช้

#### รูปแบบการใช้งาน

- `signUp(): Promise<any>`

### `signOut()`

ใช้สำหรับออกจากระบบของผู้ใช้

#### รูปแบบการใช้งาน

- `signOut(): Promise<any>`