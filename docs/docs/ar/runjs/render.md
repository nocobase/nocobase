:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/render).
:::

# العرض داخل الحاوية

استخدم `ctx.render()` لعرض المحتوى داخل الحاوية الحالية (`ctx.element`). يدعم هذا التابع الأشكال الثلاثة التالية:

## `ctx.render()`

### عرض JSX

```jsx
ctx.render(<button>Button</button>);
```

### عرض عُقد DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### عرض سلاسل HTML النصية

```js
ctx.render('<h1>Hello World</h1>');
```

## وصف JSX

يمكن لـ RunJS عرض JSX مباشرةً، حيث يمكنك استخدام مكتبات React والمكونات المدمجة، أو تحميل التبعيات الخارجية حسب الحاجة.

### استخدام React ومكتبات المكونات المدمجة

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### استخدام React ومكتبات المكونات الخارجية

قم بتحميل إصدارات محددة حسب الطلب عبر `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

مناسب للسيناريوهات التي تتطلب إصدارات محددة أو مكونات من طرف ثالث.

## ctx.element

استخدام غير موصى به (مهجور):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

الطريقة الموصى بها:

```js
ctx.render(<h1>Hello World</h1>);
```