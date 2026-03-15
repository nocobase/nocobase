:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/import-modules).
:::

# استيراد الوحدات

يمكن استخدام نوعين من الوحدات في RunJS: **الوحدات المدمجة** (تُستخدم مباشرة عبر `ctx.libs` دون الحاجة إلى استيراد `import`) و **الوحدات الخارجية** (يتم تحميلها عند الطلب عبر `ctx.importAsync()` أو `ctx.requireAsync()`).

---

## الوحدات المدمجة - ctx.libs (لا يتطلب استيراد)

يتضمن RunJS مكتبات مدمجة شائعة الاستخدام يمكن الوصول إليها مباشرة عبر `ctx.libs` دون الحاجة إلى `import` أو تحميل غير متزامن.

| الخاصية | الوصف |
|------|------|
| **ctx.libs.React** | نواة React، تُستخدم لـ JSX و Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (يمكن استخدامها مع `createRoot` وما إلى ذلك) |
| **ctx.libs.antd** | مكتبة مكونات Ant Design |
| **ctx.libs.antdIcons** | أيقونات Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): التعبيرات الرياضية، عمليات المصفوفات، إلخ. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): صيغ شبيهة بـ Excel (مثل SUM و AVERAGE وغيرها) |

### مثال: React و antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>انقر هنا</Button>);
```

### مثال: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### مثال: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## الوحدات الخارجية

عند الحاجة إلى مكتبات خارجية، اختر طريقة التحميل بناءً على تنسيق الوحدة:

- **وحدات ESM** ← استخدم `ctx.importAsync()`
- **وحدات UMD/AMD** ← استخدم `ctx.requireAsync()`

---

### استيراد وحدات ESM

استخدم **`ctx.importAsync()`** لتحميل وحدات ESM ديناميكيًا عبر رابط URL، وهو مناسب لسيناريوهات مثل كتل JS، وحقول JS، وعمليات JS.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: عنوان وحدة ESM. يدعم التنسيقات المختصرة مثل `<package>@<version>` أو المسارات الفرعية مثل `<package>@<version>/<file-path>` (على سبيل المثال `vue@3.4.0` أو `lodash@4/lodash.js`)؛ حيث سيتم إضافة بادئة CDN المهيأة تلقائيًا. كما يدعم روابط URL الكاملة.
- **النتيجة**: الكائن الخاص بنطاق تسمية الوحدة (Namespace) الذي تم تحليله.

#### الافتراضي هو https://esm.sh

في حال عدم التهيئة، ستستخدم الصيغ المختصرة **https://esm.sh** كبادئة لـ CDN. على سبيل المثال:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// يعادل التحميل من https://esm.sh/vue@3.4.0
```

#### خدمة esm.sh مستضافة ذاتيًا

إذا كنت بحاجة إلى شبكة داخلية أو CDN مستضاف ذاتيًا، يمكنك نشر خدمة متوافقة مع بروتوكول esm.sh وتحديدها عبر متغيرات البيئة:

- **ESM_CDN_BASE_URL**: العنوان الأساسي لـ ESM CDN (الافتراضي `https://esm.sh`)
- **ESM_CDN_SUFFIX**: لاحقة اختيارية (مثل `/+esm` لـ jsDelivr)

للاستضافة الذاتية، راجع: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### استيراد وحدات UMD/AMD

استخدم **`ctx.requireAsync()`** لتحميل وحدات UMD/AMD أو السكربتات التي يتم إلحاقها بالكائن العام (global object) بشكل غير متزامن عبر رابط URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: يدعم شكلين:
  - **المسار المختصر**: `<package>@<version>/<file-path>`، وهو مشابه لـ `ctx.importAsync()` ويتم تحليله وفقًا لتهيئة ESM CDN الحالية. عند التحليل، يتم إضافة `?raw` لطلب الملف الخام مباشرة (غالبًا ما يكون بناء UMD). على سبيل المثال، `echarts@5/dist/echarts.min.js` يطلب فعليًا `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (عند استخدام esm.sh الافتراضي).
  - **رابط URL كامل**: أي عنوان CDN كامل (مثل `https://cdn.jsdelivr.net/npm/xxx`).
- **النتيجة**: كائن المكتبة المحملة (يعتمد الشكل المحدد على كيفية تصدير المكتبة لمحتواها).

بعد التحميل، ترفق العديد من مكتبات UMD نفسها بالكائن العام (مثل `window.xxx`)؛ يمكنك استخدامها كما هو موضح في وثائق المكتبة.

**مثال**

```ts
// مسار مختصر (يتم تحليله عبر esm.sh كـ ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// رابط URL كامل
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**ملاحظة**: إذا كانت المكتبة توفر إصدار ESM، فمن الأفضل استخدام `ctx.importAsync()` للحصول على دلالات برمجية أفضل للوحدات ودعم تقنية Tree-shaking.