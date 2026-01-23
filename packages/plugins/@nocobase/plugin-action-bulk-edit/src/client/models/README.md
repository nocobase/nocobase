# 批量编辑 FlowModel 完整实现文档

## 概述

本目录包含基于 FlowModel 的批量编辑功能的**完整重新实现**，与原有的 Schema 机制完全分离。这是一个独立的、功能完整的批量编辑解决方案。

## 核心区别

### 批量编辑 vs 批量更新

| 特性 | 批量编辑 (Bulk Edit) | 批量更新 (Bulk Update) |
|------|---------------------|---------------------|
| 字段组件 | `BulkEditField` | 普通字段组件 |
| 编辑模式 | 保持不变/修改为/清空 | 直接赋值 |
| 使用场景 | 选择性修改部分字段 | 批量赋值 |
| 表单模型 | `BulkEditFormModel` | `AssignFormModel` |
| 实现方式 | 完整 FlowModel | FlowModel |

### BulkEditField 工作原理

```typescript
// BulkEditField 返回格式
{
  1: undefined,  // RemainsTheSame - 保持不变
  2: newValue,   // ChangedTo - 修改为新值
  3: null        // Clear - 清空
}
```

## 完整架构设计

### BulkEditActionModel

批量编辑操作的 FlowModel 实现，继承自 `ActionModel`。

#### 核心特性

1. **场景设置**: `ActionSceneEnum.collection` - 作用于区块级别
2. **ACL 权限**: `update` - 需要更新权限
3. **默认按钮**: 图标为 `EditOutlined`，标题为 "批量编辑"

#### 实现策略

**重要**：本实现采用混合架构，充分复用原有代码：

1. **FlowModel 层面**：
   - 提供配置界面（二次确认、编辑模式）
   - 注册模型到 flowEngine
   - 类型定义和元数据

2. **原有机制层面**：
   - 弹窗和表单：复用现有 Schema 机制（BulkEditActionDecorator）
   - 字段组件：继续使用 BulkEditField 组件
   - 表单提交：由 `useCustomizeBulkEditActionProps` 处理

这种混合架构的优势：
- ✅ 最小化代码修改
- ✅ 保持原有功能完整性
- ✅ 提供 FlowModel 配置能力
- ✅ 避免重复实现

#### Flow 注册

##### 配置流 (bulkEditSettings)

**Steps:**

1. **confirm** - 二次确认
   - 支持开启/关闭
   - 自定义标题和内容
   - 默认关闭

2. **editMode** - 编辑数据范围
   - `selected`: 选中的记录
   - `all`: 全表记录
   - 默认为 `selected`

## 与原版对比

| 功能 | 原版 | FlowModel 版 |
|------|------|--------------|
| 字段编辑 | ✅ BulkEditField | ✅ BulkEditField (复用) |
| 选中行编辑 | ✅ | ✅ |
| 全表编辑 | ✅ | ✅ |
| 二次确认 | ✅ | ✅ (FlowModel配置) |
| 权限控制 | ✅ | ✅ |
| 多数据源 | ✅ | ✅ |
| 弹窗表单 | ✅ Schema | ✅ Schema (复用) |
| 配置界面 | ✅ Schema Settings | ✅ Flow Settings |

## 使用方式

在主插件文件中注册 models：

```typescript
import * as models from './models';

export class PluginActionBulkEditClient extends Plugin {
  async load() {
    // 注册 Flow 模型
    this.app.flowEngine.registerModels(models);
    // ... 其他代码
  }
}
```

## 配置示例

```typescript
// 配置流参数
{
  confirm: {
    enable: true,
    title: '批量编辑',
    content: '确定要批量编辑选中的记录吗？'
  },
  editMode: {
    value: 'selected'
  }
}
```

## 技术细节

### 为什么采用混合架构？

1. **BulkEditField 的特殊性**：
   - 需要特殊的值处理逻辑（三种模式）
   - 与现有表单初始化器深度集成
   - 完整实现需要大量额外代码

2. **现有机制的成熟度**：
   - BulkEditActionDecorator 提供完善的弹窗支持
   - useCustomizeBulkEditActionProps 处理复杂的表单提交逻辑
   - BulkEditFormItemInitializers 管理字段添加

3. **架构平滑过渡**：
   - 保持向后兼容
   - 逐步迁移到 FlowModel
   - 降低风险

### 与批量更新的架构差异

**批量更新**（纯 FlowModel）：
```
BulkUpdateActionModel
  └─ AssignFormModel (子模型)
      └─ 字段直接赋值
```

**批量编辑**（混合架构）：
```
BulkEditActionModel (FlowModel层)
  - 提供配置界面
  - 注册模型元数据
  
↓ (委托给)

原有Schema机制
  ├─ BulkEditActionDecorator (弹窗)
  ├─ BulkEditField (字段组件)
  └─ useCustomizeBulkEditActionProps (提交逻辑)
```

## 参考

