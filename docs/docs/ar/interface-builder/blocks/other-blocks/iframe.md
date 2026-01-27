---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# كتلة Iframe

## مقدمة

تتيح لك كتلة Iframe تضمين صفحات ويب أو محتوى خارجي في الصفحة الحالية. يمكن للمستخدمين دمج التطبيقات الخارجية بسهولة في الصفحة عن طريق إعداد عنوان URL أو إدراج كود HTML مباشرةً. عند استخدام صفحة HTML، يمكن للمستخدمين تخصيص المحتوى بمرونة لتلبية احتياجات العرض المحددة. هذه الطريقة مناسبة بشكل خاص للسيناريوهات التي تتطلب عروضًا مخصصة، حيث يمكنها تحميل الموارد الخارجية دون الحاجة لإعادة التوجيه، مما يعزز تجربة المستخدم وتفاعلية الصفحة.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## صيغة القالب

في وضع HTML، يدعم محتوى الكتلة استخدام صيغة **[محرك قوالب Liquid](https://shopify.github.io/liquid/basics/introduction/)**.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## دعم المتغيرات

### دعم المتغيرات في HTML

- يدعم اختيار المتغيرات من سياق الكتلة الحالي باستخدام محدد المتغيرات.
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- يدعم حقن المتغيرات واستخدامها في التطبيق عبر الكود.

يمكنك أيضًا حقن متغيرات مخصصة في التطبيق عبر الكود واستخدامها في HTML. على سبيل المثال، لإنشاء تطبيق تقويم ديناميكي باستخدام Vue 3 و Element Plus:

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

مثال: مكون تقويم بسيط تم إنشاؤه باستخدام React و Ant Design (antd)، مع استخدام dayjs لمعالجة التواريخ.

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

### دعم المتغيرات في عنوان URL

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

لمزيد من المعلومات حول المتغيرات، راجع [المتغيرات](/interface-builder/variables).