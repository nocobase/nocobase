# ctx.filterManager

筛选连接管理器，用于管理筛选表单（FilterForm）与数据区块（表格、列表、图表等）之间的筛选关联。由 `BlockGridModel` 提供，仅在其上下文中（如筛选表单区块、数据区块）可用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **筛选表单区块** | 管理筛选项与目标区块的连接配置，筛选变更时刷新目标数据 |
| **数据区块（表格/列表）** | 作为被筛选目标，通过 `bindToTarget` 绑定筛选条件 |
| **联动规则 / 自定义 FilterModel** | 在 `doFilter`、`doReset` 中调用 `refreshTargetsByFilter` 触达目标刷新 |
| **连接字段配置** | 使用 `getConnectFieldsConfig`、`saveConnectFieldsConfig` 维护筛选器与目标的字段映射 |

> 注意：`ctx.filterManager` 仅在有 `BlockGridModel` 的 RunJS 上下文中可用（如包含筛选表单的页面内）；普通 JSBlock 或独立页面中为 `undefined`，使用前建议做可选链判断。

## 类型定义

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // 筛选器模型 UID
  targetId: string;   // 目标数据区块模型 UID
  filterPaths?: string[];  // 目标区块的字段路径
  operator?: string;  // 筛选操作符
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## 常用方法

| 方法 | 说明 |
|------|------|
| `getFilterConfigs()` | 获取当前所有筛选连接配置 |
| `getConnectFieldsConfig(filterId)` | 获取指定筛选器的连接字段配置 |
| `saveConnectFieldsConfig(filterId, config)` | 保存筛选器的连接字段配置 |
| `addFilterConfig(config)` | 添加筛选配置（filterId + targetId + filterPaths） |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | 删除筛选配置，按 filterId 或 targetId 或二者 |
| `bindToTarget(targetId)` | 将筛选配置绑定到目标区块，触发其 resource 应用筛选 |
| `unbindFromTarget(targetId)` | 从目标区块解除筛选绑定 |
| `refreshTargetsByFilter(filterId 或 filterId[])` | 根据筛选器刷新关联的目标区块数据 |

## 核心概念

- **FilterModel**：提供筛选条件的模型（如 FilterFormItemModel），需实现 `getFilterValue()` 返回当前筛选值
- **TargetModel**：被筛选的数据区块，其 `resource` 需支持 `addFilterGroup`、`removeFilterGroup`、`refresh`

## 示例

### 添加筛选配置

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### 刷新目标区块

```ts
// 筛选表单的 doFilter / doReset 中
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// 刷新多个筛选器关联的目标
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### 连接字段配置

```ts
// 获取连接配置
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// 保存连接配置
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### 删除配置

```ts
// 删除某筛选器的所有配置
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// 删除某目标的所有筛选配置
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## 相关

- [ctx.resource](./resource.md)：目标区块的 resource 需支持筛选接口
- [ctx.model](./model.md)：获取当前模型 UID 用于 filterId / targetId
