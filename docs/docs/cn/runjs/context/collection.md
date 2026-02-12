# ctx.collection

当前 RunJS 执行上下文关联的数据表（Collection）实例，用于访问数据表的元数据、字段定义及主键等配置。通常来自 `ctx.blockModel.collection` 或 `ctx.collectionField?.collection`。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 区块绑定的数据表，可访问 `name`、`getFields`、`filterTargetKey` 等 |
| **JSField / JSItem / JSColumn** | 当前字段所属数据表（或父区块数据表），用于获取字段列表、主键等 |
| **表格列 / 详情区块** | 根据数据表结构渲染、打开弹窗时传入 `filterByTk` 等 |

> 注意：`ctx.collection` 在数据区块、表单区块、表格区块等绑定数据表的场景下可用；独立 JSBlock 若未绑定数据表可能为 `null`，使用前建议做空值判断。

## 类型定义

```ts
collection: Collection | null | undefined;
```

## 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 数据表名称（如 `users`、`orders`） |
| `title` | `string` | 数据表标题（含国际化） |
| `filterTargetKey` | `string \| string[]` | 主键字段名，用于 `filterByTk`、`getFilterByTK` |
| `dataSourceKey` | `string` | 数据源 key（如 `main`） |
| `dataSource` | `DataSource` | 所属数据源实例 |
| `template` | `string` | 数据表模板（如 `general`、`file`、`tree`） |
| `titleableFields` | `CollectionField[]` | 可作为标题展示的字段列表 |
| `titleCollectionField` | `CollectionField` | 标题字段实例 |

## 常用方法

| 方法 | 说明 |
|------|------|
| `getFields(): CollectionField[]` | 获取全部字段（含继承） |
| `getField(name: string): CollectionField \| undefined` | 按字段名获取单个字段 |
| `getFieldByPath(path: string): CollectionField \| undefined` | 按路径获取字段（支持关联，如 `user.name`） |
| `getAssociationFields(types?): CollectionField[]` | 获取关联字段，`types` 可为 `['one']`、`['many']` 等 |
| `getFilterByTK(record): any` | 从记录中提取主键值，用于 API 的 `filterByTk` |

## 与 ctx.collectionField、ctx.blockModel 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前上下文关联的数据表** | `ctx.collection`（等价于 `ctx.blockModel?.collection` 或 `ctx.collectionField?.collection`） |
| **当前字段的数据表定义** | `ctx.collectionField?.collection`（字段所属数据表） |
| **关联目标数据表** | `ctx.collectionField?.targetCollection`（关联字段的目标数据表） |

在子表格等场景，`ctx.collection` 可能是关联目标数据表；在普通表单/表格中，通常为区块绑定数据表。

## 示例

### 获取主键并打开弹窗

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### 遍历字段做校验或联动

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} 为必填`);
    return;
  }
}
```

### 获取关联字段

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// 用于构建子表格、关联资源等
```

## 注意事项

- `filterTargetKey` 为数据表的主键字段名；部分数据表可能为 `string[]` 复合主键；未配置时常用 `'id'` 作为回退。
- 在**子表格、关联字段**等场景，`ctx.collection` 可能指向关联目标数据表，与 `ctx.blockModel.collection` 不同。
- `getFields()` 会合并继承数据表的字段，自身字段覆盖同名继承字段。

## 相关

- [ctx.collectionField](./collection-field.md)：当前字段的数据表字段定义
- [ctx.blockModel](./block-model.md)：承载当前 JS 的父区块，含 `collection`
- [ctx.model](./model.md)：当前模型，可含 `collection`
