# ctx.setValue()

In JSField / JSItem and similar scenarios, set the value of the current field.  
Use with `ctx.getValue()` to achieve two-way binding with the form.

## Type Definition (Simplified)

```ts
setValue<T = any>(value: T): void;
```

- `value`: the field value to write. The type is determined by the field's form item type.

> Notes: `ctx.setValue(v)` updates the current field's value in the form and triggers related form linkage and validation logic.
