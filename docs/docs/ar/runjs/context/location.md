:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/location).
:::

# ctx.location

معلومات موقع المسار الحالي، وهي تعادل كائن `location` في React Router. تُستخدم عادةً بالاقتران مع `ctx.router` و `ctx.route` لقراءة المسار الحالي، وسلسلة الاستعلام (query string)، والـ hash، والحالة (state) التي يتم تمريرها عبر المسار.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / JSField** | إجراء رندر مشروط أو تفريع منطقي بناءً على المسار الحالي أو معاملات الاستعلام أو الـ hash. |
| **قواعد الربط / تدفق الأحداث** | قراءة معاملات استعلام URL لإجراء تصفية الربط، أو تحديد المصدر بناءً على `location.state`. |
| **المعالجة بعد التنقل** | استقبال البيانات الممررة من الصفحة السابقة عبر `ctx.router.navigate` باستخدام `ctx.location.state` في الصفحة الهدف. |

> ملاحظة: `ctx.location` متاح فقط في بيئات RunJS التي تحتوي على سياق توجيه (مثل JSBlock داخل الصفحة، أو تدفق الأحداث، إلخ)؛ وقد يكون فارغاً في السياقات الخلفية البحتة أو التي لا تحتوي على توجيه (مثل سير العمل Workflow).

## تعريف النوع

```ts
location: Location;
```

`Location` يأتي من `react-router-dom` وهو مطابق للقيمة الراجعة من `useLocation()` في React Router.

## الحقول الشائعة

| الحقل | النوع | الوصف |
|------|------|------|
| `pathname` | `string` | المسار الحالي، يبدأ بـ `/` (مثلاً `/admin/users`). |
| `search` | `string` | سلسلة الاستعلام، تبدأ بـ `?` (مثلاً `?page=1&status=active`). |
| `hash` | `string` | جزء الـ hash، يبدأ بـ `#` (مثلاً `#section-1`). |
| `state` | `any` | بيانات اختيارية يتم تمريرها عبر `ctx.router.navigate(path, { state })` ولا تظهر في عنوان URL. |
| `key` | `string` | معرف فريد لهذا الموقع؛ الصفحة الأولية تكون `"default"`. |

## العلاقة مع ctx.router و ctx.urlSearchParams

| الغرض | الاستخدام الموصى به |
|------|----------|
| **قراءة المسار، الـ hash، والـ state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **قراءة معاملات الاستعلام (ككائن)** | `ctx.urlSearchParams` حيث يوفر الكائن المحلل مباشرة. |
| **تحليل سلسلة search** | `new URLSearchParams(ctx.location.search)` أو استخدام `ctx.urlSearchParams` مباشرة. |

يتم تحليل `ctx.urlSearchParams` من `ctx.location.search`. إذا كنت تحتاج فقط إلى معاملات الاستعلام، فإن استخدام `ctx.urlSearchParams` أكثر ملاءمة.

## أمثلة

### التفريع بناءً على المسار

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('حالياً في صفحة إدارة المستخدمين');
}
```

### تحليل معاملات الاستعلام

```ts
// الطريقة 1: استخدام ctx.urlSearchParams (موصى به)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// الطريقة 2: استخدام URLSearchParams لتحليل search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### استقبال الحالة (state) الممررة عبر التنقل

```ts
// عند الانتقال من الصفحة السابقة: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('تم الانتقال من لوحة التحكم');
}
```

### تحديد المواقع عبر الـ hash

```ts
const hash = ctx.location.hash; // مثلاً "#edit"
if (hash === '#edit') {
  // التمرير إلى منطقة التحرير أو تنفيذ المنطق المقابل
}
```

## روابط ذات صلة

- [ctx.router](./router.md): التنقل بين المسارات؛ يمكن استرجاع الـ `state` من `ctx.router.navigate` عبر `ctx.location.state` في الصفحة الهدف.
- [ctx.route](./route.md): معلومات مطابقة المسار الحالي (المعاملات، التكوين، إلخ)، وغالباً ما تُستخدم بالاقتران مع `ctx.location`.