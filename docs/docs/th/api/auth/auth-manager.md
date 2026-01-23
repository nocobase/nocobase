:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# AuthManager

## ภาพรวม

`AuthManager` เป็นโมดูลจัดการการยืนยันตัวตนผู้ใช้ใน NocoBase ครับ/ค่ะ ใช้สำหรับลงทะเบียนประเภทการยืนยันตัวตนผู้ใช้ที่แตกต่างกัน

### การใช้งานเบื้องต้น

```ts
const authManager = new AuthManager({
  // ใช้สำหรับดึงตัวระบุ Authenticator ปัจจุบันจาก Header ของ Request
  authKey: 'X-Authenticator',
});

// กำหนดวิธีการจัดเก็บและดึง Authenticator ของ AuthManager
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// ลงทะเบียนประเภทการยืนยันตัวตน
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// ใช้ Middleware สำหรับการยืนยันตัวตน
app.resourceManager.use(authManager.middleware());
```

### คำอธิบายแนวคิด

- **ประเภทการยืนยันตัวตน (`AuthType`)**: วิธีการยืนยันตัวตนผู้ใช้ที่แตกต่างกัน เช่น รหัสผ่าน, SMS, OIDC, SAML เป็นต้น
- **Authenticator**: เอนทิตีสำหรับวิธีการยืนยันตัวตน ซึ่งจะถูกจัดเก็บจริงในคอลเลกชัน โดยจะสอดคล้องกับบันทึกการกำหนดค่าของ `AuthType` บางประเภท วิธีการยืนยันตัวตนหนึ่งวิธีสามารถมี Authenticator ได้หลายตัว ซึ่งจะสอดคล้องกับการกำหนดค่าหลายชุด และมีวิธีการยืนยันตัวตนผู้ใช้ที่แตกต่างกัน
- **ตัวระบุ Authenticator (`Authenticator name`)**: ตัวระบุเฉพาะสำหรับ Authenticator ใช้เพื่อระบุวิธีการยืนยันตัวตนที่ใช้สำหรับ Request ปัจจุบัน

## เมธอดของคลาส

### `constructor()`

Constructor ใช้สำหรับสร้างอินสแตนซ์ของ `AuthManager` ครับ/ค่ะ

#### Signature

- `constructor(options: AuthManagerOptions)`

#### Types

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### รายละเอียด

##### AuthManagerOptions

| คุณสมบัติ  | ประเภท                        | คำอธิบาย                                         | ค่าเริ่มต้น         |
| --------- | --------------------------- | ------------------------------------------------- | ----------------- |
| `authKey` | `string`                    | ไม่บังคับ, คีย์ใน Header ของ Request ที่ใช้เก็บตัวระบุ Authenticator ปัจจุบัน | `X-Authenticator` |
| `default` | `string`                    | ไม่บังคับ, ตัวระบุ Authenticator เริ่มต้น         | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | ไม่บังคับ, สามารถกำหนดค่าได้หากใช้ JWT ในการยืนยันตัวตน | -                 |

##### JwtOptions

| คุณสมบัติ    | ประเภท   | คำอธิบาย                  | ค่าเริ่มต้น         |
| ----------- | -------- | ------------------------- | ----------------- |
| `secret`    | `string` | คีย์ลับของ Token          | `X-Authenticator` |
| `expiresIn` | `string` | ไม่บังคับ, ระยะเวลาหมดอายุของ Token | `7d`              |

### `setStorer()`

กำหนดวิธีการจัดเก็บและดึงข้อมูล Authenticator ครับ/ค่ะ

#### Signature

- `setStorer(storer: Storer)`

#### Types

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### รายละเอียด

##### Authenticator

| คุณสมบัติ   | ประเภท                | คำอธิบาย                       |
| ---------- | --------------------- | ------------------------------ |
| `authType` | `string`              | ประเภทการยืนยันตัวตน           |
| `options`  | `Record<string, any>` | การกำหนดค่าที่เกี่ยวข้องกับ Authenticator |

##### Storer

`Storer` คืออินเทอร์เฟซสำหรับการจัดเก็บ Authenticator ซึ่งมีหนึ่งเมธอดครับ/ค่ะ

- `get(name: string): Promise<Authenticator)` - ดึง Authenticator โดยใช้ตัวระบุ Authenticator ใน NocoBase ประเภทที่ส่งคืนจริงคือ [AuthModel](/auth-verification/auth/dev/api#authmodel) ครับ/ค่ะ

### `registerTypes()`

ลงทะเบียนประเภทการยืนยันตัวตนครับ/ค่ะ

#### Signature

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Types

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### รายละเอียด

| คุณสมบัติ | ประเภท             | คำอธิบาย                                     |
| ------- | ------------------ | -------------------------------------------- |
| `auth`  | `AuthExtend<Auth>` | การนำประเภทการยืนยันตัวตนไปใช้งาน, ดู [Auth](./auth) |
| `title` | `string`           | ไม่บังคับ, ชื่อเรื่องของประเภทการยืนยันตัวตนนี้ที่จะแสดงผลบนส่วนหน้า (Frontend) |

### `listTypes()`

ดึงรายการประเภทการยืนยันตัวตนที่ลงทะเบียนไว้ครับ/ค่ะ

#### Signature

- `listTypes(): { name: string; title: string }[]`

#### รายละเอียด

| คุณสมบัติ | ประเภท   | คำอธิบาย                   |
| ------- | -------- | -------------------------- |
| `name`  | `string` | ตัวระบุประเภทการยืนยันตัวตน |
| `title` | `string` | ชื่อเรื่องของประเภทการยืนยันตัวตน |

### `get()`

ดึง Authenticator ครับ/ค่ะ

#### Signature

- `get(name: string, ctx: Context)`

#### รายละเอียด

| คุณสมบัติ | ประเภท    | คำอธิบาย             |
| ------ | --------- | -------------------- |
| `name` | `string`  | ตัวระบุ Authenticator |
| `ctx`  | `Context` | บริบทของ Request     |

### `middleware()`

Middleware สำหรับการยืนยันตัวตนครับ/ค่ะ ใช้สำหรับดึง Authenticator ปัจจุบันและดำเนินการยืนยันตัวตนผู้ใช้