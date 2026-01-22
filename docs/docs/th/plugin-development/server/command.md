:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Command (คำสั่ง)

ใน NocoBase, Command (คำสั่ง) ใช้สำหรับรันการทำงานผ่าน Command Line ที่เกี่ยวข้องกับแอปพลิเคชันหรือปลั๊กอินครับ/ค่ะ เช่น การรันงานระบบ, การย้ายข้อมูล (migration) หรือการซิงค์ข้อมูล, การตั้งค่าเริ่มต้น (initialization), หรือการโต้ตอบกับอินสแตนซ์ของแอปพลิเคชันที่กำลังทำงานอยู่ นักพัฒนาสามารถกำหนด Command แบบกำหนดเองสำหรับปลั๊กอินได้ และลงทะเบียนผ่านออบเจกต์ `app` โดยจะรันผ่าน CLI ในรูปแบบ `nocobase <command>` ครับ/ค่ะ

## ประเภทของ Command

ใน NocoBase การลงทะเบียน Command แบ่งออกเป็น 2 ประเภทหลักๆ ครับ/ค่ะ:

| ประเภท | วิธีการลงทะเบียน | จำเป็นต้องเปิดใช้งานปลั๊กอินหรือไม่ | สถานการณ์ทั่วไป |
|------|------------|------------------|-----------|
| Dynamic Command | `app.command()` | ✅ ใช่ | Command ที่เกี่ยวข้องกับธุรกิจของปลั๊กอิน |
| Static Command | `Application.registerStaticCommand()` | ❌ ไม่ | Command สำหรับการติดตั้ง, การตั้งค่าเริ่มต้น, การบำรุงรักษา |

## Dynamic Command

เราใช้ `app.command()` เพื่อกำหนด Command ของปลั๊กอินครับ/ค่ะ โดย Command เหล่านี้จะทำงานได้ก็ต่อเมื่อปลั๊กอินถูกเปิดใช้งานแล้วเท่านั้น ไฟล์ Command ควรอยู่ในไดเรกทอรีของปลั๊กอินที่พาธ `src/server/commands/*.ts` ครับ/ค่ะ

ตัวอย่าง

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app.
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

คำอธิบาย

- `app.command('echo')`: กำหนด Command ที่ชื่อว่า `echo` ครับ/ค่ะ
- `.option('-v, --version')`: เพิ่มตัวเลือก (option) ให้กับ Command ครับ/ค่ะ
- `.action()`: กำหนด Logic การทำงานของ Command ครับ/ค่ะ
- `app.version.get()`: ใช้สำหรับดึงเวอร์ชันปัจจุบันของแอปพลิเคชันครับ/ค่ะ

รัน Command

```bash
nocobase echo
nocobase echo -v
```

## Static Command

เราใช้ `Application.registerStaticCommand()` ในการลงทะเบียนครับ/ค่ะ Static Command สามารถทำงานได้โดยไม่จำเป็นต้องเปิดใช้งานปลั๊กอิน เหมาะสำหรับงานที่เกี่ยวกับการติดตั้ง, การตั้งค่าเริ่มต้น, การย้ายข้อมูล (migration) หรือการดีบัก (debugging) โดยจะลงทะเบียนในเมธอด `staticImport()` ของคลาสปลั๊กอินครับ/ค่ะ

ตัวอย่าง

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

รัน Command

```bash
nocobase echo
nocobase echo --version
```

คำอธิบาย

- `Application.registerStaticCommand()` จะลงทะเบียน Command ก่อนที่แอปพลิเคชันจะถูกสร้างอินสแตนซ์ (instantiate) ครับ/ค่ะ
- Static Command มักใช้สำหรับรันงานทั่วไปที่ไม่ขึ้นอยู่กับสถานะของแอปพลิเคชันหรือปลั๊กอินครับ/ค่ะ

## Command API

ออบเจกต์ Command มีเมธอดเสริม 3 ตัวเลือกที่ช่วยควบคุมบริบทการทำงานของ Command ครับ/ค่ะ:

| เมธอด | วัตถุประสงค์ | ตัวอย่าง |
|------|------|------|
| `ipc()` | สื่อสารกับอินสแตนซ์ของแอปพลิเคชันที่กำลังทำงานอยู่ (ผ่าน IPC) | `app.command('reload').ipc().action()` |
| `auth()` | ตรวจสอบว่าการตั้งค่าฐานข้อมูลถูกต้องหรือไม่ | `app.command('seed').auth().action()` |
| `preload()` | โหลดการตั้งค่าแอปพลิเคชันล่วงหน้า (เทียบเท่ากับการรัน `app.load()`) | `app.command('sync').preload().action()` |

คำอธิบายการตั้งค่า

- **`ipc()`**
  โดยปกติแล้ว Command จะทำงานในอินสแตนซ์ของแอปพลิเคชันใหม่ครับ/ค่ะ
  เมื่อเปิดใช้งาน `ipc()` Command จะสื่อสารกับอินสแตนซ์ของแอปพลิเคชันที่กำลังทำงานอยู่ผ่านการสื่อสารระหว่าง Process (IPC) ซึ่งเหมาะสำหรับ Command ที่ต้องการการทำงานแบบเรียลไทม์ (เช่น การรีเฟรชแคช, การส่งการแจ้งเตือน) ครับ/ค่ะ

- **`auth()`**
  ใช้ตรวจสอบว่าการตั้งค่าฐานข้อมูลพร้อมใช้งานหรือไม่ก่อนที่ Command จะทำงานครับ/ค่ะ
  หากการตั้งค่าฐานข้อมูลผิดพลาดหรือไม่สามารถเชื่อมต่อได้ Command จะไม่ทำงานต่อ เหมาะสำหรับงานที่เกี่ยวข้องกับการเขียนหรืออ่านฐานข้อมูลครับ/ค่ะ

- **`preload()`**
  ใช้โหลดการตั้งค่าแอปพลิเคชันล่วงหน้าก่อนรัน Command ซึ่งเทียบเท่ากับการรัน `app.load()` ครับ/ค่ะ
  เหมาะสำหรับ Command ที่ต้องพึ่งพาการตั้งค่าหรือบริบทของปลั๊กอินครับ/ค่ะ

สำหรับเมธอด API เพิ่มเติม สามารถดูได้ที่ [AppCommand](/api/server/app-command) ครับ/ค่ะ

## ตัวอย่างที่พบบ่อย

การตั้งค่าข้อมูลเริ่มต้น

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

การโหลดแคชซ้ำสำหรับอินสแตนซ์ที่กำลังทำงานอยู่ (โหมด IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

การลงทะเบียน Command สำหรับการติดตั้งแบบ Static

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```