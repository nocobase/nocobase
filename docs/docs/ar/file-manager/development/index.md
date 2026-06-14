# تطوير الإضافات

## توسيع محرّكات التخزين

### جهة الخادم

1. **الوراثة من `StorageType`**
   
   أنشئ فئة جديدة ونفّذ الدالتين `make()` و `delete()`، ويمكنك أيضًا إعادة تعريف hooks مثل `getFileURL()` و `getFileStream()` و `getFileData()` عند الحاجة.

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
   قم بحقن تنفيذ التخزين الجديد داخل دورة حياة الإضافة `beforeLoad` أو `load`:

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

بعد التسجيل، سيظهر إعداد التخزين ضمن مورد `storages` تمامًا مثل الأنواع المدمجة. ويمكن استخدام الإعدادات التي يوفّرها `StorageType.defaults()` لملء النماذج تلقائيًا أو لتهيئة السجلات الافتراضية.

<!--
### واجهة إعداد وإدارة جهة العميل
في جهة العميل، تحتاج إلى إخبار مدير الملفات بكيفية عرض نموذج الإعداد وما إذا كان هناك منطق رفع مخصص. يحتوي كل كائن نوع تخزين على الخصائص التالية:
-->

## توسيع أنواع الملفات في الواجهة الأمامية

بالنسبة للملفات المرفوعة، يمكنك عرض محتوى معاينة مختلف في الواجهة الأمامية بحسب نوع الملف. يحتوي حقل المرفقات في مدير الملفات على معاينة مدمجة للملفات داخل المتصفح (ضمن iframe)، وتدعم معاينة معظم صيغ الملفات مباشرة في المتصفح مثل الصور والفيديوهات والصوتيات وملفات PDF. وعندما لا تكون صيغة الملف مدعومة للمعاينة داخل المتصفح، أو عندما تحتاج إلى تفاعلات معاينة خاصة، يمكنك توسيع مكوّن المعاينة المعتمد على نوع الملف.

### مثال

على سبيل المثال، إذا أردت دمج معاينة مخصّصة عبر الإنترنت لملفات Office، يمكنك استخدام الكود التالي:

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

هنا، يُعد `filePreviewTypes` كائن الإدخال الذي يوفّره `@nocobase/plugin-file-manager/client` لتوسيع معاينات الملفات. استخدم الدالة `add` الخاصة به لإضافة واصف جديد لنوع الملف.

يجب أن ينفّذ كل نوع ملف الدالة `match()` للتحقق مما إذا كان الملف يطابق الشروط المطلوبة. في المثال، تم استخدام `matchMimetype` للتحقق من الخاصية `mimetype` الخاصة بالملف. فإذا طابق النوع `docx` فسيُعتبر هذا النوع هو الذي يجب التعامل معه، وإذا لم يطابق فسيتم استخدام المعالجة المدمجة.

تمثل الخاصية `Previewer` في كائن واصف النوع المكوّن المستخدم للمعاينة. وعندما يطابق الملف هذا النوع، سيتم عرض هذا المكوّن داخل نافذة المعاينة. ويمكنك إعادة أي واجهة React مثل `iframe` أو مشغّل وسائط أو مخطط.

### واجهة API

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

`filePreviewTypes` هو كائن عام يتم استيراده من `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

قم بتسجيل كائن واصف جديد لنوع ملف داخل سجل أنواع الملفات. نوع هذا الكائن هو `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

دالة مطابقة صيغة الملف.

المعامل `file` هو كائن بيانات الملف المرفوع، ويحتوي على خصائص ذات صلة يمكن استخدامها للتحقق من النوع:

* `mimetype`: وصف نوع MIME
* `extname`: امتداد الملف، متضمّنًا النقطة "."
* `path`: المسار النسبي لتخزين الملف
* `url`: رابط الملف

تعيد قيمة من نوع `boolean` لتحديد ما إذا كانت المطابقة ناجحة.

##### `getThumbnailURL`

تعيد رابط الصورة المصغّرة المستخدم في قائمة الملفات. وإذا كانت القيمة المعادة فارغة، فسيتم استخدام الصورة الافتراضية المدمجة.

##### `Previewer`

مكوّن React مخصّص لمعاينة الملفات.

الخصائص الواردة إليه هي:

* `file`: كائن الملف الحالي (قد يكون رابطًا نصيًا أو كائنًا يحتوي على `url` أو `preview`)
* `index`: فهرس الملف داخل القائمة
* `list`: قائمة الملفات