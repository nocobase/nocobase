---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# كتلة Iframe

## مقدمة

تتيح كتلة Iframe تضمين صفحات ويب أو محتوى خارجي داخل الصفحة الحالية. يمكن للمستخدمين دمج التطبيقات الخارجية بسلاسة عن طريق تهيئة عنوان URL أو إدراج كود HTML مباشرةً. عند استخدام HTML، يمكن للمستخدمين تخصيص المحتوى بمرونة لتلبية احتياجات العرض المحددة، مما يجعلها مثالية للسيناريوهات التي تتطلب عرضًا مخصصًا. يتيح هذا الأسلوب تحميل الموارد الخارجية دون الحاجة إلى إعادة توجيه، مما يعزز تجربة المستخدم وتفاعلية الصفحة.

## التثبيت

إنها إضافة مدمجة، لا تتطلب تثبيتًا.

## إضافة الكتل

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

يمكنك تهيئة عنوان URL أو كود HTML لتضمين التطبيق الخارجي مباشرةً.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## محرك القوالب

### قالب السلسلة النصية

محرك القوالب الافتراضي.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

لمزيد من المعلومات، يرجى الرجوع إلى وثائق قالب Handlebars.

## تمرير المتغيرات

### دعم HTML لتحليل المتغيرات

#### دعم اختيار المتغيرات من محدد المتغيرات في سياق الكتلة الحالية

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### دعم حقن المتغيرات في التطبيق واستخدامها عبر الكود

يمكنك أيضًا حقن متغيرات مخصصة في التطبيق عبر الكود واستخدامها في HTML. على سبيل المثال، إنشاء تطبيق تقويم ديناميكي باستخدام Vue 3 و Element Plus:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

مثال: مكون تقويم بسيط تم إنشاؤه باستخدام React و Ant Design (antd)، ويستخدم dayjs للتعامل مع التواريخ:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### دعم عنوان URL للمتغيرات

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

لمزيد من المعلومات حول المتغيرات، يرجى الرجوع إلى وثائق المتغيرات.

## إنشاء إطارات Iframe باستخدام كتل JS (NocoBase 2.0)

في NocoBase 2.0، يمكنك استخدام كتل JS لإنشاء إطارات iframe ديناميكيًا مع تحكم أكبر. يوفر هذا الأسلوب مرونة أفضل لتخصيص سلوك وتصميم إطار iframe.

### مثال أساسي

أنشئ كتلة JS واستخدم الكود التالي لإنشاء إطار iframe:

```javascript
// إنشاء إطار iframe يملأ حاوية الكتلة الحالية
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// استبدال العناصر الفرعية الموجودة لجعل iframe هو المحتوى الوحيد
ctx.element.replaceChildren(iframe);
```

### نقاط رئيسية

- **ctx.element**: عنصر DOM لحاوية كتلة JS الحالية.
- **سمة sandbox**: تتحكم في قيود الأمان لمحتوى إطار iframe.
  - `allow-scripts`: تسمح لإطار iframe بتنفيذ السكريبتات.
  - `allow-same-origin`: تسمح لإطار iframe بالوصول إلى مصدره الخاص.
- **replaceChildren()**: تستبدل جميع العناصر الفرعية للحاوية بإطار iframe.

### مثال متقدم مع حالة التحميل

يمكنك تحسين إنشاء إطار iframe بحالات التحميل ومعالجة الأخطاء:

```javascript
// عرض رسالة التحميل
ctx.message.loading('جارٍ تحميل المحتوى الخارجي...');

try {
  // إنشاء إطار iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // إضافة مستمع حدث التحميل
  iframe.addEventListener('load', () => {
    ctx.message.success('تم تحميل المحتوى بنجاح');
  });

  // إضافة مستمع حدث الخطأ
  iframe.addEventListener('error', () => {
    ctx.message.error('فشل تحميل المحتوى');
  });

  // إدراج إطار iframe في الحاوية
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('حدث خطأ أثناء إنشاء إطار iframe: ' + error.message);
}
```

### اعتبارات الأمان

عند استخدام إطارات iframe، ضع في اعتبارك أفضل ممارسات الأمان التالية:

1.  **استخدام HTTPS**: قم دائمًا بتحميل محتوى إطار iframe عبر HTTPS كلما أمكن.
2.  **تقييد أذونات Sandbox**: قم بتمكين أذونات sandbox الضرورية فقط.
3.  **سياسة أمان المحتوى (CSP)**: قم بتهيئة رؤوس CSP المناسبة.
4.  **سياسة نفس المصدر**: انتبه لقيود عبر المصادر.
5.  **مصادر موثوقة**: قم بتحميل المحتوى من النطاقات الموثوقة فقط.