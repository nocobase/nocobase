:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การพัฒนาส่วนขยาย

## การขยายประเภทไฟล์สำหรับส่วนหน้า (Frontend)

สำหรับไฟล์ที่อัปโหลดแล้ว ส่วนหน้า (frontend) สามารถแสดงเนื้อหาพรีวิวที่แตกต่างกันได้ตามประเภทไฟล์ครับ/ค่ะ ช่องแนบไฟล์ของตัวจัดการไฟล์มีฟังก์ชันพรีวิวไฟล์ในเบราว์เซอร์ (ฝังใน iframe) ในตัว ซึ่งรองรับไฟล์ส่วนใหญ่ (เช่น รูปภาพ วิดีโอ เสียง และ PDF) ให้สามารถพรีวิวได้โดยตรงในเบราว์เซอร์ครับ/ค่ะ หากประเภทไฟล์ไม่รองรับการพรีวิวในเบราว์เซอร์ หรือต้องการการโต้ตอบพิเศษในการพรีวิว เราสามารถขยายคอมโพเนนต์พรีวิวตามประเภทไฟล์เพื่อรองรับได้ครับ/ค่ะ

### ตัวอย่าง

ตัวอย่างเช่น หากคุณต้องการขยายคอมโพเนนต์สำหรับแสดงภาพแบบสไลด์ (carousel) สำหรับไฟล์รูปภาพ คุณสามารถทำได้ด้วยโค้ดดังต่อไปนี้ครับ/ค่ะ

```ts
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

`attachmentFileTypes` เป็นออบเจกต์เริ่มต้นที่ `@nocobase/client` แพ็กเกจจัดเตรียมไว้ให้ เพื่อใช้ในการขยายประเภทไฟล์ครับ/ค่ะ คุณสามารถใช้วิธี `add` ที่มีให้เพื่อเพิ่มคำอธิบายประเภทไฟล์ใหม่ได้เลยครับ/ค่ะ

แต่ละประเภทไฟล์จะต้องมีเมธอด `match()` เพื่อตรวจสอบว่าประเภทไฟล์นั้นตรงตามข้อกำหนดหรือไม่ครับ/ค่ะ ในตัวอย่างนี้ เราใช้เมธอดจากแพ็กเกจ `mime-match` เพื่อตรวจสอบคุณสมบัติ `mimetype` ของไฟล์ หากตรงกับประเภท `image/*` ก็จะถือว่าเป็นประเภทไฟล์ที่ต้องประมวลผลครับ/ค่ะ หากไม่ตรงกัน ระบบจะกลับไปใช้การจัดการประเภทไฟล์แบบในตัว (built-in) ครับ/ค่ะ

คุณสมบัติ `Previewer` บนออบเจกต์คำอธิบายประเภทไฟล์คือคอมโพเนนต์ที่ใช้สำหรับการพรีวิวครับ/ค่ะ เมื่อประเภทไฟล์ตรงกัน คอมโพเนนต์นี้จะถูกเรนเดอร์เพื่อแสดงผลการพรีวิวครับ/ค่ะ โดยทั่วไปแล้ว แนะนำให้ใช้คอมโพเนนต์ประเภทป๊อปอัป (เช่น `<Modal />` เป็นต้น) เป็นคอนเทนเนอร์หลัก แล้วจึงนำเนื้อหาพรีวิวและการโต้ตอบที่จำเป็นใส่เข้าไปในคอมโพเนนต์นั้น เพื่อให้ฟังก์ชันการพรีวิวทำงานได้อย่างสมบูรณ์ครับ/ค่ะ

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

`attachmentFileTypes` เป็นอินสแตนซ์แบบ Global ที่นำเข้าจากแพ็กเกจ `@nocobase/client` ครับ/ค่ะ

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

ใช้สำหรับลงทะเบียนออบเจกต์คำอธิบายประเภทไฟล์ใหม่ในระบบลงทะเบียนประเภทไฟล์ครับ/ค่ะ ประเภทของออบเจกต์คำอธิบายคือ `AttachmentFileType`

#### `AttachmentFileType`

##### `match()`

เมธอดสำหรับจับคู่รูปแบบไฟล์ครับ/ค่ะ

พารามิเตอร์ `file` ที่ส่งเข้ามาคือออบเจกต์ข้อมูลของไฟล์ที่อัปโหลดแล้ว ซึ่งมีคุณสมบัติที่เกี่ยวข้องที่สามารถใช้ในการตรวจสอบประเภทได้ครับ/ค่ะ:

*   `mimetype`: คำอธิบาย mimetype
*   `extname`: นามสกุลไฟล์ รวมถึงเครื่องหมาย "."
*   `path`: พาธสัมพัทธ์ในการจัดเก็บไฟล์
*   `url`: URL ของไฟล์

ค่าที่ส่งกลับเป็นประเภท `boolean` ซึ่งระบุผลลัพธ์ว่าตรงกันหรือไม่ครับ/ค่ะ

##### `Previewer`

คอมโพเนนต์ React สำหรับพรีวิวไฟล์ครับ/ค่ะ

พารามิเตอร์ Props ที่ส่งเข้ามาได้แก่:

*   `index`: ดัชนีของไฟล์ในรายการไฟล์แนบ
*   `list`: รายการไฟล์แนบ
*   `onSwitchIndex`: เมธอดสำหรับสลับดัชนี

โดย `onSwitchIndex` สามารถรับค่าดัชนีใดก็ได้จาก `list` เพื่อสลับไปยังไฟล์อื่นครับ/ค่ะ หากใช้ `null` เป็นพารามิเตอร์ในการสลับ คอมโพเนนต์พรีวิวจะถูกปิดทันทีครับ/ค่ะ

```ts
onSwitchIndex(null);
```