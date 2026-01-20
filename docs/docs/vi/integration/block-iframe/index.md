---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Khối Iframe

## Giới thiệu

Khối Iframe cho phép nhúng các trang web hoặc nội dung bên ngoài vào trang hiện tại. Người dùng có thể dễ dàng tích hợp các ứng dụng bên ngoài vào trang bằng cách cấu hình URL hoặc chèn trực tiếp mã HTML. Khi sử dụng trang HTML, người dùng có thể linh hoạt tùy chỉnh nội dung để đáp ứng các nhu cầu hiển thị cụ thể, làm cho phương pháp này lý tưởng cho các kịch bản cần tùy chỉnh. Cách tiếp cận này giúp tải tài nguyên bên ngoài mà không cần chuyển hướng, từ đó nâng cao trải nghiệm người dùng và hiệu quả tương tác của trang.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt.

## Thêm Khối

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Cấu hình URL hoặc HTML để nhúng trực tiếp ứng dụng bên ngoài.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Công cụ tạo mẫu

### Mẫu chuỗi

Đây là công cụ tạo mẫu mặc định.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Để biết thêm thông tin, vui lòng tham khảo tài liệu về công cụ tạo mẫu Handlebars.

## Truyền biến

### HTML hỗ trợ phân tích biến

#### Hỗ trợ chọn biến từ bộ chọn biến trong ngữ cảnh của khối hiện tại

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Hỗ trợ đưa biến vào ứng dụng và sử dụng chúng thông qua mã

Bạn cũng có thể đưa các biến tùy chỉnh vào ứng dụng thông qua mã và sử dụng chúng trong HTML. Ví dụ, tạo một ứng dụng lịch động sử dụng Vue 3 và Element Plus:

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

Ví dụ: Một thành phần lịch đơn giản được tạo bằng React và Ant Design (antd), kết hợp dayjs để xử lý ngày tháng

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

### URL hỗ trợ biến

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Để biết thêm thông tin về biến, vui lòng tham khảo tài liệu về biến.

## Tạo Iframe bằng Khối JS (NocoBase 2.0)

Trong NocoBase 2.0, bạn có thể sử dụng các khối JS để tạo iframe động với nhiều quyền kiểm soát hơn. Cách tiếp cận này mang lại sự linh hoạt tốt hơn để tùy chỉnh hành vi và kiểu dáng của iframe.

### Ví dụ cơ bản

Tạo một khối JS và sử dụng mã sau để tạo iframe:

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

### Các điểm chính

- `ctx.element`: Phần tử DOM của vùng chứa khối JS hiện tại
- Thuộc tính `sandbox`: Kiểm soát các hạn chế bảo mật cho nội dung iframe
  - `allow-scripts`: Cho phép iframe thực thi script
  - `allow-same-origin`: Cho phép iframe truy cập nguồn gốc của chính nó
- `replaceChildren()`: Thay thế tất cả các phần tử con của vùng chứa bằng iframe

### Ví dụ nâng cao với trạng thái tải

Bạn có thể nâng cao việc tạo iframe với trạng thái tải và xử lý lỗi:

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

### Các cân nhắc về bảo mật

Khi sử dụng iframe, hãy xem xét các thực tiễn tốt nhất về bảo mật sau:

1. **Sử dụng HTTPS**: Luôn tải nội dung iframe qua HTTPS bất cứ khi nào có thể
2. **Hạn chế quyền Sandbox**: Chỉ bật các quyền sandbox cần thiết
3. **Chính sách bảo mật nội dung**: Cấu hình các tiêu đề CSP phù hợp
4. **Chính sách cùng nguồn gốc**: Lưu ý các hạn chế về cross-origin (nguồn gốc chéo)
5. **Nguồn đáng tin cậy**: Chỉ tải nội dung từ các miền đáng tin cậy