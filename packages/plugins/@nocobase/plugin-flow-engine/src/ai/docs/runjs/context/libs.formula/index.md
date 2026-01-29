# ctx.libs.formula

Built-in Formula.js spreadsheet formula library, available directly in RunJS for Excel-like calculations such as sums and statistics.

## Type Definition (Simplified)

```ts
libs.formula: typeof import('formulajs');
```

## Examples

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);

ctx.render(
  <div>
    <div>SUM = {sum}</div>
    <div>AVERAGE = {avg}</div>
  </div>,
);
```
