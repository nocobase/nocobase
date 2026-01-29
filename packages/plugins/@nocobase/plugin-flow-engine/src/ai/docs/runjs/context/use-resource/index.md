# ctx.useResource()

A React hook for obtaining the current resource object in JSX scenarios (render React components via `ctx.render`).

> Only use this in RunJS scenarios that support hooks, such as `ctx.render(<Component />)`.

## Type Definition (Simplified)

```ts
useResource<T = any>(): T;
```

## Examples

```ts
const { useResource } = ctx;

const ResourceInfo = () => {
  const resource = useResource();
  return <div>Resource name: {resource?.name}</div>;
};

ctx.render(<ResourceInfo />);
```
