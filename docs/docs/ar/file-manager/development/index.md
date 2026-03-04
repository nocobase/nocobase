:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/file-manager/development/index).
:::

# تطوير الإضافات

## توسيع محركات التخزين

### جانب الخادم

1. **وراثة `StorageType`**
   
   أنشئ فئة جديدة وقم بتنفيذ الدالتين `make()` و`delete()`، وقم عند الضرورة بإعادة تعريف الخطافات مثل `getFileURL()` و`getFileStream()` و`getFileData()`.

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
   قم بحقن تنفيذ التخزين الجديد في دورة حياة `beforeLoad` أو `load` الخاصة بالإضافة:

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

بمجرد اكتمال التسجيل، ستظهر إعدادات التخزين في مورد `storages` تمامًا مثل الأنواع المضمنة، ويمكن استخدام الإعدادات التي يوفرها `StorageType.defaults()` لملء النماذج تلقائيًا أو تهيئة السجلات الافتراضية.

<!--
### إعدادات الواجهة الأمامية وواجهة الإدارة
في جانب العميل، يجب إبلاغ مدير الملفات بكيفية عرض نموذج الإعداد وما إذا كان يمتلك منطق رفع مخصص. يحتوي كل كائن نوع تخزين على الخصائص التالية:
-->

## توسيع أنواع ملفات الواجهة الأمامية

بالنسبة للملفات التي تم رفعها بالفعل، يمكن عرض محتوى معاينة مختلف في واجهة المستخدم الأمامية بناءً على أنواع الملفات المختلفة. يحتوي حقل المرفقات في مدير الملفات على معاينة مدمجة للملفات تعتمد على المتصفح (مضمنة في iframe)، وتدعم هذه الطريقة معاينة معظم تنسيقات الملفات (مثل الصور والفيديو والصوت وPDF وغيرها) مباشرة في المتصفح. عندما لا يدعم المتصفح معاينة تنسيق الملف، أو عندما تكون هناك حاجة لتفاعلات معاينة خاصة، يمكن تحقيق ذلك من خلال توسيع مكونات المعاينة بناءً على نوع الملف.

### مثال

على سبيل المثال، إذا كنت ترغب في دمج معاينة مخصصة عبر الإنترنت لملفات Office، يمكنك القيام بذلك من خلال الكود التالي:

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

حيث أن `filePreviewTypes` هو كائن المدخل المقدم من `@nocobase/plugin-file-manager/client` لتوسيع معاينة الملفات، استخدم طريقة `add` التي يوفرها لتوسيع كائن وصف نوع الملف.

يجب على كل نوع ملف تنفيذ طريقة `match()` للتحقق مما إذا كان نوع الملف يلبي المتطلبات. في المثال، يتم فحص خاصية `mimetype` للملف عبر `matchMimetype`؛ فإذا تطابقت مع نوع `docx` فسيتم اعتبارها نوع الملف الذي يجب التعامل معه. وإذا لم ينجح التطابق، فسيتم الرجوع إلى معالجة الأنواع المضمنة.

خاصية `Previewer` في كائن وصف النوع هي المكون المستخدم للمعاينة، وعندما يتطابق نوع الملف، سيتم عرض هذا المكون للمعاينة. سيتم عرض هذا المكون في الطبقة المنبثقة لمعاينة الملف، ويمكنك إرجاع أي عرض React (مثل iframe، مشغل، رسوم بيانية، إلخ).

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

`filePreviewTypes` هو مثيل عالمي يتم استيراده عبر `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

يسجل كائن وصف نوع ملف جديد في مركز تسجيل أنواع الملفات. نوع كائن الوصف هو `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

طريقة مطابقة تنسيق الملف.

المعامل الممرر `file` هو كائن بيانات الملف المرفوع، ويحتوي على الخصائص ذات الصلة التي يمكن استخدامها للحكم على النوع:

* `mimetype`: وصف mimetype
* `extname`: امتداد الملف، يتضمن "."
* `path`: المسار النسبي لتخزين الملف
* `url`: رابط URL للملف

القيمة المرجعة هي من نوع `boolean` تمثل نتيجة المطابقة.

##### `getThumbnailURL`

تُستخدم لإرجاع عنوان الصورة المصغرة في قائمة الملفات. عندما تكون القيمة المرجعة فارغة، سيتم استخدام صورة العنصر النائب المضمنة.

##### `Previewer`

مكون React لمعاينة الملفات.

معلمات Props الممررة هي:

* `file`: كائن الملف الحالي (قد يكون سلسلة URL أو كائنًا يحتوي على `url`/`preview`)
* `index`: فهرس الملف في القائمة
* `list`: قائمة الملفات