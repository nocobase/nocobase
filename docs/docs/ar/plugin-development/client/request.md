:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# الطلبات

توفر NocoBase `APIClient`، وهو غلاف مبني على [Axios](https://axios-http.com/)، ويمكن استخدامه لإرسال طلبات HTTP من أي مكان يمكن الوصول فيه إلى `Context`.

تشمل المواقع الشائعة التي يمكنك الحصول على `Context` منها ما يلي:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` هي الطريقة الأكثر استخدامًا لإرسال الطلبات. تتطابق معاييرها وقيم الإرجاع الخاصة بها تمامًا مع [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

الاستخدام الأساسي

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

يمكنك استخدام إعدادات طلب Axios القياسية مباشرةً:

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios` هو مثيل `AxiosInstance`، والذي يمكنك من خلاله تعديل الإعدادات الافتراضية العامة أو إضافة معترضات الطلبات (request interceptors).

تعديل الإعدادات الافتراضية

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

لمزيد من الإعدادات المتاحة، راجع [إعدادات Axios الافتراضية](https://axios-http.com/docs/config_defaults).

## معترضات الطلبات والاستجابات

تتيح لك المعترضات (interceptors) معالجة الطلبات قبل إرسالها أو الاستجابات بعد عودتها. على سبيل المثال، يمكنك إضافة رؤوس طلبات موحدة، أو تسلسل المعايير، أو عرض رسائل خطأ موحدة.

### مثال على معترض الطلبات

```ts
// استخدام qs لتسلسل معايير params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// رؤوس طلبات مخصصة
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### مثال على معترض الاستجابات

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // عند حدوث خطأ في الطلب، يتم عرض إشعار موحد
    ctx.notification.error({
      message: 'خطأ في استجابة الطلب',
    });
    return Promise.reject(error);
  },
);
```

## رؤوس طلبات مخصصة لخادم NocoBase

فيما يلي رؤوس الطلبات المخصصة التي يدعمها خادم NocoBase، والتي يمكن استخدامها في سيناريوهات التطبيقات المتعددة، والعولمة، والأدوار المتعددة، أو المصادقة المتعددة.

| الرأس | الوصف |
|--------|------|
| `X-App` | يحدد التطبيق الحالي الذي يتم الوصول إليه في سيناريوهات التطبيقات المتعددة |
| `X-Locale` | اللغة الحالية (مثل: `zh-CN`، `en-US`) |
| `X-Hostname` | اسم مضيف العميل |
| `X-Timezone` | المنطقة الزمنية للعميل (مثل: `+08:00`) |
| `X-Role` | الدور الحالي |
| `X-Authenticator` | طريقة مصادقة المستخدم الحالية |

> 💡 **نصيحة**  
> عادةً ما يتم حقن رؤوس الطلبات هذه تلقائيًا بواسطة المعترضات ولا تحتاج إلى تعيينها يدويًا. تحتاج فقط إلى إضافتها يدويًا في سيناريوهات خاصة (مثل بيئات الاختبار أو سيناريوهات المثيلات المتعددة).

## الاستخدام في المكونات

في مكونات React، يمكنك الحصول على كائن السياق (context object) عبر `useFlowContext()`، ومن ثم استدعاء `ctx.api` لإرسال الطلبات.

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>جاري التحميل...</div>;
};
```

### الاستخدام مع useRequest من ahooks

في التطوير الفعلي، يمكنك استخدام Hook `useRequest` الذي توفره [ahooks](https://ahooks.js.org/hooks/use-request/index) لمعالجة دورة حياة الطلب وحالته بشكل أكثر ملاءمة.

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ في الطلب: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>تحديث</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

يجعل هذا الأسلوب منطق الطلبات أكثر تصريحية، ويدير تلقائيًا حالات التحميل، ومعالجة الأخطاء، ومنطق التحديث، مما يجعله مناسبًا جدًا للاستخدام في المكونات.