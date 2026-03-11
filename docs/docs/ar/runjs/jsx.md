:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/jsx).
:::

# JSX

يدعم RunJS صيغة JSX، مما يتيح لك كتابة التعليمات البرمجية بشكل مشابه لمكونات React. يتم تجميع (compile) JSX تلقائياً قبل التنفيذ.

## ملاحظات التجميع

- يستخدم [sucrase](https://github.com/alangpierce/sucrase) لتحويل JSX.
- يتم تجميع JSX إلى `ctx.libs.React.createElement` و `ctx.libs.React.Fragment`.
- **لا حاجة لاستيراد React**: يمكنك كتابة JSX مباشرة؛ حيث سيتم استخدام `ctx.libs.React` تلقائياً بعد التجميع.
- عند تحميل React خارجي عبر `ctx.importAsync('react@x.x.x')`، سيتحول JSX لاستخدام تابع `createElement` من تلك النسخة المحددة.

## استخدام React والمكونات المدمجة

يتضمن RunJS مكتبة React ومكتبات واجهة المستخدم (UI) الشائعة بشكل مدمج. يمكنك الوصول إليها مباشرة عبر `ctx.libs` دون الحاجة لاستخدام `import`:

- **ctx.libs.React** — نواة React
- **ctx.libs.ReactDOM** — ReactDOM (يمكن استخدامه مع `createRoot` إذا لزم الأمر)
- **ctx.libs.antd** — مكونات Ant Design
- **ctx.libs.antdIcons** — أيقونات Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>نقر</Button>);
```

عند كتابة JSX مباشرة، لا تحتاج إلى تفكيك (destructure) React. ستحتاج فقط إلى التفكيك من `ctx.libs` عند استخدام **Hooks** (مثل `useState` و `useEffect`) أو **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**ملاحظة**: لا يمكن الخلط بين React المدمج و React الخارجي المستورد عبر `ctx.importAsync()`. إذا كنت تستخدم مكتبة واجهة مستخدم خارجية، فيجب استيراد React أيضاً من نفس المصدر الخارجي.

## استخدام React والمكونات الخارجية

عند تحميل إصدار محدد من React ومكتبات واجهة المستخدم عبر `ctx.importAsync()`، سيستخدم JSX نسخة React تلك:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>نقر</Button>);
```

إذا كانت antd تعتمد على react/react-dom، يمكنك تحديد نفس الإصدار عبر `deps` لتجنب تعدد النسخ:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**ملاحظة**: عند استخدام React خارجي، يجب أيضاً استيراد مكتبات واجهة المستخدم مثل antd عبر `ctx.importAsync()`. لا تخلط بينها وبين `ctx.libs.antd`.

## نقاط أساسية في صيغة JSX

- **المكونات والخصائص (props)**: `<Button type="primary">نص</Button>`
- **Fragment**: `<>...</>` أو `<React.Fragment>...</React.Fragment>` (يتطلب تفكيك `const { React } = ctx.libs` عند استخدام Fragment)
- **التعبيرات (Expressions)**: استخدم `{expression}` في JSX لإدراج المتغيرات أو العمليات، مثل `{ctx.user.name}` أو `{count + 1}`؛ لا تستخدم صيغة القوالب `{{ }}`.
- **الصيرورة الشرطية (Conditional Rendering)**: `{flag && <span>المحتوى</span>}` أو `{flag ? <A /> : <B />}`
- **صيرورة القوائم (List Rendering)**: استخدم `array.map()` لإرجاع قائمة من العناصر، وتأكد من تعيين `key` ثابت لكل عنصر.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```