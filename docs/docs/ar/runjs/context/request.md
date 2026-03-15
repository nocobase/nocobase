:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/request).
:::

# ctx.request()

إجراء طلبات HTTP موثقة داخل RunJS. يحمل الطلب تلقائياً `baseURL` و `Token` و `locale` و `role` الخاصة بالتطبيق الحالي، ويتبع منطق اعتراض الطلبات ومعالجة الأخطاء الخاص بالتطبيق.

## حالات الاستخدام

ينطبق على أي سيناريو في RunJS يتطلب إجراء طلب HTTP عن بُعد، مثل JSBlock و JSField و JSItem و JSColumn وسير العمل (Workflow) والربط (Linkage) و JSAction وغيرها.

## تعريف النوع

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

يعتمد `RequestOptions` على `AxiosRequestConfig` الخاص بـ Axios مع بعض الإضافات:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // ما إذا كان سيتم تخطي تنبيهات الخطأ العالمية عند فشل الطلب
  skipAuth?: boolean;                                 // ما إذا كان سيتم تخطي إعادة توجيه المصادقة (مثلاً عدم التوجيه لصفحة تسجيل الدخول عند الخطأ 401)
};
```

## المعاملات الشائعة

| المعامل | النوع | الوصف |
|------|------|------|
| `url` | string | رابط الطلب (URL). يدعم نمط الموارد (مثل `users:list` أو `posts:create`) أو رابطاً كاملاً. |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | طريقة HTTP، الافتراضية هي `'get'`. |
| `params` | object | معاملات الاستعلام (Query parameters)، يتم تسلسلها في الرابط. |
| `data` | any | جسم الطلب (Request body)، يستخدم مع post/put/patch. |
| `headers` | object | ترويسات الطلب المخصصة. |
| `skipNotify` | boolean \| (error) => boolean | إذا كانت القيمة true أو أعادت الدالة true، فلن تظهر تنبيهات الخطأ العالمية عند الفشل. |
| `skipAuth` | boolean | إذا كانت القيمة true، فلن تؤدي أخطاء 401 وغيرها إلى إطلاق إعادة توجيه المصادقة (مثل التوجيه لصفحة تسجيل الدخول). |

## روابط بنمط الموارد (Resource Style URL)

تدعم واجهة برمجة تطبيقات الموارد في NocoBase صيغة مختصرة بتنسيق `المورد:الإجراء`:

| التنسيق | الوصف | مثال |
|------|------|------|
| `collection:action` | عمليات CRUD لمجموعة واحدة | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | الموارد المرتبطة (تتطلب تمرير المفتاح الأساسي عبر `resourceOf` أو الرابط) | `posts.comments:list` |

سيتم دمج المسارات النسبية مع `baseURL` الخاص بالتطبيق (عادةً ما يكون `/api`)؛ أما الطلبات عبر النطاقات (cross-origin) فيجب أن تستخدم رابطاً كاملاً، ويجب تهيئة الخدمة المستهدفة لدعم CORS.

## هيكل الاستجابة

القيمة المرجعة هي كائن استجابة Axios، ومن الحقول الشائعة فيه:

- `response.data`: جسم الاستجابة.
- واجهات القوائم عادةً ما تعيد `data.data` (مصفوفة السجلات) + `data.meta` (الترقيم الصفحي وما إلى ذلك).
- واجهات السجل الواحد أو الإنشاء أو التحديث عادةً ما تعيد السجل في `data.data`.

## أمثلة

### استعلام القائمة

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // معلومات الترقيم الصفحي وغيرها
```

### إرسال البيانات

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'John Doe', email: 'johndoe@example.com' },
});

const newRecord = res?.data?.data;
```

### مع التصفية والفرز

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### تخطي تنبيهات الخطأ

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // لا تظهر رسالة خطأ عالمية عند الفشل
});

// أو اتخاذ القرار بناءً على نوع الخطأ
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### طلب عبر النطاقات (Cross-Origin)

عند استخدام رابط كامل لطلب نطاقات أخرى، يجب تهيئة الخدمة المستهدفة لدعم CORS للسماح بمصدر التطبيق الحالي. إذا كانت الواجهة المستهدفة تتطلب الـ token الخاص بها، فيمكن تمريره عبر الترويسات:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target_service_token>',
  },
});
```

### العرض باستخدام ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('قائمة المستخدمين') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## ملاحظات

- **معالجة الأخطاء**: سيؤدي فشل الطلب إلى رمي استثناء، وستظهر رسالة خطأ عالمية افتراضياً. استخدم `skipNotify: true` لالتقاط الخطأ ومعالجته بنفسك.
- **المصادقة**: ستحمل الطلبات داخل نفس النطاق تلقائياً الـ Token واللغة (locale) والدور (role) للمستخدم الحالي؛ الطلبات عبر النطاقات تتطلب دعم CORS من الهدف وتمرير الـ token في الترويسات حسب الحاجة.
- **صلاحيات الموارد**: تخضع الطلبات لقيود قائمة التحكم في الوصول (ACL)، ولا يمكن الوصول إلا للموارد التي يمتلك المستخدم الحالي صلاحية عليها.

## ذات صلة

- [ctx.message](./message.md) - عرض تنبيهات خفيفة بعد اكتمال الطلب
- [ctx.notification](./notification.md) - عرض إشعارات بعد اكتمال الطلب
- [ctx.render](./render.md) - رندر نتائج الطلب في الواجهة
- [ctx.makeResource](./make-resource.md) - بناء كائن مورد لتحميل البيانات المتسلسل (بديل لـ `ctx.request`)