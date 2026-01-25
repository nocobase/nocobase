---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# आईफ्रेम ब्लॉक

## परिचय

आईफ्रेम ब्लॉक आपको बाहरी वेबपेजों या सामग्री को वर्तमान पेज में एम्बेड करने की सुविधा देता है। आप URL कॉन्फ़िगर करके या सीधे HTML कोड डालकर बाहरी एप्लिकेशन को पेज में आसानी से इंटीग्रेट कर सकते हैं। HTML पेज का उपयोग करते समय, आप अपनी विशिष्ट प्रदर्शन आवश्यकताओं को पूरा करने के लिए सामग्री को लचीले ढंग से अनुकूलित कर सकते हैं। यह तरीका उन परिदृश्यों के लिए विशेष रूप से उपयुक्त है जहाँ अनुकूलित प्रदर्शन की आवश्यकता होती है, क्योंकि यह बिना रीडायरेक्शन के बाहरी संसाधनों को लोड कर सकता है, जिससे उपयोगकर्ता अनुभव और पेज की इंटरैक्टिविटी बढ़ती है।

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## टेम्पलेट सिंटैक्स

HTML मोड में, ब्लॉक सामग्री **[लिक्विड टेम्पलेट इंजन](https://shopify.github.io/liquid/basics/introduction/)** सिंटैक्स का उपयोग करने का समर्थन करती है।

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## वेरिएबल सपोर्ट

### HTML वेरिएबल सपोर्ट

- वेरिएबल सेलेक्टर का उपयोग करके वर्तमान ब्लॉक संदर्भ से वेरिएबल चुनने का समर्थन करता है।
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- कोड के माध्यम से एप्लिकेशन में वेरिएबल इंजेक्ट करने और उनका उपयोग करने का समर्थन करता है।

आप कोड के माध्यम से एप्लिकेशन में कस्टम वेरिएबल भी इंजेक्ट कर सकते हैं और उन्हें HTML में उपयोग कर सकते हैं। उदाहरण के लिए, Vue 3 और Element Plus का उपयोग करके एक डायनामिक कैलेंडर एप्लिकेशन बनाना:

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

उदाहरण: React और Ant Design (antd) का उपयोग करके बनाया गया एक सरल कैलेंडर कंपोनेंट, जिसमें तारीखों को संभालने के लिए dayjs का उपयोग किया गया है।

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

### URL वेरिएबल सपोर्ट

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

वेरिएबल के बारे में अधिक जानकारी के लिए, [वेरिएबल](/interface-builder/variables) देखें।