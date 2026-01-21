# Observable Ref Box

## Register Observable Ref

`observable.ref` exposes a `.value` field that can be reassigned.

```ts
ctx.defineProperty('refValue', {
  observable: true,
  get: () => observable.ref(uid()),
});
```

## Register Observable Box

`observable.box` exposes `.get()`/`.set()` helpers and observes nested data.

```ts
ctx.defineProperty('boxValue', {
  observable: true,
  get: () => observable.box({ id: uid(), status: 'pending' }),
});
```

## Mutate Ref

Use this snippet to mutate ref.

```ts
const before = ctx.refValue.value;
ctx.refValue.value = uid();
const after = ctx.refValue.value;
return { before, after };
```

## Mutate Box

Use this snippet to mutate box.

```ts
const before = ctx.boxValue.get();
ctx.boxValue.set({ ...before, status: 'done' });
const after = ctx.boxValue.get();
return { before, after };
```
