---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::



pkg: "@nocobase/plugin-block-iframe"
---

# Iframe ब्लॉक

## परिचय

Iframe ब्लॉक आपको बाहरी वेब पेजों या सामग्री को वर्तमान पेज में एम्बेड करने की सुविधा देता है। आप URL कॉन्फ़िगर करके या सीधे HTML कोड डालकर बाहरी एप्लिकेशन को पेज में आसानी से एकीकृत कर सकते हैं। HTML का उपयोग करते समय, आप विशिष्ट प्रदर्शन आवश्यकताओं को पूरा करने के लिए सामग्री को लचीले ढंग से अनुकूलित कर सकते हैं, जो इसे अनुकूलित परिदृश्यों के लिए आदर्श बनाता है। यह तरीका बिना रीडायरेक्शन के बाहरी संसाधनों को लोड करने में सक्षम बनाता है, जिससे उपयोगकर्ता अनुभव और पेज की इंटरैक्टिविटी बढ़ती है।

## इंस्टॉलेशन

यह एक बिल्ट-इन प्लगइन है, इसे इंस्टॉल करने की आवश्यकता नहीं है।

## ब्लॉक जोड़ना

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

बाहरी एप्लिकेशन को सीधे एम्बेड करने के लिए URL या HTML कॉन्फ़िगर करें।

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## टेम्पलेट इंजन

### स्ट्रिंग टेम्पलेट

यह डिफ़ॉल्ट टेम्पलेट इंजन है।

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

अधिक जानकारी के लिए, Handlebars टेम्पलेट दस्तावेज़ देखें।

## वैरिएबल पास करना

### HTML में वैरिएबल पार्सिंग के लिए समर्थन

#### वर्तमान ब्लॉक संदर्भ में वैरिएबल सेलेक्टर से वैरिएबल चुनने के लिए समर्थन

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### कोड के माध्यम से एप्लिकेशन में वैरिएबल इंजेक्ट करना और उनका उपयोग करना

आप कोड के माध्यम से एप्लिकेशन में कस्टम वैरिएबल भी इंजेक्ट कर सकते हैं और उन्हें HTML में उपयोग कर सकते हैं। उदाहरण के लिए, Vue 3 और Element Plus का उपयोग करके एक डायनामिक कैलेंडर एप्लिकेशन बनाना:

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

उदाहरण: React और Ant Design (antd) का उपयोग करके बनाया गया एक सरल कैलेंडर कंपोनेंट, जिसमें तारीखों को संभालने के लिए dayjs का उपयोग किया गया है

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

### URL वैरिएबल को सपोर्ट करता है

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

वैरिएबल के बारे में अधिक जानकारी के लिए, वैरिएबल दस्तावेज़ देखें।

## JS ब्लॉक के साथ Iframe बनाना (NocoBase 2.0)

NocoBase 2.0 में, आप अधिक नियंत्रण के साथ डायनामिक रूप से iframe बनाने के लिए JS ब्लॉक का उपयोग कर सकते हैं। यह तरीका iframe के व्यवहार और स्टाइल को अनुकूलित करने के लिए बेहतर लचीलापन प्रदान करता है।

### मूल उदाहरण

एक JS ब्लॉक बनाएँ और iframe बनाने के लिए निम्नलिखित कोड का उपयोग करें:

```javascript
// वर्तमान ब्लॉक कंटेनर को भरने वाला एक iframe बनाएँ
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// मौजूदा बच्चों को बदलें, ताकि iframe एकमात्र सामग्री हो
ctx.element.replaceChildren(iframe);
```

### मुख्य बिंदु

- **ctx.element**: वर्तमान JS ब्लॉक कंटेनर का DOM एलिमेंट
- **sandbox विशेषता**: iframe सामग्री के लिए सुरक्षा प्रतिबंधों को नियंत्रित करता है
  - ``allow-scripts``: iframe को स्क्रिप्ट निष्पादित करने की अनुमति देता है
  - ``allow-same-origin``: iframe को अपने स्वयं के मूल तक पहुँचने की अनुमति देता है
- **replaceChildren()**: कंटेनर के सभी बच्चों को iframe से बदल देता है

### लोडिंग स्थिति के साथ उन्नत उदाहरण

आप लोडिंग स्थिति और त्रुटि हैंडलिंग के साथ iframe निर्माण को बढ़ा सकते हैं:

```javascript
// लोडिंग संदेश दिखाएँ
ctx.message.loading('बाहरी सामग्री लोड हो रही है...');

try {
  // iframe बनाएँ
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // लोड इवेंट लिसनर जोड़ें
  iframe.addEventListener('load', () => {
    ctx.message.success('सामग्री सफलतापूर्वक लोड हो गई');
  });

  // त्रुटि इवेंट लिसनर जोड़ें
  iframe.addEventListener('error', () => {
    ctx.message.error('सामग्री लोड करने में विफल रहा');
  });

  // iframe को कंटेनर में डालें
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('iframe बनाने में त्रुटि: ' + error.message);
}
```

### सुरक्षा संबंधी विचार

iframe का उपयोग करते समय, निम्नलिखित सुरक्षा सर्वोत्तम प्रथाओं पर विचार करें:

1. **HTTPS का उपयोग करें**: जब भी संभव हो, हमेशा HTTPS पर iframe सामग्री लोड करें
2. **सैंडबॉक्स अनुमतियों को प्रतिबंधित करें**: केवल आवश्यक सैंडबॉक्स अनुमतियों को सक्षम करें
3. **सामग्री सुरक्षा नीति**: उचित CSP हेडर कॉन्फ़िगर करें
4. **समान-मूल नीति**: क्रॉस-ओरिजिन प्रतिबंधों से अवगत रहें
5. **विश्वसनीय स्रोत**: केवल विश्वसनीय डोमेन से सामग्री लोड करें