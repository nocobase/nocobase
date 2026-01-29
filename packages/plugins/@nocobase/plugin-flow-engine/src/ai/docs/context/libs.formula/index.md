# ctx.libs.formula

内置的 Formula.js 电子表格公式库，在 RunJS 环境中可直接使用，适合做汇总、统计等类似 Excel 的公式计算。

## 类型定义（简化）

```ts
libs.formula: typeof import('formulajs');
```

## 使用示例

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
