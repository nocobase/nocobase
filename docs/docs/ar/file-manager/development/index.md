:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تطوير الإضافات

## توسيع محركات التخزين

### جانب الخادم

1.  **وراثة `StorageType`**

    أنشئ صنفًا جديدًا وطبّق طريقتي `make()` و `delete()`، وقم بتجاوز الخطافات (hooks) مثل `getFileURL()` و `getFileStream()` و `getFileData()` عند الضرورة.

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

4.  **تسجيل النوع الجديد**
    قم بحقن تطبيق التخزين الجديد في دورة حياة `beforeLoad` أو `load` الخاصة بـ **الإضافة**:

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

بعد التسجيل، ستظهر إعدادات التخزين في مورد `storages` تمامًا مثل الأنواع المدمجة. يمكن استخدام الإعدادات التي يوفرها `StorageType.defaults()` لملء النماذج تلقائيًا أو تهيئة السجلات الافتراضية.

### إعدادات جانب العميل وواجهة الإدارة
على جانب العميل، تحتاج إلى إبلاغ مدير الملفات بكيفية عرض نموذج الإعدادات وما إذا كان هناك منطق تحميل مخصص. يحتوي كل كائن من نوع التخزين على الخصائص التالية:

## توسيع أنواع ملفات الواجهة الأمامية

بالنسبة للملفات التي تم تحميلها، يمكنك عرض محتوى معاينة مختلف في واجهة المستخدم الأمامية بناءً على أنواع الملفات المختلفة. يتضمن حقل المرفقات في مدير الملفات معاينة ملفات مدمجة تعتمد على المتصفح (مضمنة في iframe)، والتي تدعم معاينة معظم تنسيقات الملفات (مثل الصور ومقاطع الفيديو والصوت وملفات PDF) مباشرة في المتصفح. عندما لا يدعم تنسيق ملف معين المعاينة في المتصفح، أو عندما تكون هناك حاجة لتفاعلات معاينة خاصة، يمكنك تحقيق ذلك عن طريق توسيع مكون المعاينة المستند إلى نوع الملف.

### مثال

على سبيل المثال، إذا كنت ترغب في توسيع نوع ملف الصورة بمكون عرض دوار (carousel)، يمكنك استخدام الكود التالي:

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

هنا، `attachmentFileTypes` هو الكائن المدخل المتوفر في حزمة `@nocobase/client` لتوسيع أنواع الملفات. استخدم طريقة `add` الخاصة به لتوسيع كائن وصف نوع الملف.

يجب أن يطبق كل نوع ملف طريقة `match()` للتحقق مما إذا كان نوع الملف يفي بالمتطلبات. في المثال، تُستخدم الطريقة المتوفرة بواسطة حزمة `mime-match` للتحقق من خاصية `mimetype` للملف. إذا تطابقت مع نوع `image/*`، فسيُعتبر نوع الملف الذي يجب معالجته. إذا لم يتم العثور على تطابق، فسيتم الرجوع إلى معالجة النوع المدمجة.

خاصية `Previewer` في كائن وصف النوع هي المكون المستخدم للمعاينة. عندما يتطابق نوع الملف، سيتم عرض هذا المكون للمعاينة. يُنصح عمومًا باستخدام مكون من نوع نافذة منبثقة (مثل `<Modal />`) كحاوية أساسية، ثم وضع محتوى المعاينة والتفاعل المطلوب داخل هذا المكون لتحقيق وظيفة المعاينة.

### واجهة برمجة التطبيقات (API)

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

`attachmentFileTypes` هو كائن عام (global instance)، يتم استيراده من `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

يسجل كائن وصف نوع ملف جديد في مركز تسجيل أنواع الملفات. نوع كائن الوصف هو `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

طريقة مطابقة تنسيق الملف.

المعامل المدخل `file` هو كائن البيانات لملف تم تحميله، ويحتوي على خصائص ذات صلة يمكن استخدامها لتحديد النوع:

*   `mimetype`: وصف نوع MIME
*   `extname`: امتداد الملف، بما في ذلك "."
*   `path`: المسار النسبي لتخزين الملف
*   `url`: عنوان URL للملف

القيمة المرجعة هي من نوع `boolean`، وتشير إلى نتيجة المطابقة.

##### `Previewer`

مكون React يستخدم لمعاينة الملفات.

معاملات Props المدخلة هي:

*   `index`: فهرس الملف في قائمة المرفقات
*   `list`: قائمة المرفقات
*   `onSwitchIndex`: طريقة لتبديل الفهرس

يمكن تمرير أي قيمة فهرس من `list` إلى `onSwitchIndex` للتبديل إلى ملف آخر. إذا تم تمرير `null` كمعامل للتبديل، فسيتم إغلاق مكون المعاينة مباشرة.

```ts
onSwitchIndex(null);
```