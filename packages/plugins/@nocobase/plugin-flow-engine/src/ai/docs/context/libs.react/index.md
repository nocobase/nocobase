# ctx.libs.React

内置的 React 命名空间，与 `ctx.React` 等价。用于在 RunJS 环境中编写 JSX 组件、使用 React hooks 等。

## 类型定义（简化）

```ts
libs.React: typeof import('react');
```

## 使用示例

```ts
const { useState } = ctx.libs.React;
const { Button } = ctx.libs.antd;

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>+1</Button>
    </div>
  );
};

ctx.render(<Counter />);
```
