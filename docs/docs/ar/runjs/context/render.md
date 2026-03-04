:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/render).
:::

# ctx.render()

يقوم بتصيير (Render) عناصر React، أو سلاسل HTML النصية، أو عُقد DOM في حاوية محددة. عند عدم تمرير `container` (الحاوية)، يتم التصيير افتراضيًا في `ctx.element` ويرث تلقائيًا سياق التطبيق (Context) مثل ConfigProvider والسمات (Themes).

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | تصيير محتوى مخصص للكتل (رسوم بيانية، قوائم، بطاقات، إلخ) |
| **JSField / JSItem / JSColumn** | تصيير عرض مخصص للحقول القابلة للتحرير أو أعمدة الجداول |
| **كتلة التفاصيل** | تخصيص تنسيق عرض الحقول في صفحات التفاصيل |

> ملاحظة: يتطلب `ctx.render()` حاوية تصيير. إذا لم يتم تمرير `container` ولم يكن `ctx.element` موجودًا (كما في سيناريوهات المنطق الصرف بدون واجهة مستخدم)، فسيتم طرح خطأ.

## تعريف النوع

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| المعلمة | النوع | الوصف |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | المحتوى المراد تصييره |
| `container` | `Element` \| `DocumentFragment` (اختياري) | حاوية التصيير المستهدفة، الافتراضي هو `ctx.element` |

**قيمة الإرجاع**:

- عند تصيير **عنصر React**: يعيد `ReactDOMClient.Root` لتسهيل استدعاء `root.render()` للتحديثات اللاحقة.
- عند تصيير **سلسلة HTML نصية** أو **عقدة DOM**: يعيد `null`.

## وصف أنواع vnode

| النوع | السلوك |
|------|------|
| `React.ReactElement` (JSX) | يتم التصيير باستخدام `createRoot` الخاص بـ React، مع توفير إمكانيات React الكاملة ووراثة سياق التطبيق تلقائيًا. |
| `string` | يضبط `innerHTML` للحاوية بعد التطهير باستخدام DOMPurify؛ سيتم إلغاء تثبيت (Unmount) أي جذر React موجود أولاً. |
| `Node` (Element، Text، إلخ) | يتم الإلحاق عبر `appendChild` بعد إفراغ الحاوية؛ سيتم إلغاء تثبيت أي جذر React موجود أولاً. |
| `DocumentFragment` | يتم إلحاق العقد الفرعية للقطعة بالحاوية؛ سيتم إلغاء تثبيت أي جذر React موجود أولاً. |

## أمثلة

### تصيير عناصر React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('العنوان')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('تم النقر'))}>
      {ctx.t('زر')}
    </Button>
  </Card>
);
```

### تصيير سلاسل HTML النصية

```ts
ctx.render('<h1>Hello World</h1>');

// الدمج مع ctx.t للتدويل (Internationalization)
ctx.render('<div style="padding:16px">' + ctx.t('المحتوى') + '</div>');

// التصيير الشرطي
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### تصيير عُقد DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// تصيير حاوية فارغة أولاً، ثم تسليمها لمكتبة خارجية (مثل ECharts) للتهيئة
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### تحديد حاوية مخصصة

```ts
// التصيير في عنصر DOM محدد
const customEl = document.getElementById('my-container');
ctx.render(<div>المحتوى</div>, customEl);
```

### الاستدعاءات المتعددة تستبدل المحتوى

```ts
// الاستدعاء الثاني سيحل محل المحتوى الموجود في الحاوية
ctx.render(<div>الأول</div>);
ctx.render(<div>الثاني</div>);  // سيتم عرض "الثاني" فقط
```

## ملاحظات

- **الاستدعاءات المتعددة تستبدل المحتوى**: كل استدعاء لـ `ctx.render()` يحل محل المحتوى الموجود في الحاوية بدلاً من الإلحاق به.
- **أمان سلاسل HTML النصية**: يتم تطهير HTML الممرر عبر DOMPurify لتقليل مخاطر XSS، ولكن لا يزال يُنصح بتجنب دمج مدخلات المستخدم غير الموثوقة.
- **لا تقم بتعديل ctx.element مباشرة**: تم إهمال `ctx.element.innerHTML`؛ يجب استخدام `ctx.render()` بشكل موحد بدلاً من ذلك.
- **تمرير الحاوية عند عدم وجود حاوية افتراضية**: في السيناريوهات التي يكون فيها `ctx.element` غير معرف (`undefined`) (على سبيل المثال، داخل الوحدات المحملة عبر `ctx.importAsync`)، يجب توفير `container` بشكل صريح.

## ذات صلة

- [ctx.element](./element.md) - حاوية التصيير الافتراضية، تُستخدم عند عدم تمرير حاوية إلى `ctx.render()`.
- [ctx.libs](./libs.md) - المكتبات المدمجة مثل React و Ant Design، تُستخدم لتصيير JSX.
- [ctx.importAsync()](./import-async.md) - يُستخدم بالاقتران مع `ctx.render()` بعد تحميل مكتبات React أو المكونات الخارجية عند الطلب.