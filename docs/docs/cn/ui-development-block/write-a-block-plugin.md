# 编写第一个区块插件

在开始之前，建议先阅读「[编写第一个插件](../plugin-development/write-your-first-plugin.md)」，了解如何快速创建基础插件。接下来，我们将在此基础上扩展一个简单的区块（Block）功能。

## 第 1 步：创建区块模型文件

在插件目录下创建文件：`client/models/SimpleBlockModel.tsx`

## 第 2 步：编写模型内容

在文件中定义并实现一个基础区块模型，包括其渲染逻辑：

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

## 第 3 步：注册区块模型

在 `client/models/index.ts` 文件中导出新创建的模型：

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## 第 4 步：激活并体验区块

启用插件后，在「添加区块」的下拉菜单中，你可以看到新增的 **Hello block** 区块选项。

效果演示：

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## 第 5 步：为区块添加配置能力

接下来，我们通过 **Flow** 为区块添加可配置功能，使用户可以在界面上编辑区块内容。

继续编辑 `SimpleBlockModel.tsx` 文件：

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

效果演示：

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## 总结

本文介绍了如何创建一个简单的区块插件，包括：

- 如何定义并实现区块模型
- 如何注册区块模型
- 如何通过 Flow 为区块添加配置化功能

完整源码参考：[Simple Block 示例](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)
