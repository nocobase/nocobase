:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# สร้างปลั๊กอิน Block ตัวแรกของคุณ

ก่อนเริ่มต้นใช้งาน เราขอแนะนำให้อ่าน "[สร้างปลั๊กอินตัวแรกของคุณ](../plugin-development/write-your-first-plugin.md)" เพื่อเรียนรู้วิธีสร้างปลั๊กอินพื้นฐานอย่างรวดเร็วครับ/ค่ะ หลังจากนั้น เราจะมาต่อยอดโดยการเพิ่มฟังก์ชัน Block แบบง่ายๆ เข้าไปครับ/ค่ะ

## ขั้นตอนที่ 1: สร้างไฟล์ Block Model

สร้างไฟล์ใหม่ในไดเรกทอรีของปลั๊กอิน: `client/models/SimpleBlockModel.tsx`

## ขั้นตอนที่ 2: เขียนเนื้อหา Model

กำหนดและใช้งาน Block Model พื้นฐานในไฟล์ รวมถึง Logic สำหรับการเรนเดอร์:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## ขั้นตอนที่ 3: ลงทะเบียน Block Model

ส่งออก (Export) Model ที่สร้างขึ้นใหม่ในไฟล์ `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## ขั้นตอนที่ 4: เปิดใช้งานและทดลองใช้ Block

หลังจากเปิดใช้งานปลั๊กอินแล้ว คุณจะเห็นตัวเลือก Block ใหม่ที่ชื่อว่า **Hello block** ในเมนูแบบเลื่อนลง "เพิ่ม Block" ครับ/ค่ะ

ตัวอย่างการทำงาน:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## ขั้นตอนที่ 5: เพิ่มความสามารถในการตั้งค่าให้กับ Block

ถัดไป เราจะเพิ่มฟังก์ชันที่สามารถตั้งค่าได้ให้กับ Block ผ่าน **Flow** เพื่อให้ผู้ใช้สามารถแก้ไขเนื้อหา Block ได้บนหน้าอินเทอร์เฟซครับ/ค่ะ

แก้ไขไฟล์ `SimpleBlockModel.tsx` ต่อไป:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

ตัวอย่างการทำงาน:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## สรุป

บทความนี้ได้แนะนำวิธีการสร้างปลั๊กอิน Block แบบง่ายๆ ซึ่งประกอบด้วย:

- วิธีการกำหนดและใช้งาน Block Model
- วิธีการลงทะเบียน Block Model
- วิธีการเพิ่มฟังก์ชันการตั้งค่าให้กับ Block ผ่าน Flow

ดูซอร์สโค้ดฉบับเต็มได้ที่: [ตัวอย่าง Simple Block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)