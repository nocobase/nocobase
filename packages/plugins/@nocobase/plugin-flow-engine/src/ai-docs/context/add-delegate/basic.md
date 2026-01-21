# Basic

## Attach Delegate

Use this snippet to attach delegate.

```ts
ctx.addDelegate(delegate);
```

## Detach Delegate

Use this snippet to detach delegate.

```ts
ctx.removeDelegate(delegate);
```

## Chain Delegates

Use this snippet to chain delegates.

```ts
let current = root;
for (const delegate of delegates) {
  current.addDelegate(delegate);
  current = delegate;
}
```
