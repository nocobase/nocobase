# ctx.libs

`ctx.libs` 是 RunJS 内置库的统一命名空间，包含 React、Ant Design、dayjs、lodash 等常用库。**无需 `import` 或异步加载**，可直接通过 `ctx.libs.xxx` 使用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | 使用 React + Ant Design 渲染 UI、dayjs 处理日期、lodash 做数据处理 |
| **公式 / 计算** | 使用 formula 或 math 做类 Excel 公式、数学表达式运算 |
| **事件流 / 联动规则** | 在纯逻辑场景中调用 lodash、dayjs、formula 等工具库 |

## 内置库一览

| 属性 | 说明 | 文档 |
|------|------|------|
| `ctx.libs.React` | React 本体，用于 JSX 与 Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM 客户端 API（含 `createRoot`），配合 React 渲染 | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design 组件库（Button、Card、Table、Form、Input、Modal 等） | [Ant Design](https://ant.design/components/overview-cn/) |
| `ctx.libs.antdIcons` | Ant Design 图标库（如 PlusOutlined、UserOutlined） | [@ant-design/icons](https://ant.design/components/icon-cn/) |
| `ctx.libs.dayjs` | 日期时间工具库 | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | 工具库（get、set、debounce 等） | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | 类 Excel 公式函数库（SUM、AVERAGE、IF 等） | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | 数学表达式与计算库 | [Math.js](https://mathjs.org/docs/) |

## 顶层别名

为兼容历史代码，部分库同时暴露在顶层：`ctx.React`、`ctx.ReactDOM`、`ctx.antd`、`ctx.dayjs`。**推荐统一使用 `ctx.libs.xxx`**，便于维护与文档检索。

## 懒加载

`lodash`、`formula`、`math` 等采用**懒加载**：首次访问 `ctx.libs.lodash` 时才发起动态 import，之后复用缓存。`React`、`antd`、`dayjs`、`antdIcons` 由上下文预置，访问即可用。

## 示例

### React 与 Ant Design 渲染

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="标题">
    <Button type="primary">点击</Button>
  </Card>
);
```

### 使用 Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### 使用图标

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>用户</Button>);
```

### dayjs 日期处理

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash 工具函数

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### formula 公式计算

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math 数学表达式

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## 注意事项

- **与 ctx.importAsync 混用**：若通过 `ctx.importAsync('react@19')` 加载了外部 React，JSX 会使用该实例；此时**不要**与 `ctx.libs.antd` 混用，antd 需与该 React 版本配套加载（如 `ctx.importAsync('antd@5.x')`、`ctx.importAsync('@ant-design/icons@5.x')`）。
- **多 React 实例**：若出现 “Invalid hook call” 或 hook dispatcher 为 null，通常由多个 React 实例引起。在读取 `ctx.libs.React` 或调用 Hooks 前，先执行 `await ctx.importAsync('react@版本')` 确保与页面共用同一 React。

## 相关

- [ctx.importAsync()](./import-async.md) - 按需加载外部 ESM 模块（如指定版本的 React、Vue）
- [ctx.render()](./render.md) - 渲染内容到容器
