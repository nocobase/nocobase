:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/render).
:::

# ctx.render()

Render các phần tử React, chuỗi HTML hoặc các nút DOM vào một container chỉ định. Nếu không truyền `container`, mặc định sẽ render vào `ctx.element` và tự động kế thừa các context của ứng dụng như ConfigProvider, theme, v.v.

## Các trường hợp sử dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Render nội dung tùy chỉnh của khối (biểu đồ, danh sách, thẻ, v.v.) |
| **JSField / JSItem / JSColumn** | Render hiển thị tùy chỉnh cho các trường có thể chỉnh sửa hoặc các cột trong bảng |
| **Khối chi tiết** | Tùy chỉnh hình thức hiển thị của các trường trong trang chi tiết |

> Lưu ý: `ctx.render()` cần một container để render. Nếu không truyền `container` và `ctx.element` không tồn tại (ví dụ: trong các kịch bản thuần logic không có UI), một lỗi sẽ được ném ra.

## Định nghĩa kiểu dữ liệu

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Tham số | Kiểu dữ liệu | Mô tả |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Nội dung cần render |
| `container` | `Element` \| `DocumentFragment` (Tùy chọn) | Container mục tiêu để render, mặc định là `ctx.element` |

**Giá trị trả về**:

- Khi render **phần tử React**: Trả về `ReactDOMClient.Root`, thuận tiện cho việc gọi `root.render()` để cập nhật sau này.
- Khi render **chuỗi HTML** hoặc **nút DOM**: Trả về `null`.

## Mô tả kiểu vnode

| Kiểu dữ liệu | Hành vi |
|------|------|
| `React.ReactElement` (JSX) | Được render bằng `createRoot` của React, cung cấp đầy đủ khả năng của React và tự động kế thừa context của ứng dụng. |
| `string` | Thiết lập `innerHTML` của container sau khi được làm sạch bằng DOMPurify; mọi React root hiện có sẽ bị gỡ bỏ (unmount) trước. |
| `Node` (Element, Text, v.v.) | Xóa sạch container sau đó dùng `appendChild` để thêm vào; mọi React root hiện có sẽ bị gỡ bỏ trước. |
| `DocumentFragment` | Thêm các nút con của fragment vào container; mọi React root hiện có sẽ bị gỡ bỏ trước. |

## Ví dụ

### Render phần tử React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Tiêu đề')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Đã click'))}>
      {ctx.t('Nút')}
    </Button>
  </Card>
);
```

### Render chuỗi HTML

```ts
ctx.render('<h1>Hello World</h1>');

// Kết hợp với ctx.t để đa ngôn ngữ hóa
ctx.render('<div style="padding:16px">' + ctx.t('Nội dung') + '</div>');

// Render có điều kiện
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Render nút DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Render một container trống trước, sau đó giao cho thư viện bên thứ ba (như ECharts) để khởi tạo
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Chỉ định container tùy chỉnh

```ts
// Render vào một phần tử DOM cụ thể
const customEl = document.getElementById('my-container');
ctx.render(<div>Nội dung</div>, customEl);
```

### Các lần gọi tiếp theo sẽ thay thế nội dung

```ts
// Lần gọi thứ hai sẽ thay thế nội dung hiện có trong container
ctx.render(<div>Lần thứ nhất</div>);
ctx.render(<div>Lần thứ hai</div>);  // Chỉ hiển thị "Lần thứ hai"
```

## Lưu ý

- **Nhiều lần gọi sẽ thay thế nội dung**: Mỗi lần gọi `ctx.render()` sẽ thay thế nội dung hiện có trong container chứ không phải thêm nối tiếp.
- **An toàn chuỗi HTML**: Chuỗi HTML truyền vào sẽ được làm sạch qua DOMPurify để giảm thiểu rủi ro XSS, nhưng vẫn khuyến nghị tránh việc nối chuỗi từ dữ liệu đầu vào không đáng tin cậy của người dùng.
- **Không thao tác trực tiếp trên ctx.element**: `ctx.element.innerHTML` đã bị loại bỏ (deprecated), nên sử dụng thống nhất `ctx.render()`.
- **Truyền container khi không có mặc định**: Trong các kịch bản mà `ctx.element` là `undefined` (ví dụ: bên trong các module được tải qua `ctx.importAsync`), cần phải truyền `container` một cách tường minh.

## Liên quan

- [ctx.element](./element.md) - Container render mặc định, được sử dụng khi không truyền container cho `ctx.render()`.
- [ctx.libs](./libs.md) - Các thư viện tích hợp sẵn như React, Ant Design, được sử dụng để render JSX.
- [ctx.importAsync()](./import-async.md) - Sử dụng kết hợp với `ctx.render()` sau khi tải các thư viện React/component bên ngoài theo nhu cầu.