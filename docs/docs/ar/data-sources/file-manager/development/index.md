:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تطوير الإضافات

## توسيع أنواع ملفات الواجهة الأمامية

بالنسبة للملفات التي تم رفعها، يمكن لواجهة المستخدم الأمامية عرض معاينات مختلفة بناءً على أنواع الملفات. يستخدم حقل المرفقات في مدير الملفات معاينة ملفات مدمجة تعتمد على المتصفح (مضمنة في iframe)، وتدعم هذه الطريقة معظم أنواع الملفات (مثل الصور ومقاطع الفيديو والصوت وملفات PDF) للمعاينة المباشرة في المتصفح. عندما لا يكون نوع الملف مدعومًا للمعاينة في المتصفح، أو عندما تكون هناك حاجة لتفاعل معاينة خاص، يمكن تحقيق ذلك من خلال توسيع مكونات المعاينة بناءً على نوع الملف.

### مثال

على سبيل المثال، إذا كنت ترغب في توسيع مكون عرض دوار (carousel) لملفات الصور، يمكنك استخدام الشيفرة التالية:

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

إن `attachmentFileTypes` هو كائن إدخال (entry object) يوفره حزمة `@nocobase/client` لتوسيع أنواع الملفات. يمكنك استخدام طريقة `add` التي يوفرها لتوسيع كائن وصف نوع الملف.

يجب أن يطبق كل نوع ملف طريقة `match()` للتحقق مما إذا كان نوع الملف يفي بالمتطلبات. في المثال، تُستخدم الطريقة التي توفرها حزمة `mime-match` لفحص خاصية `mimetype` للملف. إذا تطابقت مع نوع `image/*`، فسيُعتبر نوع ملف يتطلب المعالجة. إذا لم يتم العثور على تطابق، فسيتم الرجوع إلى المعالجة المدمجة للنوع.

إن خاصية `Previewer` في كائن وصف النوع هي المكون المستخدم للمعاينة. عندما يتطابق نوع الملف، سيتم عرض هذا المكون للمعاينة. يُنصح عادةً باستخدام مكون من نوع النافذة المنبثقة (مثل `<Modal />`) كحاوية أساسية، ثم وضع محتوى المعاينة والتفاعل المطلوب داخل هذا المكون لتحقيق وظيفة المعاينة.

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

إن `attachmentFileTypes` هو كائن (instance) عام يتم استيراده من حزمة `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

يسجل كائن وصف نوع ملف جديد في سجل أنواع الملفات. نوع كائن الوصف هو `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

طريقة لمطابقة تنسيقات الملفات.

المعامل `file` هو كائن بيانات للملف المرفوع، ويحتوي على خصائص ذات صلة يمكن استخدامها للتحقق من النوع:

*   `mimetype`: وصف نوع MIME.
*   `extname`: امتداد الملف، بما في ذلك النقطة ".".
*   `path`: المسار النسبي لتخزين الملف.
*   `url`: عنوان URL للملف.

يعيد قيمة من نوع `boolean` تشير إلى نتيجة المطابقة.

##### `Previewer`

مكون React لمعاينة الملف.

المعاملات (Props):

*   `index`: فهرس الملف في قائمة المرفقات.
*   `list`: قائمة المرفقات.
*   `onSwitchIndex`: طريقة لتبديل الفهرس.

يمكن استدعاء الدالة `onSwitchIndex` بأي قيمة فهرس من `list` للتبديل إلى ملف آخر. إذا تم استدعاؤها بقيمة `null` كمعامل، فسيتم إغلاق مكون المعاينة مباشرة.

```ts
onSwitchIndex(null);
```