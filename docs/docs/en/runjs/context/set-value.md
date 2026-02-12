# ctx.setValue()

In JSField / JSItem scenarios, set the value of the current field. Together with `ctx.getValue()`, it enables two-way binding with the form.

## Type definition (simplified)

```ts
setValue<T = any>(value: T): void;
```

- `value`: value to write into the field. Type depends on the field form item type.

> Note: `ctx.setValue(v)` updates the field value in the form and triggers related linkage and validation logic.
