# Observable

:::info
NocoBase 的 Observable 响应式机制本质上与 [MobX](https://mobx.js.org/README.html) 类似。当前底层实现采用的是 [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive)，语法和理念与 [MobX](https://mobx.js.org/README.html) 高度兼容，仅因历史原因未直接使用 [MobX](https://mobx.js.org/README.html)。
:::

在 NocoBase 2.0 中，`Observable` 响应式对象无处不在。它是底层数据流和 UI 响应的核心，广泛应用于 FlowContext、FlowModel、FlowStep 等环节。

## 为什么选择 Observable？

NocoBase 之所以选择 Observable，而不是 Redux、Recoil、Zustand、Jotai 等状态管理方案，主要原因有：

- **极致灵活**：Observable 可以让任意对象、数组、Map、Set 等变为响应式，天然支持深层嵌套和动态结构，非常适合复杂的业务模型。
- **零侵入**：你可以直接操作原始对象，无需定义 action、reducer 或额外的 store，开发体验极佳。
- **自动依赖收集**：只要用 `observer` 包裹组件，组件会自动追踪用到的 Observable 属性，数据变更时自动刷新 UI，无需手动管理依赖。
- **适用于非 React 场景**：Observable 响应式机制不仅适用于 React，也可以与其他框架结合，满足更广泛的响应式数据需求。

## 为什么要用 observer？

`observer` 会监听 Observable 对象的变化，并在数据发生变动时自动触发 React 组件的更新。这样可以让你的 UI 与数据保持同步，无需手动调用 `setState` 或其他更新方法。

## 基本用法

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

如需了解更多响应式用法，可参考 [@formily/reactive](https://reactive.formilyjs.org/) 文档。
