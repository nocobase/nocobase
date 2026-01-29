# ctx.libs.math

内置的 Math.js 数学运算库，在 RunJS 环境中可直接使用，适合做复杂表达式计算、矩阵运算等。

## 类型定义（简化）

```ts
libs.math: typeof import('mathjs');
```

## 使用示例

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');

ctx.render(<div>结果：{String(result)}</div>);
```
