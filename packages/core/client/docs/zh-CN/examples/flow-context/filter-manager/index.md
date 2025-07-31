# ctx.filterManager

:::info
- `ctx.filterManager` 由 `BlockGridModelContext` 提供，仅可在 `BlockGridModel` 中使用。
:::

`ctx.filterManager` 由 `BlockGridModelContext` 提供，仅可在 `BlockGridModel` 中使用。负责管理 `BlockGridModel` 中多个数据区块（items）间的筛选连接，支持多个区块的同步筛选。

filterManager 的核心功能是协调两个角色：

- `FilterModel`：提供筛选条件的模型
- `TargetModel`：被筛选的目标模型

## FilterModel 要求

提供筛选项的 `FilterModel` 必须提供 `getFilterValue()` 方法

```ts
class MyFilterModel extends FlowModel {
  getFilterValue() {
    // TODO: 返回筛选值;
  }
}
```

## TargetModel 要求

被筛选的 TargetModel 需满足以下条件：

### 1. 必须有 `model.context.resource` 上下文

TargetModel 需在上下文中定义 resource 属性，用于提供数据资源接口，示例：

```ts
class MyModel extends FlowModel {
  onInit() {
    this.context.defineProperty('resource', {
      get: () => {
        const params = this.getStepParams('flowKey1', 'stepKey1');
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        return resource;
      }
    });
  }
}
```

### 2. Resource 需支持筛选功能

- `resource.supportsFilter` 必须为 `true`
- 必须实现 `resource.addFilterGroup()` 方法

目前已支持筛选的 Resource 有：

- `MultiRecordResource`
- `SingleRecordResource`
- `SQLResource`

#### 自定义 Resource 示例

自定义 Resource 需实现如下接口：

```ts
class CustomResource extends APIResource {
  get supportsFilter() {
    return true;
  }
  addFilterGroup(key, filter) {
    // TODO: 实现筛选逻辑
  }
}
```

## 筛选连接的管理

### 添加筛选连接的配置

```ts
filterManager.addFilterConfig({
  filterModelUid,
  targetModelUid,
  targetFieldPaths,
  operator,
});
```

### 删除筛选连接的配置

```ts
filterManager.removeFilterConfig({
  filterModelUid, // 删除所有与 filterModelUid 匹配的记录
  targetModelUid, // 删除所有与 targetModelUid 匹配的记录
});
```

### 将筛选配置绑定到 TargetModel

```ts
filterManager.bindToTarget(targetModelUid);
```

### 将筛选配置从 TargetModel 解除绑定

```ts
filterManager.unbindFromTarget(targetModelUid);
```

### 根据筛选条件，筛选所有符合条件的 TargetModel

- 单个 filterModelUid 时，刷新对应的目标模型筛选。
- 传入数组时，同时刷新多个 FilterModel 关联的目标模型。

```ts
filterManager.refreshTargetsByFilter(filterModelUid);
filterManager.refreshTargetsByFilter([filterModelUid1, filterModelUid2]);
```
