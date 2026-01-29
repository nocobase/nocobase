# ctx.getValue()

In JSField / JSItem and similar scenarios, get the latest value of the current field.  
Use with `ctx.setValue(v)` to achieve two-way binding with the form.

## Type Definition (Simplified)

```ts
getValue<T = any>(): T | undefined;
```

- Returns: the current field value. The type is determined by the field's form item type; it may be `undefined` before the field is registered or filled.

> Notes: `ctx.getValue()` typically reads the value from form state first; if not present, it falls back to the field's initial value / props.
