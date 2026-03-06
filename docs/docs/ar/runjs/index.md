:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/index).
:::

# نظرة عامة على RunJS

RunJS هي بيئة تنفيذ JavaScript المستخدمة في NocoBase لحالات مثل **كتل JS**، و**حقول JS**، و**إجراءات JS**. يتم تشغيل الكود في بيئة معزولة (Sandbox) مقيدة، مما يوفر وصولاً آمناً إلى `ctx` (واجهة برمجة تطبيقات السياق - Context API) ويتضمن الإمكانيات التالية:

- الـ `await` في المستوى الأعلى (Top-level `await`)
- استيراد الوحدات الخارجية
- الرندرة (Rendering) داخل الحاويات
- المتغيرات العالمية

## الـ `await` في المستوى الأعلى (Top-level `await`)

يدعم RunJS الـ `await` في المستوى الأعلى، مما يلغي الحاجة إلى تغليف الكود في IIFE.

**غير مستحسن**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**مستحسن**

```js
async function test() {}
await test();
```

## استيراد الوحدات الخارجية

- استخدم `ctx.importAsync()` لوحدات ESM (مستحسن)
- استخدم `ctx.requireAsync()` لوحدات UMD/AMD

## الرندرة داخل الحاويات

استخدم `ctx.render()` لرندرة المحتوى داخل الحاوية الحالية (`ctx.element`). وهو يدعم التنسيقات الثلاثة التالية:

### رندرة JSX

```jsx
ctx.render(<button>Button</button>);
```

### رندرة عقد DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### رندرة سلاسل HTML النصية

```js
ctx.render('<h1>Hello World</h1>');
```

## المتغيرات العالمية

- `window`
- `document`
- `navigator`
- `ctx`