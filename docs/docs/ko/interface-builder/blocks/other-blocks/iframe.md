---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Iframe 블록

## 소개

Iframe 블록은 외부 웹 페이지나 콘텐츠를 현재 페이지에 삽입할 수 있도록 합니다. 사용자는 URL을 설정하거나 HTML 코드를 직접 삽입하여 외부 애플리케이션을 페이지에 쉽게 통합할 수 있습니다. HTML 페이지를 사용할 경우, 사용자는 콘텐츠를 유연하게 맞춤 설정하여 특정 표시 요구 사항을 충족할 수 있습니다. 이 방법은 맞춤형 표시가 필요한 시나리오에 특히 적합하며, 페이지 전환 없이 외부 리소스를 로드하여 사용자 경험과 페이지의 상호작용 효과를 향상시킵니다.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## 템플릿 문법

HTML 모드에서는 블록 콘텐츠에서 **[Liquid 템플릿 엔진](https://shopify.github.io/liquid/basics/introduction/)** 문법을 사용할 수 있습니다.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## 변수 지원

### HTML 변수 지원

- 변수 선택기에서 현재 블록 컨텍스트의 변수를 선택할 수 있습니다.
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- 코드를 작성하여 애플리케이션에 변수를 주입하고 사용할 수 있습니다.

또한 코드를 통해 사용자 정의 변수를 애플리케이션에 주입하고 HTML에서 사용할 수 있습니다. 예를 들어, Vue 3와 Element Plus를 사용하여 동적 캘린더 애플리케이션을 만드는 방법은 다음과 같습니다:

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

예시: React와 Ant Design (antd)으로 만든 간단한 캘린더 컴포넌트로, 날짜 처리를 위해 dayjs를 함께 사용합니다.

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

### URL 변수 지원

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

변수에 대한 자세한 내용은 [변수](/interface-builder/variables)를 참조하십시오.