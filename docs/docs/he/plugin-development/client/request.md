:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בקשות

NocoBase מספקת `APIClient` המבוסס על [Axios](https://axios-http.com/), שבו תוכלו להשתמש כדי לשלוח בקשות HTTP מכל מקום שבו ניתן לגשת ל-`Context`.

מיקומים נפוצים שבהם ניתן לגשת ל-`Context` כוללים:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` היא השיטה הנפוצה ביותר לשליחת בקשות. הפרמטרים וערכי ההחזרה שלה זהים לחלוטין לאלו של [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

שימוש בסיסי

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

תוכלו להשתמש ישירות בתצורות בקשה סטנדרטיות של Axios:

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

`ctx.api.axios` הוא מופע (instance) של `AxiosInstance`, שבאמצעותו תוכלו לשנות הגדרות ברירת מחדל גלובליות או להוסיף מיירטי בקשות (request interceptors).

שינוי הגדרות ברירת מחדל

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

למידע נוסף על הגדרות זמינות, עיינו ב-[הגדרות ברירת המחדל של Axios](https://axios-http.com/docs/config_defaults).

## מיירטי בקשות ותגובות

באמצעות מיירטים, תוכלו לעבד בקשות לפני שליחתן או תגובות לאחר קבלתן. לדוגמה, הוספה אחידה של כותרות בקשה, סידור פרמטרים (serialization), או הצגת הודעות שגיאה מאוחדות.

### דוגמה למיירט בקשות

```ts
// השתמשו ב-qs כדי לסדר את הפרמטרים (serialize params)
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// כותרות בקשה מותאמות אישית
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

### דוגמה למיירט תגובות

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // במקרה של כשל בבקשה, הציגו הודעת התראה אחידה
    ctx.notification.error({
      message: 'שגיאת תגובת בקשה',
    });
    return Promise.reject(error);
  },
);
```

## כותרות בקשה מותאמות אישית בשרת NocoBase

להלן כותרות הבקשה המותאמות אישית הנתמכות על ידי שרת NocoBase, וניתן להשתמש בהן בתרחישים של ריבוי יישומים, בינאום, ריבוי תפקידים או ריבוי שיטות אימות.

| Header | תיאור |
|--------|------|
| `X-App` | מציין את היישום הנוכחי שאליו ניגשים בתרחישי ריבוי יישומים |
| `X-Locale` | השפה הנוכחית (לדוגמה: `zh-CN`, `en-US`) |
| `X-Hostname` | שם המארח של הלקוח |
| `X-Timezone` | אזור הזמן של הלקוח (לדוגמה: `+08:00`) |
| `X-Role` | התפקיד הנוכחי |
| `X-Authenticator` | שיטת אימות המשתמש הנוכחית |

> 💡 **טיפ**  
> כותרות בקשה אלו מוזרקות בדרך כלל באופן אוטומטי על ידי מיירטים ואין צורך להגדיר אותן ידנית. רק בתרחישים מיוחדים (כמו סביבות בדיקה או תרחישי ריבוי מופעים) תצטרכו להוסיף אותן באופן ידני.

## שימוש ברכיבים

ברכיבי React, תוכלו לקבל את אובייקט ה-context באמצעות `useFlowContext()` ולאחר מכן לקרוא ל-`ctx.api` כדי לשלוח בקשות.

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

  return <div>טוען...</div>;
};
```

### שימוש עם useRequest של ahooks

בפיתוח בפועל, תוכלו לשלב את Hook ה-`useRequest` שמסופק על ידי [ahooks](https://ahooks.js.org/hooks/use-request/index), כדי לטפל בצורה נוחה יותר במחזור החיים ובמצב של הבקשות.

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

  if (loading) return <div>טוען...</div>;
  if (error) return <div>שגיאת בקשה: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>רענן</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

גישה זו הופכת את לוגיקת הבקשות ליותר הצהרתית (declarative), ומנהלת באופן אוטומטי את מצבי הטעינה, טיפול בשגיאות ולוגיקת הרענון, מה שהופך אותה למתאימה מאוד לשימוש ברכיבים.