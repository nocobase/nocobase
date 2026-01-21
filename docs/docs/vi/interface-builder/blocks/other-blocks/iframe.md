---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Khối Iframe

## Giới thiệu

Khối Iframe cho phép bạn nhúng các trang web hoặc nội dung bên ngoài vào trang hiện tại. Người dùng có thể dễ dàng tích hợp các ứng dụng bên ngoài vào trang bằng cách cấu hình URL hoặc chèn trực tiếp mã HTML. Khi sử dụng trang HTML, người dùng có thể linh hoạt tùy chỉnh nội dung để đáp ứng các nhu cầu hiển thị cụ thể. Phương pháp này đặc biệt phù hợp cho các tình huống cần hiển thị tùy chỉnh, vì nó có thể tải tài nguyên bên ngoài mà không cần chuyển hướng, giúp nâng cao trải nghiệm người dùng và tính tương tác của trang.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## Cú pháp Mẫu

Ở chế độ HTML, nội dung khối hỗ trợ sử dụng cú pháp của **[công cụ mẫu Liquid](https://shopify.github.io/liquid/basics/introduction/)**.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## Hỗ trợ Biến

### Hỗ trợ Biến trong HTML

- Hỗ trợ chọn biến từ ngữ cảnh của khối hiện tại bằng cách sử dụng bộ chọn biến.
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- Hỗ trợ chèn và sử dụng biến vào ứng dụng thông qua mã.

Bạn cũng có thể chèn các biến tùy chỉnh vào ứng dụng thông qua mã và sử dụng chúng trong HTML. Ví dụ, tạo một ứng dụng lịch động bằng Vue 3 và Element Plus:

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

Ví dụ: Một thành phần lịch đơn giản được tạo bằng React và Ant Design (antd), sử dụng dayjs để xử lý ngày tháng.

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

### Hỗ trợ Biến trong URL

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

Để biết thêm thông tin về biến, hãy tham khảo [Biến](/interface-builder/variables)