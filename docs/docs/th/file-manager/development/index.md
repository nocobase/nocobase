:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การพัฒนาส่วนขยาย

## การขยาย Storage Engine

### ฝั่งเซิร์ฟเวอร์

1. **สืบทอด `StorageType`**
   
   สร้างคลาสใหม่และติดตั้งเมธอด `make()` และ `delete()` หากจำเป็นสามารถ override hook เช่น `getFileURL()` `getFileStream()` และ `getFileData()` ได้

ตัวอย่าง:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4. **ลงทะเบียนประเภทใหม่**  
   ฉีดการทำงานของ storage ใหม่ใน lifecycle `beforeLoad` หรือ `load` ของปลั๊กอิน:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

หลังจากลงทะเบียนแล้ว การตั้งค่า storage จะปรากฏใน resource `storages` เช่นเดียวกับประเภทที่มีอยู่ในระบบ ค่าเริ่มต้นจาก `StorageType.defaults()` สามารถใช้เติมฟอร์มหรือสร้างเรคคอร์ดเริ่มต้นได้

<!--
### การตั้งค่าฝั่งไคลเอนต์และหน้าจอจัดการ
ฝั่งไคลเอนต์ต้องแจ้งให้ตัวจัดการไฟล์รู้ว่าจะเรนเดอร์ฟอร์มการตั้งค่าอย่างไร และมีลอจิกการอัปโหลดแบบกำหนดเองหรือไม่ แต่ละออบเจ็กต์ประเภท storage จะมีคุณสมบัติดังต่อไปนี้:
-->

## การขยายประเภทไฟล์ฝั่ง Frontend

สำหรับไฟล์ที่อัปโหลดแล้ว คุณสามารถแสดงเนื้อหาพรีวิวที่แตกต่างกันตามประเภทไฟล์ในหน้าจอ frontend ได้ ฟิลด์แนบไฟล์ของตัวจัดการไฟล์มีพรีวิวแบบฝังในเบราว์เซอร์ (ภายใน iframe) ซึ่งรองรับการพรีวิวรูปแบบไฟล์ส่วนใหญ่ (เช่น รูปภาพ วิดีโอ เสียง และ PDF) ได้โดยตรงในเบราว์เซอร์ เมื่อรูปแบบไฟล์ไม่รองรับการพรีวิวในเบราว์เซอร์หรือจำเป็นต้องมีการโต้ตอบพรีวิวพิเศษ คุณสามารถขยายคอมโพเนนต์พรีวิวตามประเภทไฟล์ได้

### ตัวอย่าง

ตัวอย่างเช่น หากต้องการเชื่อมต่อพรีวิวออนไลน์แบบกำหนดเองสำหรับไฟล์ Office สามารถใช้โค้ดดังนี้:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

`filePreviewTypes` คือออบเจ็กต์สำหรับขยายพรีวิวไฟล์ที่มาจาก `@nocobase/plugin-file-manager/client` ใช้เมธอด `add` เพื่อเพิ่มออบเจ็กต์คำอธิบายประเภทไฟล์

แต่ละประเภทไฟล์ต้องมีเมธอด `match()` เพื่อตรวจสอบว่าเป็นประเภทที่ต้องการหรือไม่ ในตัวอย่างใช้ `matchMimetype` เพื่อตรวจสอบแอตทริบิวต์ `mimetype` ของไฟล์ หากตรงกับประเภท `docx` จะถือว่าเป็นประเภทที่ต้องจัดการ หากไม่ตรง จะใช้การจัดการประเภทที่มีในระบบ

พร็อพเพอร์ตี `Previewer` ของออบเจ็กต์คำอธิบายประเภทคือคอมโพเนนต์ที่ใช้สำหรับพรีวิว เมื่อประเภทไฟล์ตรงเงื่อนไข คอมโพเนนต์นี้จะถูกเรนเดอร์ในหน้าต่างพรีวิว คุณสามารถคืนค่าเป็น React view ใดๆ ได้ (เช่น iframe, player หรือกราฟ)

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` เป็นอินสแตนซ์แบบ global นำเข้าจาก `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

ลงทะเบียนออบเจ็กต์คำอธิบายประเภทไฟล์ใหม่ใน registry ของประเภทไฟล์ ประเภทของออบเจ็กต์คำอธิบายคือ `FilePreviewType`

#### `FilePreviewType`

##### `match()`

เมธอดสำหรับจับคู่รูปแบบไฟล์

พารามิเตอร์ `file` คือออบเจ็กต์ข้อมูลของไฟล์ที่อัปโหลดแล้ว ซึ่งมีคุณสมบัติที่เกี่ยวข้องสำหรับการตรวจสอบประเภท:

* `mimetype`: คำอธิบาย mimetype
* `extname`: นามสกุลไฟล์ รวมถึง "."
* `path`: เส้นทางจัดเก็บไฟล์แบบสัมพัทธ์
* `url`: URL ของไฟล์

คืนค่า `boolean` เพื่อบอกว่าตรงกันหรือไม่

##### `getThumbnailURL`

คืนค่า URL ของภาพย่อที่ใช้ในรายการไฟล์ หากค่าที่คืนว่าง จะใช้ภาพ placeholder ที่มีอยู่ในระบบ

##### `Previewer`

คอมโพเนนต์ React สำหรับพรีวิวไฟล์

Props ที่รับเข้ามา:

* `file`: ออบเจ็กต์ไฟล์ปัจจุบัน (อาจเป็น URL แบบสตริงหรือออบเจ็กต์ที่มี `url`/`preview`)
* `index`: ดัชนีของไฟล์ในรายการ
* `list`: รายการไฟล์

