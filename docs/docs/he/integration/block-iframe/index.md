---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



# בלוק Iframe

## מבוא

בלוק ה-Iframe מאפשר לכם להטמיע דפי אינטרנט או תוכן חיצוני בעמוד הנוכחי. תוכלו לשלב יישומים חיצוניים בקלות על ידי הגדרת כתובת URL או הוספה ישירה של קוד HTML. כאשר אתם משתמשים בקוד HTML, אתם יכולים להתאים אישית את התוכן בצורה גמישה כדי לעמוד בדרישות תצוגה ספציפיות, מה שהופך אותו לאידיאלי לתרחישים מותאמים אישית. גישה זו מאפשרת טעינת משאבים חיצוניים ללא צורך בניווט, ובכך משפרת את חווית המשתמש ואת האינטראקטיביות של העמוד.

## התקנה

זהו תוסף (Plugin) מובנה, אין צורך בהתקנה.

## הוספת בלוקים

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

הגדירו את כתובת ה-URL או קוד ה-HTML כדי להטמיע ישירות את היישום החיצוני.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## מנוע תבניות

### תבנית מחרוזת

מנוע התבניות המוגדר כברירת מחדל.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

למידע נוסף, עיינו בתיעוד של מנוע התבניות Handlebars.

## העברת משתנים

### תמיכת HTML בניתוח משתנים

#### תמיכה בבחירת משתנים מבורר המשתנים בהקשר של הבלוק הנוכחי

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### תמיכה בהזרקת משתנים ליישום ושימוש בהם באמצעות קוד

אתם יכולים גם להזריק משתנים מותאמים אישית ליישום באמצעות קוד ולהשתמש בהם ב-HTML. לדוגמה, יצירת יישום לוח שנה דינמי באמצעות Vue 3 ו-Element Plus:

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

דוגמה: רכיב לוח שנה פשוט שנוצר באמצעות React ו-Ant Design (antd), המשלב את dayjs לטיפול בתאריכים

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

### כתובת URL תומכת במשתנים

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

למידע נוסף על משתנים, עיינו בתיעוד המשתנים.

## יצירת Iframes באמצעות בלוקי JS (NocoBase 2.0)

ב-NocoBase 2.0, אתם יכולים להשתמש בבלוקי JS כדי ליצור iframes באופן דינמי ולקבל שליטה רבה יותר. גישה זו מספקת גמישות טובה יותר להתאמה אישית של התנהגות ועיצוב ה-iframe.

### דוגמה בסיסית

צרו בלוק JS והשתמשו בקוד הבא כדי ליצור iframe:

```javascript
// 创建一个填充当前区块容器的 iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// 替换现有子元素,使 iframe 成为唯一内容
ctx.element.replaceChildren(iframe);
```

### נקודות מפתח

-   **ctx.element**: אלמנט ה-DOM של מיכל בלוק ה-JS הנוכחי
-   **תכונת `sandbox`**: שולטת בהגבלות האבטחה עבור תוכן ה-iframe
    -   `allow-scripts`: מאפשר ל-iframe להריץ סקריפטים
    -   `allow-same-origin`: מאפשר ל-iframe לגשת למקור שלו
-   **`replaceChildren()`**: מחליף את כל האלמנטים הצאצאים של המיכל ב-iframe

### דוגמה מתקדמת עם מצב טעינה

אתם יכולים לשפר את יצירת ה-iframe באמצעות מצבי טעינה וטיפול בשגיאות:

```javascript
// 显示加载提示
ctx.message.loading('正在加载外部内容...');

try {
  // 创建 iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // 添加加载事件监听器
  iframe.addEventListener('load', () => {
    ctx.message.success('内容加载成功');
  });

  // 添加错误事件监听器
  iframe.addEventListener('error', () => {
    ctx.message.error('加载内容失败');
  });

  // 将 iframe 插入容器
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('创建 iframe 出错: ' + error.message);
}
```

### שיקולי אבטחה

בעת שימוש ב-iframes, קחו בחשבון את שיטות העבודה המומלצות הבאות לאבטחה:

1.  **השתמשו ב-HTTPS**: טענו תמיד תוכן iframe באמצעות HTTPS במידת האפשר
2.  **הגבילו הרשאות Sandbox**: הפעילו רק את הרשאות ה-sandbox הנחוצות
3.  **מדיניות אבטחת תוכן (CSP)**: הגדירו כותרות CSP מתאימות
4.  **מדיניות אותו מקור (Same-Origin Policy)**: שימו לב להגבלות חוצות-מקורות
5.  **מקורות מהימנים**: טענו תוכן רק מדומיינים מהימנים