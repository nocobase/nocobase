:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การอ้างอิง API

## ฝั่งเซิร์ฟเวอร์

### Auth

เป็น API หลักของระบบครับ ดูรายละเอียดเพิ่มเติมได้ที่: [Auth](/api/auth/auth)

### BaseAuth

เป็น API หลักของระบบครับ ดูรายละเอียดเพิ่มเติมได้ที่: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### ภาพรวม

`AuthModel` คือโมเดลข้อมูลของ Authenticator (ตัวรับรองความถูกต้อง) ที่ใช้ในแอปพลิเคชัน NocoBase ครับ (ดูเพิ่มเติมที่: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) และ [Auth - constructor](/api/auth/auth#constructor)) ซึ่งมีเมธอดสำหรับโต้ตอบกับตารางข้อมูลผู้ใช้ นอกจากนี้ คุณยังสามารถใช้เมธอดที่ Sequelize Model มีให้ได้อีกด้วยครับ

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### เมธอดของคลาส

- `findUser(uuid: string): UserModel` - ใช้สำหรับค้นหาผู้ใช้ด้วย `uuid` ครับ
  - `uuid` - ตัวระบุเฉพาะของผู้ใช้ที่มาจากประเภทการรับรองความถูกต้องปัจจุบันครับ

- `newUser(uuid: string, userValues?: any): UserModel` - ใช้สำหรับสร้างผู้ใช้ใหม่ และผูกผู้ใช้เข้ากับ Authenticator ปัจจุบันผ่าน `uuid` ครับ
  - `uuid` - ตัวระบุเฉพาะของผู้ใช้ที่มาจากประเภทการรับรองความถูกต้องปัจจุบันครับ
  - `userValues` - ไม่บังคับครับ ข้อมูลผู้ใช้อื่นๆ หากไม่ได้ส่งค่ามา จะใช้ `uuid` เป็นชื่อเล่นของผู้ใช้แทนครับ

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - ใช้สำหรับค้นหาหรือสร้างผู้ใช้ใหม่ครับ โดยมีกฎการสร้างเหมือนกับที่กล่าวมาข้างต้น
  - `uuid` - ตัวระบุเฉพาะของผู้ใช้ที่มาจากประเภทการรับรองความถูกต้องปัจจุบันครับ
  - `userValues` - ไม่บังคับครับ ข้อมูลผู้ใช้อื่นๆ

## ฝั่งไคลเอนต์

### `plugin.registerType()`

ใช้สำหรับลงทะเบียนไคลเอนต์ของประเภทการรับรองความถูกต้องครับ

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### รูปแบบการใช้งาน (Signature)

- `registerType(authType: string, options: AuthOptions)`

#### ประเภท (Type)

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### รายละเอียด

- `SignInForm` - ฟอร์มสำหรับเข้าสู่ระบบ
- `SignInButton` - ปุ่มเข้าสู่ระบบ (ของบุคคลที่สาม) ซึ่งสามารถเลือกใช้แทนฟอร์มเข้าสู่ระบบได้ครับ
- `SignUpForm` - ฟอร์มสำหรับลงทะเบียน
- `AdminSettingsForm` - ฟอร์มการตั้งค่าสำหรับผู้ดูแลระบบ

### Route (เส้นทาง)

ปลั๊กอิน Auth จะลงทะเบียนเส้นทาง (Route) ฝั่ง Frontend ไว้ดังนี้ครับ:

- เลย์เอาต์ของ Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- หน้าเข้าสู่ระบบ
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- หน้าลงทะเบียน
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`