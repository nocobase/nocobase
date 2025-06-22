# Light Components Plugin - 设计文档（简化版）

## 概述

这个插件基于 NocoBase flow-engine API 设计，提供轻量组件管理系统。当前版本是简化版本，专注于跑通基本流程和提供完整的配置体验。

## 架构设计

### 1. 数据结构

#### LightComponents Collection
```json
{
  "key": "string (primary key)",
  "title": "string (required)", 
  "description": "text",
  "template": "string",
  "flows": []
}
```

**说明**：
- 移除了 `config` 字段，简化数据结构
- `template` 为纯字符串，当前支持文本内容
- `flows` 为数组，支持JSON格式配置

### 2. 模型层次

#### LightModel
- **继承**: `FlowModel<LightModelStructure>`
- **职责**: 轻量组件的基础显示
- **当前功能**:
  - 显示组件基本信息
  - 展示模板内容（纯文本显示）
  - 基础的渲染框架（无Card包装）
  - 错误和加载状态处理

#### LightComConfigPageModel
- **继承**: `FlowModel<LightComConfigPageStructure>`
- **职责**: 组件配置页面管理
- **功能**:
  - 双按钮布局：设置模板、配置Flows
  - 预览区域使用 `FlowModelRenderer` 渲染
  - 模板编辑器（简化版，纯文本）
  - Flow配置器（JSON编辑）
  - 数据加载和保存管理

### 3. Flow 系统（简化版）

#### LightComConfigPageModel Flow
- **default**: 自动执行的初始化流程
  - 步骤1: loadData - 加载组件数据并创建预览组件

#### LightModel
- 继承自 `FlowModel`，支持完整的 Flow 功能
- 专注于基础显示功能

## 当前实现

### 1. 配置页面结构
```
┌─ 配置 Sample Component ──────────────────┐
│ [设置模板] [配置Flows]                     │
├──────────────────────────────────────────┤
│                                          │
│     预览区域（FlowModelRenderer）          │
│      - 支持Flow设置                       │
│      - 隐藏删除按钮                       │
│      - 支持step参数配置                    │
│                                          │
└──────────────────────────────────────────┘
```

### 2. 模板编辑器（简化版）
- 纯文本编辑器
- 基础的textarea界面
- 独立的保存按钮
- 在抽屉中编辑

### 3. Flow配置器（简化版）  
- JSON格式编辑
- 基础的textarea界面
- JSON格式验证
- 独立的保存按钮

### 4. 预览功能
- 使用 `FlowModelRenderer` 渲染
- `showFlowSettings={true}` 支持Flow设置
- `hideRemoveInSettings={true}` 隐藏删除按钮
- 实时更新组件属性

### 5. 已完成的功能
- ✅ 基本的配置界面布局
- ✅ 简单的编辑器
- ✅ 预览区域展示
- ✅ 数据加载和保存
- ✅ TypeScript类型安全
- ✅ 删除功能修复
- ✅ 面包屑标题显示

## 使用流程

### 1. 开发者使用
1. 创建新的轻量组件
2. 编写简单的组件模板（当前为纯文本）
3. 配置 Flow 参数（可选，JSON格式）
4. 实时预览效果
5. 保存配置

### 2. 预览体验
```typescript
// 预览区域使用FlowModelRenderer
<FlowModelRenderer 
  model={this.subModels.previewComponent} 
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>
```

### 3. 最终用户使用
```jsx
<LightComponentBlock 
  componentKey="my-chart-component"
/>
```

## 技术实现

### 1. 类型安全

#### LightComponentProps
```typescript
interface LightComponentProps {
  loading?: boolean;
  error?: string;
  componentKey?: string;
  template?: string;
  title?: string;
}
```

#### LightComConfigPageStructure
```typescript
interface LightComConfigPageStructure extends DefaultStructure {
  subModels?: {
    previewComponent?: FlowModel<DefaultStructure>;
  };
}
```

### 2. 核心方法