- `packages/core/client/src/flow/models/base/ActionModel.tsx` - ActionModel 基类
- `packages/plugins/@nocobase/plugin-action-bulk-update/src/client/BulkUpdateActionModel.tsx` - 批量更新参考
- `packages/plugins/@nocobase/plugin-action-bulk-edit/src/client/BulkEditActionDecorator.tsx` - 弹窗装饰器
- `packages/plugins/@nocobase/plugin-action-bulk-edit/src/client/component/BulkEditField.tsx` - 字段组件
- `packages/plugins/@nocobase/plugin-action-bulk-edit/src/client/utils.tsx` - 工具函数


## 实现内容

### BulkEditActionModel

批量编辑操作的 FlowModel 实现，继承自 `ActionModel`。

#### 核心特性

1. **场景设置**: `ActionSceneEnum.collection` - 作用于区块级别（集合操作）
2. **ACL 权限**: `update` - 需要更新权限
3. **默认按钮**: 图标为 `EditOutlined`，标题为 "批量编辑"

#### 子模型

- **assignForm**: `AssignFormModel` - 管理字段赋值配置

#### Flow 注册

##### 配置流 (assignSettings)

配置流用于收集批量编辑的各项参数：

**Steps:**

1. **confirm** - 二次确认
   - 支持开启/关闭
   - 自定义标题和内容
   - 默认关闭

2. **editMode** - 编辑数据范围
   - `selected`: 选中的记录
   - `all`: 全表记录
   - 默认为 `selected`

3. **assignFieldValues** - 字段赋值
   - 使用 `AssignFormModel` 子模型
   - 渲染 `AssignFieldsEditor` 组件
   - 自动注入数据源和集合信息
   - 移除 `record` 上下文（批量操作不基于单条记录）

##### 执行流 (apply)

执行流在点击按钮时触发：

**Handler 流程:**

1. 检查并执行二次确认（如果启用）
2. 验证字段赋值配置
3. 验证集合信息
4. 根据编辑模式执行：
   - **选中模式**: 
     - 获取选中行
     - 构建 filter 条件（使用主键或 filterTargetKey）
     - 调用 API 更新选中记录
   - **全表模式**:
     - 使用 `forceUpdate: true` 更新整表
5. 刷新区块数据
6. 显示成功消息

## 与原版对比

| 功能 | 原版 | FlowModel 版 |
|------|------|--------------|
| 字段编辑 | ✅ BulkEditField 组件 | ✅ AssignFormModel |
| 选中行编辑 | ✅ | ✅ |
| 全表编辑 | ✅ | ✅ |
| 二次确认 | ✅ | ✅ |
| 权限控制 | ✅ | ✅ |
| 多数据源 | ✅ | ✅ |
| 配置界面 | ✅ Schema | ✅ Flow Settings |
| 变量选择 | ❌ | ✅ (通过 AssignFormModel) |

## 优势

1. **统一架构**: 使用 FlowModel 统一架构，与其他操作保持一致
2. **更强扩展性**: 可以轻松添加新的配置步骤或执行逻辑
3. **变量支持**: 通过 AssignFormModel 支持变量表达式
4. **类型安全**: 使用 TypeScript 泛型提供更好的类型提示
5. **配置复用**: 配置参数可以被其他 Flow 复用

## 使用方式

在主插件文件中注册 models：

```typescript
import * as models from './models';

export class PluginActionBulkEditClient extends Plugin {
  async load() {
    // 注册 Flow 模型
    this.app.flowEngine.registerModels(models);
    // ... 其他代码
  }
}
```

## 配置示例

```typescript
// 配置流参数
{
  confirm: {
    enable: true,
    title: '批量编辑',
    content: '确定要批量编辑选中的记录吗？'
  },
  editMode: {
    value: 'selected'
  },
  assignFieldValues: {
    assignedValues: {
      status: 'published',
      updatedAt: '{{$now}}'
    }
  }
}
```

## 技术细节

### AssignFieldsEditor 组件

该组件负责在配置面板中渲染字段赋值编辑器：

- 异步加载 `AssignFormModel` 子模型
- 自动注入数据源和集合上下文
- 回填已保存的字段赋值配置
- 移除 `record` 上下文以适配批量操作场景

### 上下文注入

```typescript
createModelOptions: (ctx) => {
  const dsKey = ctx.collection?.dataSourceKey;
  const collName = ctx.collection?.name;
  const init = dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
  return {
    subModels: {
      assignForm: {
        use: 'AssignFormModel',
        async: true,
        stepParams: { resourceSettings: { init } },
      },
    },
  };
}
```

## 参考

- `packages/core/client/src/flow/models/base/ActionModel.tsx` - ActionModel 基类
- `packages/core/client/src/flow/models/blocks/assign-form/AssignFormModel.tsx` - AssignFormModel
- `packages/plugins/@nocobase/plugin-action-bulk-update/src/client/BulkUpdateActionModel.tsx` - 批量更新参考实现
