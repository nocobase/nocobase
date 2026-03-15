:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/resource/api-resource).
:::

# APIResource

**مورد API عام** يعتمد على عنوان URL لإرسال الطلبات، وهو مناسب لأي واجهة HTTP. يرث من الفئة الأساسية `FlowResource` ويوسعها بتهيئة الطلب و `refresh()`. على عكس [MultiRecordResource](./multi-record-resource.md) و [SingleRecordResource](./single-record-resource.md)، لا يعتمد `APIResource` على اسم المورد، بل يرسل الطلبات مباشرة عبر URL، مما يجعله مناسباً للواجهات المخصصة، وواجهات برمجة التطبيقات الخارجية (Third-party APIs)، وغيرها من السيناريوهات.

**طريقة الإنشاء**: `ctx.makeResource('APIResource')` أو `ctx.initResource('APIResource')`. يجب تعيين `setURL()` قبل الاستخدام؛ في سياق RunJS، يتم حقن `ctx.api` (APIClient) تلقائياً، لذا لا حاجة لاستدعاء `setAPIClient` يدوياً.

---

## سيناريوهات الاستخدام

| السيناريو | الوصف |
|------|------|
| **واجهة مخصصة** | استدعاء واجهات برمجة تطبيقات لموارد غير قياسية (مثل `/api/custom/stats` أو `/api/reports/summary`). |
| **واجهة برمجة تطبيقات خارجية** | طلب خدمات خارجية عبر عنوان URL كامل (يتطلب دعم CORS من الهدف). |
| **استعلام لمرة واحدة** | جلب بيانات مؤقتة يتم التخلص منها بعد الاستخدام، دون الحاجة لربطها بـ `ctx.resource`. |
| **المفاضلة بين APIResource و ctx.request** | استخدم `APIResource` عندما تكون هناك حاجة لبيانات تفاعلية (Reactive)، أحداث، أو إدارة حالات الخطأ؛ استخدم `ctx.request()` للطلبات البسيطة التي تُنفذ لمرة واحدة. |

---

## قدرات الفئة الأساسية (FlowResource)

تتمتع جميع الموارد (Resources) بما يلي:

| الطريقة | الوصف |
|------|------|
| `getData()` | الحصول على البيانات الحالية. |
| `setData(value)` | تعيين البيانات (محلياً فقط). |
| `hasData()` | التحقق من وجود بيانات. |
| `getMeta(key?)` / `setMeta(meta)` | قراءة وكتابة البيانات الوصفية (Metadata). |
| `getError()` / `setError(err)` / `clearError()` | إدارة حالة الخطأ. |
| `on(event, callback)` / `once` / `off` / `emit` | الاشتراك في الأحداث وإطلاقها. |

---

## تهيئة الطلب

| الطريقة | الوصف |
|------|------|
| `setAPIClient(api)` | تعيين مثيل APIClient (يتم حقنه تلقائياً في RunJS عادةً). |
| `getURL()` / `setURL(url)` | عنوان URL للطلب. |
| `loading` | قراءة/كتابة حالة التحميل (get/set). |
| `clearRequestParameters()` | مسح معلمات الطلب. |
| `setRequestParameters(params)` | دمج وتعيين معلمات الطلب. |
| `setRequestMethod(method)` | تعيين طريقة الطلب (مثل `'get'`، `'post'`، الافتراضي هو `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | ترويسات الطلب (Headers). |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | إضافة، حذف، أو استعلام عن معلمة واحدة. |
| `setRequestBody(data)` | جسم الطلب (يُستخدم مع POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | خيارات الطلب العامة. |

---

## تنسيق URL

- **نمط المورد**: يدعم اختصارات موارد NocoBase، مثل `users:list` أو `posts:get`؛ حيث يتم دمجها مع `baseURL`.
- **مسار نسبي**: مثل `/api/custom/endpoint`؛ يتم دمجه مع `baseURL` الخاص بالتطبيق.
- **عنوان URL كامل**: يُستخدم للطلبات عبر النطاقات (Cross-origin)؛ يجب أن يكون الهدف مهيأً لـ CORS.

---

## جلب البيانات

| الطريقة | الوصف |
|------|------|
| `refresh()` | يرسل طلباً بناءً على URL، والطريقة، والمعلمات، والترويسات، والبيانات الحالية. يقوم بكتابة `data` الاستجابة في `setData(data)` ويطلق حدث `'refresh'`. عند الفشل، يقوم بتعيين `setError(err)` ويرمي `ResourceError` دون إطلاق حدث `refresh`. يتطلب تعيين `api` و URL مسبقاً. |

---

## أمثلة

### طلب GET أساسي

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### عنوان URL بنمط المورد

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### طلب POST (مع جسم الطلب)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'تجربة', type: 'report' });
await res.refresh();
const result = res.getData();
```

### الاستماع لحدث refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>الإحصائيات: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### معالجة الأخطاء

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'فشل الطلب');
}
```

### ترويسات طلب مخصصة

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## ملاحظات

- **الاعتماد على ctx.api**: في RunJS، يتم حقن `ctx.api` بواسطة بيئة التشغيل؛ لذا فإن استدعاء `setAPIClient` يدوياً غير ضروري عادةً. إذا تم استخدامه في سياق خارجي، يجب تعيينه بنفسك.
- **refresh تعني إرسال طلب**: تقوم `refresh()` بإرسال طلب بناءً على الإعدادات الحالية؛ لذا يجب ضبط الطريقة، والمعلمات، والبيانات، وما إلى ذلك قبل الاستدعاء.
- **الأخطاء لا تُحدث البيانات**: عند فشل الطلب، تحتفظ `getData()` بقيمتها السابقة؛ ويمكن الحصول على معلومات الخطأ عبر `getError()`.
- **المقارنة مع ctx.request**: استخدم `ctx.request()` للطلبات البسيطة التي تُنفذ لمرة واحدة؛ واستخدم `APIResource` عندما تكون هناك حاجة لإدارة البيانات التفاعلية، والأحداث، وحالة الخطأ.

---

## روابط ذات صلة

- [ctx.resource](../context/resource.md) - مثيل المورد في السياق الحالي
- [ctx.initResource()](../context/init-resource.md) - تهيئة المورد وربطه بـ `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - إنشاء مثيل مورد جديد دون ربطه
- [ctx.request()](../context/request.md) - طلب HTTP عام، مناسب للاستدعاءات البسيطة لمرة واحدة
- [MultiRecordResource](./multi-record-resource.md) - مخصص للمجموعات/القوائم، يدعم CRUD والترقيم (Pagination)
- [SingleRecordResource](./single-record-resource.md) - مخصص للسجلات الفردية