#### 配置页面管理
```typescript
// 数据加载
loadComponentData(): Promise<void>
updatePreviewComponent(): void

// 抽屉管理
openTemplateDrawer(): void
closeTemplateDrawer(): void
openFlowsDrawer(): void
closeFlowsDrawer(): void

// 数据更新
updateTemplate(template: string): void
updateFlows(flows: any[]): void
saveConfiguration(): Promise<void>
```

#### 组件渲染
```typescript
// LightModel渲染
render(): JSX.Element {
  return (
    <div className="light-component-container">
      {template ? (
        // 显示模板内容
      ) : (
        // 显示暂无内容
      )}
    </div>
  );
}
```

### 3. Flow注册

#### 配置页面初始化Flow
```typescript
LightComConfigPageModel.registerFlow({
  key: 'default',
  title: 'Initialize Config Page',
  auto: true,
  steps: {
    loadData: {
      handler: async (ctx, params) => {
        // 加载组件数据
        // 创建预览组件
        // 设置组件属性
      }
    }
  }
});
```

### 4. 模型注册

```typescript
// 注册到flow-engine
this.flowEngine.registerModels({ 
  'LightModel': LightModel,
  'LightComConfigPageModel': LightComConfigPageModel,
});
```

## 用户界面

### 1. 列表页面功能
- 创建组件：`useCreateActionProps`
- 删除组件：`useDeleteAction`
- 批量删除：`useBulkDestroyAction`
- 数据分页和过滤

### 2. 配置页面功能
- 面包屑导航：显示 "Light Components / Configure {title}"
- 设置模板：抽屉式编辑器
- 配置Flows：JSON编辑器
- 实时预览：FlowModelRenderer

### 3. 错误处理
- 加载状态显示
- 错误信息展示
- 数据验证
- TypeScript类型检查

## 扩展性

### 1. 新 Action 注册
```typescript
const customAction: ActionDefinition<LightModel> = {
  name: 'customAction',
  title: 'Custom Action',
  handler: async (ctx, params) => {
    // 自定义逻辑
  },
};

flowEngine.registerAction(customAction);
```

### 2. 新 Flow 定义
```typescript
LightModel.registerFlow({
  key: 'custom',
  title: 'Custom Flow',
  auto: false,
  steps: {
    step1: { use: 'customAction' }
  }
});
```

## 最佳实践

### 1. 模板编写
- 当前版本使用纯文本
- 保持内容简洁
- 后续版本支持HTML/CSS/JS

### 2. 性能优化
- 控制模板复杂度
- 避免内存泄漏
- 优化预览更新频率

### 3. 安全考虑
- 验证用户输入
- JSON格式校验
- 防止XSS攻击

### 4. 开发规范
- 使用TypeScript类型
- 避免使用`any`类型
- 遵循Flow-Engine模式
- 完善错误处理

## 设计优势

### 1. **简化的数据结构**
- 移除了复杂的`config`字段
- 统一的`template`字符串
- 最小化字段数量，只保留核心功能
- 易于理解和维护

### 2. **直观的用户体验**
- 双按钮布局（设置模板、配置Flows）
- 分离的模板和Flow配置界面
- FlowModelRenderer实时预览
- 抽屉式编辑体验

### 3. **强大的Flow集成**
- 基于flow-engine的标准化架构
- 支持完整的Flow设置界面
- step参数配置支持
- 预览区域实时交互

### 4. **完整的类型安全**
- TypeScript类型检查
- 接口定义明确
- 避免运行时错误
- 开发体验友好

### 5. **可靠的错误处理**
- 完善的加载状态
- 错误信息展示
- 数据验证机制
- 用户友好的提示

## 总结

这个简化版本完全实现了轻量组件系统的基础目标：

1. **简单易用**: 双按钮配置界面，直观的操作流程
2. **功能完整**: 支持模板编辑、Flow配置、实时预览
3. **架构清晰**: 基于flow-engine的标准化设计
4. **类型安全**: 完整的TypeScript支持
5. **扩展友好**: 标准的Flow和Action注册机制

插件现在提供了一个完整的轻量组件管理系统，既满足了快速开发的需求，又保持了NocoBase平台的一致性和可扩展性。通过FlowModelRenderer的集成，预览功能具备了完整的Flow交互能力，为后续的功能扩展奠定了坚实基础。