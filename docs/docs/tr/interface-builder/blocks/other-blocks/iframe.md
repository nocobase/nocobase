---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Iframe Bloğu

## Giriş

Iframe bloğu, harici web sayfalarını veya içeriği mevcut sayfaya yerleştirmenize olanak tanır. Kullanıcılar, bir URL yapılandırarak veya doğrudan HTML kodu ekleyerek harici uygulamaları sayfaya kolayca entegre edebilirler. Bir HTML sayfası kullanırken, içeriği belirli görüntüleme ihtiyaçlarınıza göre esnek bir şekilde özelleştirebilirsiniz. Bu yöntem, özelleştirilmiş görüntülemeler gerektiren senaryolar için özellikle uygundur; harici kaynakları yönlendirme yapmadan yükleyerek kullanıcı deneyimini ve sayfa etkileşimini artırır.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## Şablon Sözdizimi

HTML modunda, blok içeriği **[Liquid şablon motoru](https://shopify.github.io/liquid/basics/introduction/)** sözdizimini kullanmayı destekler.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## Değişken Desteği

### HTML Değişken Desteği

- Değişken seçiciyi kullanarak mevcut blok bağlamından değişkenleri seçmeyi destekler.
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- Kod aracılığıyla uygulamaya değişken enjekte etmeyi ve bunları kullanmayı destekler.

Kod aracılığıyla uygulamaya özel değişkenler de enjekte edebilir ve bunları HTML'de kullanabilirsiniz. Örneğin, Vue 3 ve Element Plus kullanarak dinamik bir takvim uygulaması oluşturabilirsiniz:

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

Örnek: Tarihleri işlemek için dayjs kullanan, React ve Ant Design (antd) ile oluşturulmuş basit bir takvim bileşeni.

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

### URL Değişken Desteği

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

Değişkenler hakkında daha fazla bilgi için, [Değişkenler](/interface-builder/variables) bölümüne bakınız.