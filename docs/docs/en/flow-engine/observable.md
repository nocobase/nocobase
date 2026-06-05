# Reactivity Mechanism: Observable

:::info
NocoBase's Observable reactivity mechanism is essentially similar to [MobX](https://mobx.js.org/README.html). The current underlying implementation uses [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), and its syntax and concepts are highly compatible with [MobX](https://mobx.js.org/README.html). It was not used directly for historical reasons.
:::

In NocoBase 2.0, `Observable` reactive objects are ubiquitous. It is the core of the underlying data flow and UI responsiveness, and is widely used in components like FlowContext, FlowModel, and FlowStep.

## Why choose Observable?

NocoBase chose Observable over other state management solutions like Redux, Recoil, Zustand, and Jotai for the following main reasons:

- **Extremely flexible**: Observable can make any object, array, Map, Set, etc., reactive. It naturally supports deep nesting and dynamic structures, making it very suitable for complex business models.
- **Non-intrusive**: You can directly manipulate the original object without defining actions, reducers, or additional stores, providing an excellent development experience.
- **Automatic dependency tracking**: By wrapping a component with `observer`, the component automatically tracks the Observable properties it uses. When the data changes, the UI refreshes automatically without the need for manual dependency management.
- **Suitable for non-React scenarios**: The Observable reactivity mechanism is not only applicable to React but can also be combined with other frameworks to meet a broader range of reactive data needs.

## Why use observer?

`observer` listens for changes in Observable objects and automatically triggers updates to React components when the data changes. This keeps your UI in sync with your data without having to manually call `setState` or other update methods.

## Basic Usage

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

For more information on reactive usage, please refer to the [@formily/reactive](https://reactive.formilyjs.org/) documentation.