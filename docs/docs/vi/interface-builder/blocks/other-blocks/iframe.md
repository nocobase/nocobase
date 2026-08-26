---
pkg: "@nocobase/plugin-block-iframe"
title: "Block Iframe"
description: "Block Iframe: nhúng trang web hoặc ứng dụng bên ngoài, tải nội dung bên thứ ba qua URL, hỗ trợ hiển thị cross-domain."
keywords: "Block Iframe,Iframe,nhúng trang web,liên kết bên ngoài,Interface Builder,NocoBase"
---
# Block Iframe

## Giới thiệu

Block IFrame cho phép nhúng trang web hoặc nội dung bên ngoài vào Trang hiện tại. Bạn có thể dễ dàng tích hợp ứng dụng bên ngoài vào Trang bằng cách cấu hình URL hoặc chèn trực tiếp mã HTML. Khi sử dụng Trang HTML, bạn có thể tùy chỉnh nội dung linh hoạt, đáp ứng nhu cầu hiển thị cụ thể, cách này đặc biệt phù hợp với các trường hợp cần hiển thị tùy chỉnh, không cần chuyển hướng có thể tải tài nguyên bên ngoài, nâng cao trải nghiệm người dùng và hiệu ứng tương tác Trang.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## Cú pháp mẫu

Ở chế độ HTML, nội dung Block hỗ trợ sử dụng cú pháp **[Liquid template engine](https://shopify.github.io/liquid/basics/introduction/)**.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## Hỗ trợ biến

### html hỗ trợ phân tích biến

- Hỗ trợ chọn biến của ngữ cảnh Block hiện tại từ trình chọn biến
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- Hỗ trợ inject biến vào ứng dụng và sử dụng thông qua viết mã

Còn có thể inject biến tùy chỉnh vào ứng dụng thông qua mã, và sử dụng chúng trong HTML. Ví dụ, sử dụng Vue 3 và Element Plus để tạo một ứng dụng lịch động:

```html
<!doctype html>
<html lang="vi">
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

Ví dụ: component lịch đơn giản được tạo bằng React và Ant Design (antd), kết hợp với dayjs để xử lý ngày tháng

```html
<!doctype html>
<html lang="vi">
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

### url hỗ trợ biến

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

Xem thêm về biến tại [Biến](/interface-builder/variables)
