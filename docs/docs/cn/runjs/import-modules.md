# 导入模块

RunJS 中可使用两类模块：**内置模块**（通过 `ctx.libs` 直接使用，无需 import）和 **外部模块**（通过 `ctx.importAsync()` 或 `ctx.requireAsync()` 按需加载）。

---

## 内置模块 - ctx.libs（无需 import）

RunJS 内置了常用库，可直接通过 `ctx.libs` 访问，**无需** `import` 或异步加载。

| 属性 | 说明 |
|------|------|
| **ctx.libs.React** | React 本体，用于 JSX 与 Hooks |
| **ctx.libs.ReactDOM** | ReactDOM（如需 createRoot 等可配合使用） |
| **ctx.libs.antd** | Ant Design 组件库 |
| **ctx.libs.antdIcons** | Ant Design 图标 |
| **ctx.libs.math** | [Math.js](https://mathjs.org/)：数学表达式、矩阵运算等 |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/)：类 Excel 公式（SUM、AVERAGE 等） |

### 示例：React 与 antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>点击</Button>);
```

### 示例：ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### 示例：ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## 外部模块

需要第三方库时，根据模块格式选择加载方式：

- **ESM 模块** → 使用 `ctx.importAsync()`
- **UMD/AMD 模块** → 使用 `ctx.requireAsync()`

---

### 导入 ESM 模块

使用 **`ctx.importAsync()`** 按 URL 动态加载 ESM 模块，适用于 JS 区块、JS 字段、JS 操作等场景。

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**：ESM 模块地址。支持简写格式 `<包名>@<版本>` 或带子路径 `<包名>@<版本>/<文件路径>`（如 `vue@3.4.0`、`lodash@4/lodash.js`），会按配置拼接 CDN 前缀；也支持完整 URL。
- **返回**：解析后的模块命名空间对象。

#### 默认为 https://esm.sh

未配置时，简写形式会使用 **https://esm.sh** 作为 CDN 前缀。例如：

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// 等价于从 https://esm.sh/vue@3.4.0 加载
```

#### 自建 esm.sh 服务

若需内网或自建 CDN，可部署兼容 esm.sh 协议的服务，并通过环境变量指定：

- **ESM_CDN_BASE_URL**：ESM CDN 基础地址（默认 `https://esm.sh`）
- **ESM_CDN_SUFFIX**：可选后缀（如 jsDelivr 的 `/+esm`）

自建服务可参考：[https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### 导入 UMD/AMD 模块

使用 **`ctx.requireAsync()`** 按 URL 异步加载 UMD/AMD 或挂载到全局的脚本。

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**：支持两种形式：
  - **简写路径**：`<包名>@<版本>/<文件路径>`，与 `ctx.importAsync()` 相同，会按当前 ESM CDN 配置解析；解析时会加上 `?raw`，直接请求该路径的原始文件（多为 UMD 构建）。例如 `echarts@5/dist/echarts.min.js` 实际请求 `https://esm.sh/echarts@5/dist/echarts.min.js?raw`（当默认使用 esm.sh 时）。
  - **完整 URL**：任意 CDN 的完整地址（如 `https://cdn.jsdelivr.net/npm/xxx`）。
- **返回**：加载后的库对象（具体形式取决于该库的导出方式）

加载后，许多 UMD 库会挂到全局对象（如 `window.xxx`），使用时按该库文档即可。

**示例**

```ts
// 简写路径（经 esm.sh 解析为 ...?raw）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 完整 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**注意**：若库同时提供 ESM 版本，优先使用 `ctx.importAsync()`，以获得更好的模块语义与 Tree-shaking。
