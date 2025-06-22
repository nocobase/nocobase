# @nocobase/plugin-light-components

[![npm](https://img.shields.io/npm/v/@nocobase/plugin-light-components.svg?style=flat-square)](https://www.npmjs.com/package/@nocobase/plugin-light-components)

轻量组件插件，基于 NocoBase flow-engine API 实现的自定义组件系统（简化版）。

## 功能特性

- **组件管理**: 支持创建、编辑、删除轻量组件
- **模板编辑**: 简单的文本模板编辑器
- **Flow配置**: JSON格式的Flow配置编辑器
- **实时预览**: 配置页面实时预览组件效果
- **TypeScript**: 完整的类型安全支持

## 开发状态

✅ **当前版本功能完成**

- ✅ 基本的数据模型和存储 
- ✅ 组件列表管理（增删改查）
- ✅ 配置页面（设置模板、配置Flows）
- ✅ 实时预览功能
- ✅ TypeScript类型安全
- ✅ 删除功能修复

## 安装

```bash
npm install @nocobase/plugin-light-components
```

或者通过 NocoBase 插件管理器安装。

## 使用方法

### 1. 管理轻量组件

访问插件设置页面 `/admin/settings/light-components` 来管理轻量组件：

- 创建新的轻量组件
- 编辑组件基本信息（标题、描述）  
- 配置组件模板和Flow
- 删除不需要的组件

### 2. 配置轻量组件

点击"配置"进入组件配置页面：

```
┌─ 配置 Sample Component ──────────────────┐
│ [设置模板] [配置Flows]                     │
├──────────────────────────────────────────┤
│                                          │
│         预览区域（支持Flow设置）            │
│      (FlowModelRenderer渲染)             │
│                                          │
└──────────────────────────────────────────┘
```

- **设置模板**: 编辑组件模板内容（当前支持纯文本）
- **配置Flows**: 编辑Flow配置（JSON格式）
- **实时预览**: 使用FlowModelRenderer显示组件，支持Flow设置和step参数配置

### 3. 模板编写

当前版本使用简单的文本模板：

```text
这是一个示例组件模板
可以包含任意文本内容
后续版本会支持HTML、CSS、JavaScript
```

### 4. Flow配置

使用JSON格式配置Flow：

```json
[
  {
    "key": "default",
    "title": "Default Flow",
    "auto": true,
    "steps": {
      "step1": {
        "use": "someAction"
      }
    }
  }
]
```

### 5. 使用组件

在React代码中使用：

```jsx
import { LightComponentBlock } from '@nocobase/plugin-light-components';

<LightComponentBlock 
  componentKey="my-sample-component"
/>
```

## 架构设计

### 数据结构

轻量组件数据存储在 `lightComponents` 集合中：

```json
{
  "key": "string (primary key)",
  "title": "string (required)", 
  "description": "text",
  "template": "string",
  "flows": []
}
```

### 核心模型

- **LightModel**: 继承 `FlowModel`，负责组件渲染
- **LightComConfigPageModel**: 继承 `FlowModel`，负责配置页面管理

### 组件层次

```
LightComConfigPageModel (配置页面)
├── 设置模板 (Drawer)
├── 配置Flows (Drawer)  
└── 预览区域
    └── LightModel (通过FlowModelRenderer渲染)
```

### 主要功能

1. **配置页面管理**
   - `loadComponentData()`: 加载组件数据
   - `updatePreviewComponent()`: 更新预览组件
   - `saveConfiguration()`: 保存配置

2. **模板和Flow编辑**
   - `openTemplateDrawer()`: 打开模板编辑器
   - `openFlowsDrawer()`: 打开Flow编辑器
   - `updateTemplate()`: 更新模板内容
   - `updateFlows()`: 更新Flow配置

3. **组件渲染**
   - `LightModel.render()`: 渲染组件内容
   - 支持模板显示
   - 错误和加载状态处理

### API接口

- `GET /api/lightComponents`: 获取组件列表
- `POST /api/lightComponents`: 创建组件
- `GET /api/lightComponents/:key`: 获取单个组件
- `PUT /api/lightComponents/:key`: 更新组件
- `DELETE /api/lightComponents/:key`: 删除组件

## 技术实现

### 类型安全

```typescript
interface LightComponentProps {
  loading?: boolean;
  error?: string;
  componentKey?: string;
  template?: string;
  title?: string;
}

interface LightComConfigPageStructure extends DefaultStructure {
  subModels?: {
    previewComponent?: FlowModel<DefaultStructure>;
  };
}
```

### Flow-Engine集成

```typescript
// 模型注册
this.flowEngine.registerModels({ 
  'LightModel': LightModel,
  'LightComConfigPageModel': LightComConfigPageModel,
});

// Flow注册
LightComConfigPageModel.registerFlow({
  key: 'default',
  title: 'Initialize Config Page',
  auto: true,
  steps: {
    loadData: {
      handler: async (ctx, params) => {
        // 加载组件数据逻辑
      }
    }
  }
});
```

### 预览功能

```typescript
// 使用FlowModelRenderer渲染预览
<FlowModelRenderer 
  model={this.subModels.previewComponent} 
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>
```

## 开发说明

### 项目结构

```
src/
├── client/
│   ├── components/          # React组件
│   │   ├── LightComponentsManagement.tsx    # 列表管理页面
│   │   ├── LightComponentConfigPage.tsx     # 配置页面
│   │   └── LightComponentBlock.tsx          # 组件块
│   ├── models/              # Flow模型
│   │   ├── LightModel.tsx                   # 组件模型
│   │   └── LightComConfigPageModel.tsx      # 配置页面模型
│   ├── hooks/               # React hooks
│   │   ├── useCreateActionProps.ts          # 创建操作
│   │   ├── useDeleteAction.ts               # 删除操作
│   │   └── useBulkDestroyAction.ts          # 批量删除
│   ├── schemas/             # UI架构定义
│   └── locale/              # 国际化
└── server/
    ├── collections/         # 数据库集合定义
    └── index.ts            # 服务器入口
```

### 最佳实践

1. **类型安全**: 使用TypeScript，避免使用`any`类型
2. **组件复用**: 利用FlowModel和FlowModelRenderer的标准化架构
3. **错误处理**: 完善的加载状态和错误状态处理
4. **用户体验**: 实时预览和抽屉式编辑界面

## 贡献

欢迎提交 Issue 和 Pull Request 来改进此插件。

## 许可证

本项目采用 AGPL-3.0 和 NocoBase Commercial License 双重许可。