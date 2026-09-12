---
title: "Viết plugin Block đầu tiên"
description: "Phát triển mở rộng Block NocoBase: viết plugin Block đầu tiên"
keywords: "write,a,block,plugin,NocoBase"
---

# Viết plugin Block đầu tiên

Trước khi bắt đầu, bạn nên đọc trước "[Viết plugin đầu tiên](../plugin-development/write-your-first-plugin.md)" để hiểu cách tạo plugin cơ bản nhanh chóng. Tiếp theo, chúng ta sẽ mở rộng dựa trên đó để xây dựng tính năng Block đơn giản.

## Bước 1: Tạo file Block Model

Tạo file trong thư mục plugin: `client/models/SimpleBlockModel.tsx`

## Bước 2: Viết nội dung model

Định nghĩa và hiện thực một Block Model cơ bản trong file, bao gồm logic render:

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

## Bước 3: Đăng ký Block Model

Export model mới tạo trong file `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Bước 4: Kích hoạt và trải nghiệm Block

Sau khi bật plugin, trong dropdown menu "Add block", bạn sẽ thấy tùy chọn block **Hello block** mới được thêm.

Demo:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Bước 5: Thêm khả năng cấu hình cho Block

Tiếp theo, chúng ta sẽ thêm tính năng cấu hình cho Block thông qua **Flow**, để người dùng có thể chỉnh sửa nội dung Block trên giao diện.

Tiếp tục chỉnh sửa file `SimpleBlockModel.tsx`:

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

Demo:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Tổng kết

Bài viết này đã giới thiệu cách tạo một plugin Block đơn giản, bao gồm:

- Cách định nghĩa và hiện thực Block Model
- Cách đăng ký Block Model
- Cách thêm tính năng cấu hình cho Block thông qua Flow

Mã nguồn đầy đủ: [Ví dụ Simple Block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)
