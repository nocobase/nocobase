:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Migration สคริปต์สำหรับการอัปเกรด

ในระหว่างการพัฒนาและอัปเดตปลั๊กอินของ NocoBase โครงสร้างฐานข้อมูลหรือการตั้งค่าของปลั๊กอินอาจมีการเปลี่ยนแปลงที่ไม่เข้ากัน เพื่อให้การอัปเกรดเป็นไปอย่างราบรื่น NocoBase จึงมีกลไก **Migration** ที่ช่วยจัดการการเปลี่ยนแปลงเหล่านี้ผ่านการเขียนไฟล์ migration คู่มือนี้จะช่วยให้คุณเข้าใจวิธีการใช้งานและขั้นตอนการพัฒนา Migration ได้อย่างเป็นระบบครับ/ค่ะ

## แนวคิดของ Migration

Migration คือสคริปต์ที่จะทำงานโดยอัตโนมัติเมื่อมีการอัปเกรดปลั๊กอิน เพื่อแก้ไขปัญหาดังต่อไปนี้ครับ/ค่ะ:

- การปรับโครงสร้างตารางข้อมูล (เช่น การเพิ่มฟิลด์, การแก้ไขประเภทฟิลด์)
- การย้ายข้อมูล (เช่น การอัปเดตค่าฟิลด์จำนวนมาก)
- การอัปเดตการตั้งค่าปลั๊กอินหรือตรรกะภายใน

ช่วงเวลาในการทำงานของ Migration แบ่งออกเป็น 3 ประเภทครับ/ค่ะ:

| ประเภท | ช่วงเวลาที่ถูกเรียกใช้งาน | สถานการณ์การทำงาน |
|------|-----------------------|-------------------|
| `beforeLoad` | ก่อนการโหลดการตั้งค่าปลั๊กอินทั้งหมด |                   |
| `afterSync`  | หลังจากที่การตั้งค่าคอลเลกชันถูกซิงค์กับฐานข้อมูล (โครงสร้างคอลเลกชันมีการเปลี่ยนแปลงแล้ว) | |
| `afterLoad`  | หลังจากที่การตั้งค่าปลั๊กอินทั้งหมดถูกโหลด |                   |

## การสร้างไฟล์ Migration

ไฟล์ Migration ควรอยู่ในไดเรกทอรีปลั๊กอินที่ `src/server/migrations/*.ts` ครับ/ค่ะ NocoBase มีคำสั่ง `create-migration` เพื่อช่วยสร้างไฟล์ migration ได้อย่างรวดเร็ว

```bash
yarn nocobase create-migration [options] <name>
```

พารามิเตอร์เสริม

| พารามิเตอร์ | คำอธิบาย |
|-------------|----------|
| `--pkg <pkg>` | ระบุชื่อแพ็กเกจปลั๊กอิน |
| `--on [on]`  | ระบุช่วงเวลาที่ทำงาน, ตัวเลือก: `beforeLoad`, `afterSync`, `afterLoad` |

ตัวอย่าง

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

เส้นทางของไฟล์ migration ที่สร้างขึ้นจะเป็นดังนี้ครับ/ค่ะ:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

