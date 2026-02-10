# ctx.getValue()

In JSField / JSItem scenarios, get the latest value of the current field. Together with `ctx.setValue(v)`, it enables two-way binding with the form.

## Type definition (simplified)

```ts
getValue<T = any>(): T | undefined;
```

- Return value: current field value. The type depends on the field form item type, and may be `undefined` if the field is not registered or not filled.

> Note: `ctx.getValue()` usually reads from form state first; if not available it falls back to the field initial value/props.
