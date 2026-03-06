:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/view).
:::

# ctx.view

متحكم العرض النشط حاليًا (نافذة منبثقة، درج، طبقة فقاعية، منطقة مضمنة، إلخ)، يُستخدم للوصول إلى المعلومات والعمليات على مستوى العرض. يتم توفيره بواسطة `FlowViewContext` وهو متاح فقط داخل محتوى العرض المفتوح عبر `ctx.viewer` أو `ctx.openView`.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **محتوى النافذة المنبثقة/الدرج** | استخدام `ctx.view.close()` داخل المحتوى لإغلاق العرض الحالي، أو استخدام `Header` و `Footer` لرسم العنوان والتذييل. |
| **بعد إرسال النموذج** | استدعاء `ctx.view.close(result)` بعد نجاح الإرسال لإغلاق العرض وإرجاع النتيجة. |
| **JSBlock / Action** | تحديد نوع العرض الحالي عبر `ctx.view.type` أو قراءة معلمات الفتح من `ctx.view.inputArgs`. |
| **اختيار الارتباط، الجداول الفرعية** | قراءة `collectionName` و `filterByTk` و `parentId` وما إلى ذلك من `inputArgs` لتحميل البيانات. |

> ملاحظة: `ctx.view` متاح فقط في بيئات RunJS التي تحتوي على سياق عرض (مثل داخل `content` الخاص بـ `ctx.viewer.dialog()`، أو في نماذج النوافذ المنبثقة، أو داخل محددات الارتباط)؛ ويكون `undefined` في الصفحات العادية أو سياقات الخلفية (backend)، لذا يُنصح باستخدام التسلسل الاختياري (`ctx.view?.close?.()`).

## تعريف النوع

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // متاح في عروض تكوين سير العمل
};
```

## الخصائص والطرق الشائعة

| الخاصية/الطريقة | النوع | الوصف |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | نوع العرض الحالي |
| `inputArgs` | `Record<string, any>` | المعلمات الممررة عند فتح العرض، انظر أدناه |
| `Header` | `React.FC \| null` | مكون الرأس، يُستخدم لرسم العنوان ومنطقة العمليات |
| `Footer` | `React.FC \| null` | مكون التذييل، يُستخدم لرسم الأزرار وما إلى ذلك |
| `close(result?, force?)` | `void` | إغلاق العرض الحالي، يمكن تمرير `result` لإعادته إلى المستدعي |
| `update(newConfig)` | `void` | تحديث تكوين العرض (مثل العرض، العنوان) |
| `navigation` | `ViewNavigation \| undefined` | التنقل داخل العرض في الصفحة، بما في ذلك تبديل علامات التبويب (Tabs) وما إلى ذلك |

> حاليًا، يدعم `dialog` و `drawer` فقط المكونين `Header` و `Footer`.

## حقول inputArgs الشائعة

تختلف حقول `inputArgs` باختلاف سيناريو الفتح، وتشمل الحقول الشائعة ما يلي:

| الحقل | الوصف |
|------|------|
| `viewUid` | المعرف الفريد (UID) للعرض |
| `collectionName` | اسم المجموعة |
| `filterByTk` | تصفية المفتاح الأساسي (لتفاصيل سجل واحد) |
| `parentId` | معرف الأب (في سيناريوهات الارتباط) |
| `sourceId` | معرف السجل المصدر |
| `parentItem` | بيانات العنصر الأب |
| `scene` | المشهد (مثل `create` أو `edit` أو `select`) |
| `onChange` | استدعاء راجع (Callback) بعد الاختيار أو التغيير |
| `tabUid` | المعرف الفريد لعلامة التبويب الحالية (داخل الصفحة) |

يمكن الوصول إليها عبر `ctx.getVar('ctx.view.inputArgs.xxx')` أو `ctx.view.inputArgs.xxx`.

## أمثلة

### إغلاق العرض الحالي

```ts
// إغلاق النافذة المنبثقة بعد نجاح الإرسال
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// الإغلاق وإرجاع النتائج
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### استخدام Header / Footer في المحتوى

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="تعديل" extra={<Button size="small">مساعدة</Button>} />
      <div>محتوى النموذج...</div>
      <Footer>
        <Button onClick={() => close()}>إلغاء</Button>
        <Button type="primary" onClick={handleSubmit}>تأكيد</Button>
      </Footer>
    </div>
  );
}
```

### التفريع بناءً على نوع العرض أو inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // إخفاء الرأس في العروض المضمنة
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // سيناريو محدد المستخدمين
}
```

## العلاقة مع ctx.viewer و ctx.openView

| الغرض | الاستخدام الموصى به |
|------|----------|
| **فتح عرض جديد** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` أو `ctx.openView()` |
| **تشغيل العرض الحالي** | `ctx.view.close()`، `ctx.view.update()` |
| **الحصول على معلمات الفتح** | `ctx.view.inputArgs` |

`ctx.viewer` مسؤول عن "فتح" العرض، بينما يمثل `ctx.view` مثيل العرض "الحالي"؛ ويُستخدم `ctx.openView` لفتح عروض سير العمل التي تم تكوينها مسبقًا.

## ملاحظات

- `ctx.view` متاح فقط داخل العرض، ويكون `undefined` في الصفحات العادية.
- استخدم التسلسل الاختياري: `ctx.view?.close?.()` لتجنب الأخطاء عند عدم وجود سياق عرض.
- النتيجة `result` من `close(result)` سيتم تمريرها إلى الوعد (Promise) الذي يرجعه `ctx.viewer.open()`.

## روابط ذات صلة

- [ctx.openView()](./open-view.md): فتح عرض سير عمل مكون مسبقًا
- [ctx.modal](./modal.md): نوافذ منبثقة خفيفة (معلومات، تأكيد، إلخ)

> يوفر `ctx.viewer` طرقًا مثل `dialog()` و `drawer()` و `popover()` و `embed()` لفتح العروض، ويمكن الوصول إلى `ctx.view` داخل المحتوى (`content`) الذي تفتحه هذه الطرق.