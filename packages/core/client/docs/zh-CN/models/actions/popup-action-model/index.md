# PopupActionModel

## 扩展说明

```ts
class HelloPopupActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: 'Hello Popup Action',
  };
}
```

## 透传自定义上下文（继承 PopupActionModel）

以下示例展示如何在继承 `PopupActionModel` 时，通过覆盖 `getInputArgs()` 透传自定义上下文到弹窗页面中。

```ts
import type { ButtonProps } from 'antd';
import { ActionSceneEnum } from '@nocobase/flow-engine';

class CustomCtxPopupActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: '打开带自定义上下文的弹窗',
    type: 'primary',
  };

  // 关键：覆盖 getInputArgs，把自定义上下文附加到点击入参
  getInputArgs() {
    const base = super.getInputArgs?.() || {};
    return {
      ...base,
      // 自定义属性：在子页面可通过 ctx.someContext 访问传递到下层弹窗的上下文
      defineProperties: {
        someContext: {
          get: async () => {
            return { name: '演示数据', email: 'demo@example.com' };
          },
          meta: {
            title: '新定义上下文',
            type: 'object',
            properties: {
              name: { title: '名称', type: 'string' },
              email: { title: '邮箱', type: 'string' },
            },
          },
        },
      },
      // 自定义方法：在子页面可通过 await ctx.greeting() 调用
      defineMethods: {
        greeting: async () => {
          console.log('hi');
        },
      },
    };
  }
}
```

以下示例展示如何在继承 `PopupActionModel` 时，通过覆盖 `getInputArgs()` 透传自定义上下文到弹窗页面中。

<code src="./index.tsx"></code>