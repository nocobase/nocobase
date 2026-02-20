# ctx.collectionField

当前 RunJS 执行上下文关联的数据表字段（CollectionField）实例，用于访问字段的元数据、类型、校验规则及关联信息。仅在字段绑定到数据表定义时存在；自定义/虚拟字段可能为 `null`。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField** | 表单字段中根据 `interface`、`enum`、`targetCollection` 等做联动或校验 |
| **JSItem** | 子表格项中访问当前列对应字段的元数据 |
| **JSColumn** | 表格列中按 `collectionField.interface` 选择渲染方式，或访问 `targetCollection` |

> 注意：`ctx.collectionField` 仅在字段绑定到数据表（Collection）定义时可用；JSBlock 独立区块、无字段绑定的操作事件等场景中通常为 `undefined`，使用前建议做空值判断。

## 类型定义

```ts
collectionField: CollectionField | null | undefined;
```

## 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 字段名（如 `status`、`userId`） |
| `title` | `string` | 字段标题（含国际化） |
| `type` | `string` | 字段数据类型（`string`、`integer`、`belongsTo` 等） |
| `interface` | `string` | 字段界面类型（`input`、`select`、`m2o`、`o2m`、`m2m` 等） |
| `collection` | `Collection` | 字段所属数据表 |
| `targetCollection` | `Collection` | 关联字段的目标数据表（仅关联类型有值） |
| `target` | `string` | 目标数据表名称（关联字段） |
| `enum` | `array` | 枚举选项（select、radio 等） |
| `defaultValue` | `any` | 默认值 |
| `collectionName` | `string` | 所属数据表名称 |
| `foreignKey` | `string` | 外键字段名（belongsTo 等） |
| `sourceKey` | `string` | 关联源键（hasMany 等） |
| `targetKey` | `string` | 关联目标键 |
| `fullpath` | `string` | 完整路径（如 `main.users.status`），用于 API 或变量引用 |
| `resourceName` | `string` | 资源名（如 `users.status`） |
| `readonly` | `boolean` | 是否只读 |
| `titleable` | `boolean` | 是否可作为标题展示 |
| `validation` | `object` | 校验规则配置 |
| `uiSchema` | `object` | UI 配置 |
| `targetCollectionTitleField` | `CollectionField` | 关联目标数据表的标题字段（关联字段） |

## 常用方法

| 方法 | 说明 |
|------|------|
| `isAssociationField(): boolean` | 是否为关联字段（belongsTo、hasMany、hasOne、belongsToMany 等） |
| `isRelationshipField(): boolean` | 是否为关系型字段（含 o2o、m2o、o2m、m2m 等） |
| `getComponentProps(): object` | 获取字段组件的默认 props |
| `getFields(): CollectionField[]` | 获取关联目标数据表的字段列表（仅关联字段） |
| `getFilterOperators(): object[]` | 获取该字段支持的筛选操作符（如 `$eq`、`$ne` 等） |

## 示例

### 根据字段类型做分支渲染

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // 关联字段：显示关联记录
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### 判断是否为关联字段并访问目标数据表

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // 按目标数据表结构处理
}
```

### 获取枚举选项

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### 根据只读/只展示模式做条件渲染

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### 获取关联目标数据表的标题字段

```ts
// 关联字段显示时，可用目标数据表的 titleCollectionField 获取标题字段名
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## 与 ctx.collection 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前字段所属数据表** | `ctx.collectionField?.collection` 或 `ctx.collection` |
| **字段元数据（名、类型、接口、枚举等）** | `ctx.collectionField` |
| **关联目标数据表** | `ctx.collectionField?.targetCollection` |

`ctx.collection` 通常表示当前区块绑定的数据表；`ctx.collectionField` 表示当前字段在数据表中的定义。在子表格、关联字段等场景下，两者可能不同。

## 注意事项

- 在 **JSBlock**、**JSAction（无字段绑定）** 等场景中，`ctx.collectionField` 通常为 `undefined`，访问前建议使用可选链。
- 自定义 JS 字段若未绑定到数据表字段，`ctx.collectionField` 可能为 `null`。
- `targetCollection` 仅在关联类型字段（如 m2o、o2m、m2m）下存在；`enum` 仅在 select、radioGroup 等有选项的字段下存在。

## 相关

- [ctx.collection](./collection.md)：当前上下文关联的数据表
- [ctx.model](./model.md)：当前执行上下文所在模型
- [ctx.blockModel](./block-model.md)：承载当前 JS 的父区块
- [ctx.getValue()](./get-value.md)、[ctx.setValue()](./set-value.md)：读写当前字段值
