---
title: "Phát triển Component"
description: "Phát triển component phía client của NocoBase: dùng React/Antd để phát triển component trang Plugin, quản lý trạng thái observable, lấy năng lực context NocoBase qua useFlowContext()."
keywords: "Component,Phát triển component,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Phát triển Component

Trong NocoBase, component trang được route mount chính là Component React thông thường. Bạn có thể viết trực tiếp bằng React + [Antd](https://5x.ant.design/), không khác gì phát triển frontend thông thường.

NocoBase cung cấp thêm:

- **`observable` + `observer`** — Cách quản lý trạng thái được khuyến nghị, phù hợp với hệ sinh thái NocoBase hơn `useState`
- **`useFlowContext()`** — Lấy các năng lực context của NocoBase (gửi request, i18n, điều hướng route, v.v.)

## Cách viết cơ bản

Một component trang đơn giản nhất:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Sau khi viết xong, đăng ký bằng `this.router.add()` trong `load()` của Plugin, xem chi tiết tại [Router](../router).

## Quản lý trạng thái: observable

NocoBase khuyến nghị dùng `observable` + `observer` để quản lý trạng thái component, thay vì `useState` của React. Lợi ích của nó là:

- Sửa trực tiếp thuộc tính của object là kích hoạt cập nhật, không cần `setState`
- Tự động thu thập phụ thuộc, component chỉ render lại khi thuộc tính được dùng đến thay đổi
- Nhất quán với cơ chế phản ứng của tầng dưới NocoBase (FlowModel, FlowContext, v.v.)

Cách dùng cơ bản: dùng `observable.deep()` để tạo đối tượng phản ứng, dùng `observer()` để bọc component. `observable` và `observer` đều import từ `@nocobase/flow-engine`:

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Tạo một đối tượng trạng thái phản ứng
const state = observable.deep({
  text: '',
});

// Bọc component bằng observer, tự động cập nhật khi trạng thái thay đổi
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Nhập gì đó..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Bạn đã nhập: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Xem trước hiệu ứng:

```tsx file="./_demos/observable-basic.tsx" preview
```

Cách dùng đầy đủ hơn xem tại [Cơ chế phản ứng Observable](../../../flow-engine/observable).

## Sử dụng useFlowContext

`useFlowContext()` là lối vào kết nối với năng lực của NocoBase. Import từ `@nocobase/flow-engine`, trả về một đối tượng `ctx`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — gửi request
  // ctx.t — i18n
  // ctx.router — điều hướng route
  // ctx.logger — log
  // ...
}
```

Dưới đây là ví dụ về các năng lực phổ biến.

### Gửi request

Gọi API backend thông qua `ctx.api.request()`, cách dùng giống với [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### I18n

Lấy văn bản dịch thông qua `ctx.t()`:

```tsx
const label = ctx.t('Hello');
// Chỉ định namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Điều hướng route

Điều hướng trang thông qua `ctx.router.navigate()`:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Lấy tham số route hiện tại:

```tsx
// Ví dụ route được định nghĩa là /users/:id
const { id } = ctx.route.params; // Lấy tham số động
```

Lấy tên route hiện tại:

```tsx
const { name } = ctx.route; // Lấy tên route
```

<!-- ### Thông báo, dialog, notification

NocoBase đóng gói các component phản hồi của Antd thông qua ctx, có thể gọi trực tiếp trong code logic:

```tsx
// Thông báo (nhẹ, tự biến mất)
ctx.message.success('Lưu thành công');

// Dialog xác nhận (chặn, đợi thao tác của người dùng)
const confirmed = await ctx.modal.confirm({
  title: 'Xác nhận xóa?',
  content: 'Sau khi xóa không thể khôi phục',
});

// Notification (hiện ở bên phải, phù hợp với gợi ý dài hơn)
ctx.notification.open({
  message: 'Import xong',
  description: 'Đã import 42 bản ghi',
});
```

### Log

Xuất log có cấu trúc thông qua `ctx.logger`:

```tsx
ctx.logger.info('Trang đã tải xong', { page: 'UserList' });
ctx.logger.error('Tải dữ liệu thất bại', { error });
``` -->

Cấp độ log và cách dùng nâng cao xem tại [Context → Năng lực phổ biến](../ctx/common-capabilities).

## Ví dụ đầy đủ

Kết hợp observable, useFlowContext và Antd, một component trang lấy dữ liệu từ backend và hiển thị:

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// Quản lý trạng thái trang bằng observable
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Tải danh sách bài viết thất bại', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // Làm mới danh sách
}

export default PostListPage;
```

## Tiếp theo

- Năng lực đầy đủ mà `useFlowContext` cung cấp — xem [Context](../ctx/index.md)
- Tùy chỉnh kiểu component và theme — xem [Styles & Themes](./styles-themes)
- Nếu component của bạn cần xuất hiện trong menu "Thêm Block / Field / Action" của NocoBase, hỗ trợ cấu hình trực quan, cần dùng FlowModel để bọc — xem [FlowEngine](../flow-engine/index.md)
- Không chắc dùng Component hay FlowModel? — xem [Component vs FlowModel](../component-vs-flow-model)

## Liên kết liên quan

- [Router](../router) — Đăng ký route trang, mount component vào URL
- [Context](../ctx/index.md) — Giới thiệu năng lực đầy đủ của useFlowContext
- [Styles & Themes](./styles-themes) — createStyles, theme token, v.v.
- [FlowEngine](../flow-engine/index.md) — Khi cần cấu hình trực quan thì dùng FlowModel
- [Cơ chế phản ứng Observable](../../../flow-engine/observable) — Quản lý trạng thái phản ứng của FlowEngine
- [Context → Năng lực phổ biến](../ctx/common-capabilities) — Các năng lực tích hợp như ctx.api, ctx.t
- [Component vs FlowModel](../component-vs-flow-model) — Chọn component hay FlowModel
