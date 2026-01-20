:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# เขียนปลั๊กอินแรกของคุณ

คู่มือนี้จะพาคุณสร้างปลั๊กอินประเภทบล็อกที่สามารถนำไปใช้งานบนหน้าเพจได้ตั้งแต่เริ่มต้น เพื่อช่วยให้คุณเข้าใจโครงสร้างพื้นฐานและขั้นตอนการพัฒนาปลั๊กอินของ NocoBase ครับ/ค่ะ

## ข้อกำหนดเบื้องต้น

ก่อนเริ่มต้นใช้งาน โปรดตรวจสอบให้แน่ใจว่าคุณได้ติดตั้ง NocoBase เรียบร้อยแล้ว หากยังไม่ได้ติดตั้ง สามารถดูคู่มือการติดตั้งได้จากลิงก์ด้านล่างนี้ครับ/ค่ะ:

- [ติดตั้งด้วย create-nocobase-app](/get-started/installation/create-nocobase-app)
- [ติดตั้งจาก Git source](/get-started/installation/git)

เมื่อติดตั้งเสร็จสิ้น คุณก็พร้อมที่จะเริ่มต้นเส้นทางการพัฒนาปลั๊กอินของคุณได้เลยครับ/ค่ะ

## ขั้นตอนที่ 1: สร้างโครงสร้างปลั๊กอินด้วย CLI

ในไดเรกทอรีรูทของโปรเจกต์ ให้รันคำสั่งต่อไปนี้เพื่อสร้างปลั๊กอินเปล่าอย่างรวดเร็วครับ/ค่ะ:

```bash
yarn pm create @my-project/plugin-hello
```

เมื่อคำสั่งทำงานสำเร็จ ระบบจะสร้างไฟล์พื้นฐานในไดเรกทอรี `packages/plugins/@my-project/plugin-hello` โดยมีโครงสร้างเริ่มต้นดังนี้ครับ/ค่ะ:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # ส่งออกปลั๊กอินฝั่งเซิร์ฟเวอร์โดยค่าเริ่มต้น
     ├─ client                   # ตำแหน่งเก็บโค้ดฝั่งไคลเอนต์
     │  ├─ index.tsx             # คลาสปลั๊กอินฝั่งไคลเอนต์ที่ส่งออกโดยค่าเริ่มต้น
     │  ├─ plugin.tsx            # จุดเริ่มต้นของปลั๊กอิน (สืบทอดจาก @nocobase/client Plugin)
     │  ├─ models                # ไม่บังคับ: โมเดลฝั่งฟรอนต์เอนด์ (เช่น โหนดเวิร์กโฟลว์)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # ตำแหน่งเก็บโค้ดฝั่งเซิร์ฟเวอร์
     │  ├─ index.ts              # คลาสปลั๊กอินฝั่งเซิร์ฟเวอร์ที่ส่งออกโดยค่าเริ่มต้น
     │  ├─ plugin.ts             # จุดเริ่มต้นของปลั๊กอิน (สืบทอดจาก @nocobase/server Plugin)
     │  ├─ collections           # ไม่บังคับ: คอลเลกชันฝั่งเซิร์ฟเวอร์
     │  ├─ migrations            # ไม่บังคับ: การย้ายข้อมูล (migrations)
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # ไม่บังคับ: หลายภาษา
        ├─ en-US.json
        └─ zh-CN.json
```

หลังจากสร้างปลั๊กอินเสร็จแล้ว คุณสามารถเข้าถึงหน้าจัดการปลั๊กอินในเบราว์เซอร์ (ที่อยู่เริ่มต้น: http://localhost:13000/admin/settings/plugin-manager) เพื่อตรวจสอบว่าปลั๊กอินปรากฏอยู่ในรายการแล้วหรือไม่ครับ/ค่ะ

## ขั้นตอนที่ 2: สร้างบล็อกฝั่งไคลเอนต์แบบง่าย

ต่อไป เราจะเพิ่มโมเดลบล็อกที่กำหนดเองให้กับปลั๊กอิน เพื่อแสดงข้อความต้อนรับครับ/ค่ะ

1. **สร้างไฟล์โมเดลบล็อกใหม่** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **ลงทะเบียนโมเดลบล็อก** แก้ไขไฟล์ `client/models/index.ts` เพื่อส่งออกโมเดลใหม่สำหรับการโหลดในรันไทม์ฝั่งฟรอนต์เอนด์ครับ/ค่ะ:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

หลังจากบันทึกโค้ดแล้ว หากคุณกำลังรันสคริปต์สำหรับการพัฒนา คุณจะเห็นบันทึกการอัปเดตแบบ Hot-reload ในเทอร์มินัลครับ/ค่ะ

## ขั้นตอนที่ 3: เปิดใช้งานและทดลองปลั๊กอิน

คุณสามารถเปิดใช้งานปลั๊กอินได้ทั้งทางคอมมานด์ไลน์หรือผ่านหน้าจอผู้ใช้งานครับ/ค่ะ:

- **คอมมานด์ไลน์**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **หน้าจอการจัดการ** (Management Interface): เข้าไปที่หน้าจัดการปลั๊กอิน ค้นหา `@my-project/plugin-hello` แล้วคลิก “เปิดใช้งาน” ครับ/ค่ะ

หลังจากเปิดใช้งานแล้ว ให้สร้างหน้าเพจใหม่ประเภท 「Modern page (v2)」 เมื่อเพิ่มบล็อก คุณจะเห็น 「Hello block」 ปรากฏขึ้นมา ให้แทรกบล็อกนี้ลงในหน้าเพจ คุณก็จะเห็นข้อความต้อนรับที่คุณเพิ่งเขียนไปครับ/ค่ะ

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## ขั้นตอนที่ 4: Build และ Package

เมื่อคุณพร้อมที่จะเผยแพร่ปลั๊กอินไปยังสภาพแวดล้อมอื่น ๆ คุณจะต้องทำการ Build และ Package ก่อนครับ/ค่ะ:

```bash
yarn build @my-project/plugin-hello --tar
# หรือทำสองขั้นตอน
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> เคล็ดลับ: หากปลั๊กอินถูกสร้างขึ้นใน Source Repository การ Build ครั้งแรกจะกระตุ้นการตรวจสอบประเภท (Type Check) ของทั้ง Repository ซึ่งอาจใช้เวลานานพอสมควร ขอแนะนำให้ตรวจสอบว่าได้ติดตั้ง Dependencies ครบถ้วนแล้ว และ Repository อยู่ในสถานะที่พร้อมสำหรับการ Build ครับ/ค่ะ

เมื่อ Build เสร็จสิ้น ไฟล์ Package จะอยู่ที่ `storage/tar/@my-project/plugin-hello.tar.gz` โดยค่าเริ่มต้นครับ/ค่ะ

## ขั้นตอนที่ 5: อัปโหลดไปยังแอปพลิเคชัน NocoBase อื่น

อัปโหลดและแตกไฟล์ไปยังไดเรกทอรี `./storage/plugins` ของแอปพลิเคชันเป้าหมาย สำหรับรายละเอียดเพิ่มเติม โปรดดูที่ [การติดตั้งและอัปเกรดปลั๊กอิน](../get-started/install-upgrade-plugins.mdx) ครับ/ค่ะ