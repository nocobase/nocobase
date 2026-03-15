:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` هو مساحة الاسم (namespace) الموحدة للمكتبات المدمجة في RunJS، والتي تحتوي على مكتبات شائعة الاستخدام مثل React و Ant Design و dayjs و lodash. **لا يلزم استخدام `import` أو التحميل غير المتزامن**؛ حيث يمكن استخدامها مباشرة عبر `ctx.libs.xxx`.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | استخدام React + Ant Design لتقديم واجهة المستخدم (UI)، و dayjs لمعالجة التواريخ، و lodash لمعالجة البيانات. |
| **الصيغ / الحسابات** | استخدام formula أو math للصيغ الشبيهة بـ Excel وعمليات التعبير الرياضي. |
| **سير العمل / قواعد الربط** | استدعاء مكتبات الأدوات مثل lodash و dayjs و formula في سيناريوهات المنطق البحت. |

## نظرة عامة على المكتبات المدمجة

| الخاصية | الوصف | التوثيق |
|------|------|------|
| `ctx.libs.React` | نواة React، تُستخدم لـ JSX و Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | واجهة برمجة تطبيقات العميل لـ ReactDOM (بما في ذلك `createRoot`)، تُستخدم مع React للتقديم | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | مكتبة مكونات Ant Design (Button، Card، Table، Form، Input، Modal، إلخ) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | مكتبة أيقونات Ant Design (مثل PlusOutlined، UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | مكتبة أدوات التاريخ والوقت | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | مكتبة أدوات (get، set، debounce، إلخ) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | مكتبة دوال الصيغ الشبيهة بـ Excel (SUM، AVERAGE، IF، إلخ) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | مكتبة التعبيرات الرياضية والحسابات | [Math.js](https://mathjs.org/docs/) |

## الأسماء المستعارة للمستوى الأعلى

للتوافق مع الأكواد القديمة، يتم عرض بعض المكتبات أيضاً في المستوى الأعلى: `ctx.React` و `ctx.ReactDOM` و `ctx.antd` و `ctx.dayjs`. **يوصى باستخدام `ctx.libs.xxx` بشكل موحد** لتسهيل الصيانة والبحث في التوثيق.

## التحميل الكسول (Lazy Loading)

تستخدم `lodash` و `formula` و `math` **التحميل الكسول**: يتم تشغيل الاستيراد الديناميكي فقط عند الوصول إلى `ctx.libs.lodash` لأول مرة، ويتم إعادة استخدام ذاكرة التخزين المؤقت بعد ذلك. أما `React` و `antd` و `dayjs` و `antdIcons` فهي معدة مسبقاً بواسطة السياق ومتاحة للاستخدام الفوري.

## أمثلة

### التقديم باستخدام React و Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="العنوان">
    <Button type="primary">نقر</Button>
  </Card>
);
```

### استخدام Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### استخدام الأيقونات

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>المستخدم</Button>);
```

### معالجة التاريخ باستخدام dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### دوال الأدوات باستخدام lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### حسابات الصيغ (Formula)

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### التعبيرات الرياضية باستخدام math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## ملاحظات

- **الخلط مع ctx.importAsync**: إذا تم تحميل نسخة خارجية من React عبر `ctx.importAsync('react@19')`، فسيستخدم JSX تلك النسخة؛ في هذه الحالة، **لا** تخلطها مع `ctx.libs.antd`. يجب تحميل Ant Design ليتوافق مع إصدار React هذا (على سبيل المثال، `ctx.importAsync('antd@5.x')` و `ctx.importAsync('@ant-design/icons@5.x')`).
- **نسخ متعددة من React**: إذا ظهر خطأ "Invalid hook call" أو كان hook dispatcher فارغاً (null)، فعادة ما يكون ذلك بسبب وجود نسخ متعددة من React. قبل قراءة `ctx.libs.React` أو استدعاء Hooks، قم بتنفيذ `await ctx.importAsync('react@version')` أولاً لضمان مشاركة نفس نسخة React مع الصفحة.

## مواضيع ذات صلة

- [ctx.importAsync()](./import-async.md) - تحميل وحدات ESM الخارجية عند الطلب (مثل إصدارات محددة من React أو Vue)
- [ctx.render()](./render.md) - تقديم المحتوى إلى حاوية