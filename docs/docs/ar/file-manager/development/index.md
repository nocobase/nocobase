:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تطوير الإضافات

## توسيع محركات التخزين

### جانب الخادم

1. **وراثة `StorageType`**
   
   أنشئ فئة جديدة وقم بتنفيذ الدالتين `make()` و`delete()`، ويمكنك عند الحاجة إعادة تعريف الخطافات مثل `getFileURL()` و`getFileStream()` و`getFileData()`.

مثال:

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

4. **تسجيل النوع الجديد**  
   قم بحقن تنفيذ التخزين الجديد ضمن دورة حياة `beforeLoad` أو `load` الخاصة بالإضافة:

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

بعد التسجيل ستظهر إعدادات التخزين ضمن مورد `storages` تمامًا مثل الأنواع المضمنة. يمكن استخدام الإعدادات التي يوفرها `StorageType.defaults()` لملء النماذج تلقائيًا أو تهيئة السجلات الافتراضية.

<!--
### إعدادات الواجهة الأمامية وواجهة الإدارة
في جانب العميل، تحتاج إلى إبلاغ مدير الملفات بكيفية عرض نموذج الإعداد وما إذا كانت هناك منطق رفع مخصص. يحتوي كل كائن من نوع التخزين على الخصائص التالية:
-->

## توسيع أنواع الملفات في الواجهة الأمامية

بالنسبة للملفات التي تم رفعها، يمكن عرض محتوى معاينة مختلف في الواجهة الأمامية حسب نوع الملف. يحتوي حقل المرفقات في مدير الملفات على معاينة مدمجة تعتمد على المتصفح (ضمن iframe)، وتدعم معاينة معظم التنسيقات (مثل الصور والفيديو والصوت وملفات PDF) مباشرة في المتصفح. عند عدم دعم المتصفح لتنسيق معين أو عند الحاجة إلى تفاعلات معاينة خاصة، يمكنك توسيع مكوّن المعاينة بحسب نوع الملف.

### مثال

على سبيل المثال، إذا أردت دمج معاينة عبر الإنترنت مخصصة لملفات Office، يمكنك استخدام الكود التالي:

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

هنا `filePreviewTypes` هو كائن الإدخال المقدم من `@nocobase/plugin-file-manager/client` لتوسيع معاينات الملفات. استخدم طريقة `add` لإضافة كائن واصف لنوع الملف.

يجب على كل نوع ملف تنفيذ دالة `match()` للتحقق مما إذا كان نوع الملف مطابقًا. في المثال يتم استخدام `matchMimetype` للتحقق من خاصية `mimetype` للملف. إذا تطابق مع نوع `docx` فيُعتبر النوع المطلوب التعامل معه. وإذا لم يتطابق فسيتم الرجوع إلى المعالجة المدمجة.

خاصية `Previewer` في كائن الوصف هي المكوّن المستخدم للمعاينة. عند تطابق نوع الملف سيتم عرض هذا المكوّن داخل نافذة المعاينة. يمكنك إرجاع أي عرض React (مثل iframe أو مشغل أو مخطط).

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

`filePreviewTypes` هو مثيل عام يتم استيراده من `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

يسجّل كائن واصف جديد لنوع الملف في سجل الأنواع. نوع كائن الوصف هو `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

طريقة مطابقة تنسيق الملف.

المعامل `file` هو كائن بيانات الملف المرفوع، ويحتوي على خصائص ذات صلة يمكن استخدامها للتحقق من النوع:

* `mimetype`: وصف mimetype
* `extname`: امتداد الملف ويشمل "."
* `path`: المسار النسبي لتخزين الملف
* `url`: رابط URL للملف

ترجع قيمة `boolean` تشير إلى ما إذا كان هناك تطابق.

##### `getThumbnailURL`

يعيد رابط الصورة المصغرة المستخدمة في قائمة الملفات. إذا كانت القيمة فارغة فسيتم استخدام صورة عنصر نائب مدمجة.

##### `Previewer`

مكوّن React لمعاينة الملفات.

المعلمات المرسلة هي:

* `file`: كائن الملف الحالي (قد يكون رابط URL نصي أو كائنًا يحتوي على `url`/`preview`)
* `index`: فهرس الملف في القائمة
* `list`: قائمة الملفات

