# ctx.getVar()

从当前运行时上下文中**异步**读取变量值。变量来源与 SQL、模板中的 `{{ctx.xxx}}` 解析一致，通常来自当前用户、当前记录、视图参数、弹窗上下文等。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField** | 获取当前记录、用户、资源等信息用于渲染或逻辑判断 |
| **联动规则 / 事件流** | 读取 `ctx.record`、`ctx.formValues` 等做条件判断 |
| **公式 / 模板** | 与 `{{ctx.xxx}}` 使用相同的变量解析规则 |

## 类型定义

```ts
getVar(path: string): Promise<any>;
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 变量路径，**必须以 `ctx.` 开头**，支持点访问与数组下标 |

**返回值**：`Promise<any>`，需使用 `await` 获取解析后的值；变量不存在时返回 `undefined`。

> 若传入不以 `ctx.` 开头的路径，会抛出错误：`ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`。

## 常用变量路径

| 路径 | 说明 |
|------|------|
| `ctx.record` | 当前记录（表单/详情绑定记录时可用） |
| `ctx.record.id` | 当前记录主键 |
| `ctx.formValues` | 当前表单值（联动规则、事件流中常用；表单场景下优先用 `ctx.form.getFieldsValue()` 实时读取） |
| `ctx.user` | 当前登录用户 |
| `ctx.user.id` | 当前用户 ID |
| `ctx.user.nickname` | 当前用户昵称 |
| `ctx.user.roles.name` | 当前用户角色名（数组） |
| `ctx.popup.record` | 弹窗内记录 |
| `ctx.popup.record.id` | 弹窗内记录主键 |
| `ctx.urlSearchParams` | URL 查询参数（从 `?key=value` 解析而来） |
| `ctx.token` | 当前 API Token |
| `ctx.role` | 当前角色 |

## ctx.getVarInfos()

获取当前上下文中可解析变量的**结构信息**（类型、标题、子属性等），便于探索可用路径。返回值为基于 `meta` 的静态描述，不包含实际运行值。

### 类型定义

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

返回值中每个 key 为变量路径，value 为该路径对应的结构信息（含 `type`、`title`、`properties` 等）。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string \| string[]` | 剪裁路径，仅收集该路径下的变量结构。支持 `'record'`、`'record.id'`、`'ctx.record'`、`'{{ ctx.record }}'`；数组表示多个路径合并 |
| `maxDepth` | `number` | 最大展开层级，默认 `3`。不传 path 时顶层属性 depth=1；传 path 时 path 对应节点 depth=1 |

### 示例

```ts
// 获取 record 下的变量结构（最多展开 3 层）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// 获取 popup.record 的结构
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// 获取完整顶层变量结构（默认 maxDepth=3）
const vars = await ctx.getVarInfos();
```

## 与 ctx.getValue 的区别

| 方法 | 适用场景 | 说明 |
|------|----------|------|
| `ctx.getValue()` | JSField、JSItem 等可编辑字段 | 同步获取**当前字段**的值，需表单绑定 |
| `ctx.getVar(path)` | 任意 RunJS 上下文 | 异步获取**任意 ctx 变量**，path 需以 `ctx.` 开头 |

在 JSField 中读写本字段用 `getValue`/`setValue`；访问其他上下文变量（如 record、user、formValues）用 `getVar`。

## 注意事项

- **path 必须以 `ctx.` 开头**：如 `ctx.record.id`，否则抛出错误。
- **异步方法**：必须使用 `await` 获取结果，如 `const id = await ctx.getVar('ctx.record.id')`。
- **变量不存在**：返回 `undefined`，可在结果后使用 `??` 设置默认值：`(await ctx.getVar('ctx.user.nickname')) ?? '访客'`。
- **表单值**：`ctx.formValues` 需通过 `await ctx.getVar('ctx.formValues')` 获取，不直接暴露为 `ctx.formValues`。在表单上下文中优先用 `ctx.form.getFieldsValue()` 实时读取最新值。

## 示例

### 获取当前记录 ID

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`当前记录：${recordId}`);
}
```

### 获取弹窗内记录

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`当前弹窗记录：${recordId}`);
}
```

### 读取数组字段子项

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// 返回角色名数组，如 ['admin', 'member']
```

### 设置默认值

```ts
// getVar 无 defaultValue 参数，可在结果后使用 ??
const userName = (await ctx.getVar('ctx.user.nickname')) ?? '访客';
```

### 读取表单字段值

```ts
// ctx.formValues 与 ctx.form 同为表单场景，可用 getVar 读取嵌套字段
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### 读取 URL 查询参数

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // 对应 ?id=xxx
```

### 探索可用变量

```ts
// 获取 record 下的变量结构（最多展开 3 层）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars 形如 { 'record.id': { type: 'string', title: 'id' }, ... }
```

## 相关

- [ctx.getValue()](./get-value.md) - 同步获取当前字段值（仅 JSField/JSItem 等）
- [ctx.form](./form.md) - 表单实例，`ctx.form.getFieldsValue()` 可实时读取表单值
- [ctx.model](./model.md) - 当前执行上下文所在模型
- [ctx.blockModel](./block-model.md) - 当前 JS 所在的父区块
- [ctx.resource](./resource.md) - 当前上下文中的 resource 实例
- SQL / 模板中的 `{{ctx.xxx}}` - 与 `ctx.getVar('ctx.xxx')` 使用相同解析规则
