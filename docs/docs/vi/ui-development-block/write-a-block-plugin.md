:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Viết plugin khối đầu tiên của bạn

Trước khi bắt đầu, bạn nên đọc bài viết "[Viết plugin đầu tiên của bạn](../plugin-development/write-your-first-plugin.md)" để hiểu cách tạo nhanh một plugin cơ bản. Tiếp theo, chúng ta sẽ mở rộng plugin đó bằng cách thêm một tính năng khối (Block) đơn giản.

## Bước 1: Tạo tệp mô hình khối

Tạo một tệp mới trong thư mục plugin: `client/models/SimpleBlockModel.tsx`

## Bước 2: Viết nội dung mô hình

Trong tệp, định nghĩa và triển khai một mô hình khối cơ bản, bao gồm cả logic hiển thị của nó:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Bước 3: Đăng ký mô hình khối

Xuất mô hình vừa tạo trong tệp `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Bước 4: Kích hoạt và trải nghiệm khối

Sau khi kích hoạt plugin, bạn sẽ thấy tùy chọn khối **Hello block** mới trong menu thả xuống "Thêm khối".

Minh họa hiệu ứng:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Bước 5: Thêm khả năng cấu hình cho khối

Tiếp theo, chúng ta sẽ thêm chức năng có thể cấu hình cho khối thông qua **Flow**, cho phép người dùng chỉnh sửa nội dung khối trên giao diện.

Tiếp tục chỉnh sửa tệp `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Minh họa hiệu ứng:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Tóm tắt

Bài viết này đã giới thiệu cách tạo một plugin khối đơn giản, bao gồm:

- Cách định nghĩa và triển khai một mô hình khối
- Cách đăng ký một mô hình khối
- Cách thêm chức năng cấu hình thông qua Flow

Tham khảo mã nguồn đầy đủ: [Ví dụ về Simple Block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)