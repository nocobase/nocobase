# ctx.libs.React

Built-in React namespace, equivalent to `ctx.React`. Used to write JSX components and use React hooks in the RunJS environment.

## Type Definition (Simplified)

```ts
libs.React: typeof import('react');
```

## Examples

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
