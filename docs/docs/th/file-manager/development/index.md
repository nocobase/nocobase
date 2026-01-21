:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การพัฒนาส่วนขยาย

## การขยาย Storage Engine

### ฝั่งเซิร์ฟเวอร์

1.  **สืบทอด (Inherit) `StorageType`**

    สร้างคลาสใหม่และ implement เมธอด `make()` กับ `delete()` ครับ/ค่ะ และหากจำเป็น ก็ให้ override hook ต่างๆ เช่น `getFileURL()` , `getFileStream()` , `getFileData()` ได้เลยครับ/ค่ะ

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

4.  **ลงทะเบียนประเภทใหม่**
    ให้ inject การ implement storage แบบใหม่เข้าไปใน lifecycle ของปลั๊กอินช่วง `beforeLoad` หรือ `load` ครับ/ค่ะ

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

หลังจากลงทะเบียนเรียบร้อยแล้ว การตั้งค่า storage จะปรากฏใน resource `storages` เหมือนกับประเภทที่มาพร้อมระบบครับ/ค่ะ โดยการตั้งค่าที่มาจาก `StorageType.defaults()` สามารถนำไปใช้เพื่อกรอกข้อมูลในฟอร์มโดยอัตโนมัติ หรือใช้สำหรับเริ่มต้นค่าเริ่มต้นของ record ได้ครับ/ค่ะ

### การตั้งค่าฝั่งไคลเอนต์และหน้าจอการจัดการ
ทางฝั่งไคลเอนต์ เราจำเป็นต้องแจ้งให้ตัวจัดการไฟล์ทราบว่าจะ render ฟอร์มการตั้งค่าอย่างไร และมี logic การอัปโหลดที่กำหนดเองหรือไม่ครับ/ค่ะ โดยแต่ละออบเจกต์ประเภท storage จะมีคุณสมบัติดังต่อไปนี้:

## การขยายประเภทไฟล์สำหรับ Frontend

สำหรับไฟล์ที่อัปโหลดเสร็จแล้ว บนหน้าจอ frontend เราสามารถแสดงเนื้อหาการพรีวิวที่แตกต่างกันได้ตามประเภทไฟล์ครับ/ค่ะ โดยฟิลด์ไฟล์แนบของตัวจัดการไฟล์จะมีฟังก์ชันพรีวิวไฟล์ที่ทำงานบนเบราว์เซอร์ (ฝังอยู่ใน iframe) มาให้ในตัว ซึ่งรองรับการพรีวิวไฟล์ส่วนใหญ่ (เช่น รูปภาพ, วิดีโอ, เสียง และ PDF) ได้โดยตรงในเบราว์เซอร์ครับ/ค่ะ แต่หากไฟล์บางประเภทไม่รองรับการพรีวิวในเบราว์เซอร์ หรือต้องการการโต้ตอบพิเศษในการพรีวิว เราสามารถขยายคอมโพเนนต์พรีวิวตามประเภทไฟล์ได้ครับ/ค่ะ

### ตัวอย่าง

ตัวอย่างเช่น หากต้องการขยายประเภทไฟล์รูปภาพด้วยคอมโพเนนต์สไลด์โชว์ (carousel) สามารถทำได้ด้วยโค้ดดังต่อไปนี้ครับ/ค่ะ

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

โดย `attachmentFileTypes` คือออบเจกต์หลักที่อยู่ในแพ็กเกจ `@nocobase/client` ซึ่งใช้สำหรับขยายประเภทไฟล์ครับ/ค่ะ เราจะใช้เมธอด `add` ที่มีให้เพื่อขยายออบเจกต์คำอธิบายประเภทไฟล์ครับ/ค่ะ

แต่ละประเภทไฟล์จะต้อง implement เมธอด `match()` เพื่อตรวจสอบว่าประเภทไฟล์นั้นตรงตามข้อกำหนดหรือไม่ครับ/ค่ะ ในตัวอย่างนี้ เราใช้เมธอดที่มาจากแพ็กเกจ `mime-match` เพื่อตรวจสอบคุณสมบัติ `mimetype` ของไฟล์ หากตรงกับประเภท `image/*` ก็จะถือว่าเป็นประเภทไฟล์ที่ต้องดำเนินการครับ/ค่ะ แต่ถ้าไม่ตรงกัน ระบบก็จะกลับไปใช้การจัดการประเภทไฟล์ที่มาพร้อมระบบแทนครับ/ค่ะ

คุณสมบัติ `Previewer` บนออบเจกต์คำอธิบายประเภทไฟล์คือคอมโพเนนต์ที่ใช้สำหรับพรีวิวครับ/ค่ะ เมื่อประเภทไฟล์ตรงกัน คอมโพเนนต์นี้จะถูก render เพื่อแสดงการพรีวิว โดยทั่วไปแล้ว แนะนำให้ใช้คอมโพเนนต์ประเภทป๊อปอัป (เช่น `<Modal />` เป็นต้น) เป็นคอนเทนเนอร์หลัก จากนั้นจึงนำเนื้อหาการพรีวิวและส่วนที่ต้องการการโต้ตอบใส่เข้าไปในคอมโพเนนต์นั้น เพื่อให้การทำงานของฟังก์ชันพรีวิวสมบูรณ์ครับ/ค่ะ

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` เป็น global instance ที่ import มาจาก `@nocobase/client` ครับ/ค่ะ

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

ใช้สำหรับลงทะเบียนออบเจกต์คำอธิบายประเภทไฟล์ใหม่เข้าสู่ระบบลงทะเบียนประเภทไฟล์ครับ/ค่ะ โดยออบเจกต์คำอธิบายนี้จะมีประเภทเป็น `AttachmentFileType`

#### `AttachmentFileType`

##### `match()`

เมธอดสำหรับจับคู่รูปแบบไฟล์

พารามิเตอร์ `file` ที่ส่งเข้ามาคือออบเจกต์ข้อมูลของไฟล์ที่อัปโหลดแล้ว ซึ่งมีคุณสมบัติที่เกี่ยวข้องที่สามารถใช้ในการตรวจสอบประเภทไฟล์ได้ดังนี้ครับ/ค่ะ

*   `mimetype`: คำอธิบาย mimetype
*   `extname`: นามสกุลไฟล์ รวมถึงเครื่องหมาย "."
*   `path`: พาธสัมพัทธ์ของไฟล์ที่จัดเก็บ
*   `url`: URL ของไฟล์

ค่าที่ส่งกลับจะเป็นประเภท `boolean` ซึ่งระบุผลลัพธ์ว่าตรงกันหรือไม่ครับ/ค่ะ

##### `Previewer`

คอมโพเนนต์ React สำหรับพรีวิวไฟล์

พารามิเตอร์ Props ที่ส่งเข้ามาคือ:

*   `index`: ตำแหน่ง (index) ของไฟล์ในรายการไฟล์แนบ
*   `list`: รายการไฟล์แนบ
*   `onSwitchIndex`: เมธอดสำหรับสลับตำแหน่ง (index)

โดย `onSwitchIndex` สามารถรับค่า index ใดๆ จาก `list` เพื่อสลับไปยังไฟล์อื่นได้ครับ/ค่ะ หากส่ง `null` เป็นพารามิเตอร์เพื่อสลับ คอมโพเนนต์พรีวิวจะถูกปิดทันทีครับ/ค่ะ

```ts
onSwitchIndex(null);
```