เนื้อหาเริ่มต้นของไฟล์:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // เขียนตรรกะการอัปเกรดที่นี่
  }
}
```

> ⚠️ `appVersion` ใช้เพื่อระบุเวอร์ชันที่การอัปเกรดนี้มุ่งเป้าไปถึงครับ/ค่ะ โดยสภาพแวดล้อมที่มีเวอร์ชันต่ำกว่าที่ระบุจะทำการรัน migration นี้

## การเขียน Migration

ในไฟล์ Migration คุณสามารถเข้าถึงคุณสมบัติและ API ที่ใช้งานบ่อยดังต่อไปนี้ผ่าน `this` เพื่อความสะดวกในการจัดการฐานข้อมูล, ปลั๊กอิน และอินสแตนซ์ของแอปพลิเคชันครับ/ค่ะ:

คุณสมบัติที่ใช้งานบ่อย

- **`this.app`**  
  อินสแตนซ์ของแอปพลิเคชัน NocoBase ปัจจุบัน ใช้สำหรับเข้าถึงบริการส่วนกลาง, ปลั๊กอิน หรือการตั้งค่าต่างๆ ครับ/ค่ะ
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  อินสแตนซ์ของบริการฐานข้อมูล มีอินเทอร์เฟซสำหรับจัดการโมเดล (คอลเลกชัน) ครับ/ค่ะ
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  อินสแตนซ์ของปลั๊กอินปัจจุบัน ใช้สำหรับเข้าถึงเมธอดที่กำหนดเองของปลั๊กอินครับ/ค่ะ
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  อินสแตนซ์ของ Sequelize สามารถใช้รัน SQL ดิบหรือดำเนินการแบบ transaction ได้โดยตรงครับ/ค่ะ
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface ของ Sequelize ซึ่งมักใช้ในการแก้ไขโครงสร้างตาราง เช่น การเพิ่มฟิลด์ หรือการลบตาราง เป็นต้นครับ/ค่ะ
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

ตัวอย่างการเขียน Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // ใช้ queryInterface เพื่อเพิ่มฟิลด์
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // ใช้ db เพื่อเข้าถึงโมเดลข้อมูล
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // รันเมธอดที่กำหนดเองของปลั๊กอิน
    await this.plugin.customMethod();
  }
}
```

นอกเหนือจากคุณสมบัติที่ใช้งานบ่อยที่กล่าวมาข้างต้น Migration ยังมี API ที่หลากหลายให้ใช้งานอีกด้วยครับ/ค่ะ สำหรับเอกสารประกอบโดยละเอียด โปรดดูที่ [Migration API](/api/server/migration)

## การเรียกใช้งาน Migration

การทำงานของ Migration จะถูกเรียกใช้งานโดยคำสั่ง `nocobase upgrade` ครับ/ค่ะ:

```bash
$ yarn nocobase upgrade
```

เมื่อทำการอัปเกรด ระบบจะพิจารณาลำดับการทำงานตามประเภทของ Migration และ `appVersion` ครับ/ค่ะ

## การทดสอบ Migration

ในการพัฒนาปลั๊กอิน ขอแนะนำให้ใช้ **Mock Server** เพื่อทดสอบว่า migration ทำงานได้อย่างถูกต้องหรือไม่ เพื่อหลีกเลี่ยงความเสียหายต่อข้อมูลจริงครับ/ค่ะ

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // ชื่อปลั๊กอิน
      version: '0.18.0-alpha.5', // เวอร์ชันก่อนการอัปเกรด
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // เขียนตรรกะการตรวจสอบ เช่น ตรวจสอบว่ามีฟิลด์อยู่หรือไม่ ข้อมูลย้ายสำเร็จหรือไม่
  });
});
```

> Tip: การใช้ Mock Server ช่วยให้คุณจำลองสถานการณ์การอัปเกรดได้อย่างรวดเร็ว และตรวจสอบลำดับการทำงานของ Migration รวมถึงการเปลี่ยนแปลงข้อมูลได้ครับ/ค่ะ

## ข้อแนะนำในการพัฒนา

1.  **แบ่ง Migration**  
    พยายามสร้างไฟล์ migration หนึ่งไฟล์ต่อการอัปเกรดหนึ่งครั้ง เพื่อรักษาความเป็นอิสระและช่วยให้การแก้ไขปัญหาง่ายขึ้นครับ/ค่ะ
2.  **ระบุช่วงเวลาที่ทำงาน**  
    เลือก `beforeLoad`, `afterSync` หรือ `afterLoad` ตามวัตถุประสงค์ของการทำงาน เพื่อหลีกเลี่ยงการพึ่งพาโมดูลที่ยังไม่ได้โหลดครับ/ค่ะ
3.  **ใส่ใจเรื่องการควบคุมเวอร์ชัน**  
    ใช้ `appVersion` เพื่อระบุเวอร์ชันที่ migration นี้ใช้งานได้อย่างชัดเจน เพื่อป้องกันการทำงานซ้ำซ้อนครับ/ค่ะ
4.  **ครอบคลุมการทดสอบ**  
    หลังจากตรวจสอบ migration บน Mock Server แล้ว ค่อยดำเนินการอัปเกรดในสภาพแวดล้อมจริงครับ/ค่ะ