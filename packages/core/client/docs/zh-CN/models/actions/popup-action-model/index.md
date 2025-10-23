# PopupActionModel
<code src="./index.tsx"></code>

弹窗操作

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

以下示例展示如何在继承 `PopupActionModel` 时，通过覆盖 `getInputArgs()` 透传自定义上下文到弹窗页面中。无需手动设置 `navigation: false`，当存在自定义上下文时引擎会自动采用非路由模式，避免上下文丢失。

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
      // 自定义属性：在子页面可通过 ctx.myToken / ctx.extraInfo 读取
      defineProperties: {
        myToken: { get: () => this.context.user?.id },
        extraInfo: { value: { from: 'parent', time: Date.now() } },
      },
      // 自定义方法：在子页面可通过 ctx.refreshParent() 调用
      defineMethods: {
        refreshParent: async () => {
          await this.context.blockModel?.refreshTargets?.();
        },
      },
    };
  }
}
```

使用要点：

- 在 UI 编辑器中，为按钮绑定“弹窗设置”流程（`openView`），配置数据源/集合等参数。
- 若 `openView.uid` 留空或等于当前按钮模型的 `uid`，则打开“自身弹窗”，上述上下文会注入到子页面模型；
- 若 `openView.uid` 指向其它已存在的视图（“外部弹窗”），也会透传 `defineProperties`/`defineMethods`（已在 `openView` 动作中支持）。

在弹窗（子页面）中访问这些上下文：

```ts
// 例如在 JSBlockModel 中
ctx.element.innerHTML = `
  <div>
    <div>myToken: ${ctx.myToken}</div>
    <button class="btn">刷新父区块</button>
  </div>
`;
ctx.element.querySelector('.btn')?.addEventListener('click', () => {
  ctx.refreshParent?.();
});
```

说明：

- 自定义上下文通过 `pageModel.context.defineProperty/defineMethod` 注入，子页面中可直接以 `ctx.<key>` 和 `ctx.<method>()` 使用。
- 推荐跨视图的简单数据透传仍放在 `ctx.view.inputArgs` 中；而需要在子模型上下文长期可读/可调用的内容，适合放在 `defineProperties/defineMethods`。
