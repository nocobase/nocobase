# 甘特图插件示例

## 概述

甘特图插件 (`@nocobase/plugin-gantt`) 提供了甘特图区块，用于项目管理和任务进度可视化。它可以帮助团队更好地规划、跟踪和管理项目进度。

## 功能特性

- 提供甘特图区块组件
- 支持任务依赖关系展示
- 支持时间轴缩放和导航
- 与 NocoBase 数据表无缝集成
- 支持自定义任务样式

## 安装和启用

```bash
yarn add @nocobase/plugin-gantt
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import GanttPlugin from '@nocobase/plugin-gantt';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(GanttPlugin);
  }
}
```

## 基本使用

### 1. 创建项目任务数据表

```ts
// src/server/project-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const projectCollection: CollectionOptions = {
  name: 'tasks',
  title: '项目任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务名称'
    },
    {
      type: 'date',
      name: 'startDate',
      title: '开始日期'
    },
    {
      type: 'date',
      name: 'endDate',
      title: '结束日期'
    },
    {
      type: 'belongsTo',
      name: 'parent',
      title: '父任务',
      target: 'tasks'
    },
    {
      type: 'hasMany',
      name: 'children',
      title: '子任务',
      target: 'tasks'
    },
    {
      type: 'string',
      name: 'status',
      title: '状态'
    }
  ]
};
```

### 2. 在页面中使用甘特图区块

```tsx
// src/client/pages/ProjectPage.tsx
import React from 'react';
import { GanttBlock } from '@nocobase/plugin-gantt/client';

export default function ProjectPage() {
  return (
    <GanttBlock
      collection="tasks"
      startDate="startDate"
      endDate="endDate"
      title="title"
      parent="parent"
      children="children"
    />
  );
}
```

## 高级用法

### 1. 自定义甘特图样式

```tsx
// src/client/components/CustomGantt.tsx
import React from 'react';
import { GanttBlock } from '@nocobase/plugin-gantt/client';

export default function CustomGantt() {
  return (
    <GanttBlock
      collection="tasks"
      startDate="startDate"
      endDate="endDate"
      title="title"
      parent="parent"
      children="children"
      taskStyle={(task) => {
        // 根据任务状态自定义样式
        switch (task.status) {
          case 'completed':
            return { backgroundColor: '#4caf50' };
          case 'in-progress':
            return { backgroundColor: '#2196f3' };
          case 'delayed':
            return { backgroundColor: '#f44336' };
          default:
            return { backgroundColor: '#9e9e9e' };
        }
      }}
    />
  );
}
```

### 2. 任务依赖关系

```ts
// src/server/task-dependencies.ts
export const taskWithDependencies: CollectionOptions = {
  name: 'tasks',
  title: '项目任务',
  fields: [
    // ... 其他字段
    {
      type: 'hasMany',
      name: 'dependencies',
      title: '依赖任务',
      target: 'tasks',
      through: 'taskDependencies'
    }
  ]
};
```

## 最佳实践

1. **数据建模**：
   - 合理设计任务数据结构
   - 明确任务之间的依赖关系
   - 使用适当的字段类型存储日期信息

2. **用户体验**：
   - 提供清晰的任务创建和编辑界面
   - 支持拖拽调整任务时间
   - 实现任务状态的实时更新

3. **性能优化**：
   - 对大量任务数据进行分页加载
   - 使用虚拟滚动提高渲染性能
   - 实现懒加载机制

## 扩展示例

### 1. 多项目管理

```ts
// src/server/multi-project.ts
export const projectCollection: CollectionOptions = {
  name: 'projects',
  title: '项目',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '项目名称'
    }
  ]
};

export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '项目任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务名称'
    },
    {
      type: 'date',
      name: 'startDate',
      title: '开始日期'
    },
    {
      type: 'date',
      name: 'endDate',
      title: '结束日期'
    },
    {
      type: 'belongsTo',
      name: 'project',
      title: '所属项目',
      target: 'projects'
    }
  ]
};
```

### 2. 带资源分配的甘特图

```tsx
// src/client/components/ResourceGantt.tsx
import React from 'react';
import { GanttBlock } from '@nocobase/plugin-gantt/client';

export default function ResourceGantt() {
  return (
    <GanttBlock
      collection="tasks"
      startDate="startDate"
      endDate="endDate"
      title="title"
      resources={[
        { id: 'dev1', name: '开发人员1' },
        { id: 'dev2', name: '开发人员2' },
        { id: 'designer1', name: '设计师1' }
      ]}
      onTaskChange={(task, changes) => {
        // 处理任务变更
        console.log('Task changed:', task, changes);
      }}
    />
  );
}
```

## 常见问题

### 1. 任务时间冲突检测

```ts
// src/utils/conflict-detection.ts
export function detectTimeConflicts(tasks) {
  // 实现时间冲突检测逻辑
  return tasks.filter(task => {
    // 检查与其他任务的时间冲突
  });
}
```

### 2. 性能优化

对于大型项目：

```tsx
// src/client/components/OptimizedGantt.tsx
import React from 'react';
import { GanttBlock } from '@nocobase/plugin-gantt/client';

export default function OptimizedGantt() {
  return (
    <GanttBlock
      collection="tasks"
      startDate="startDate"
      endDate="endDate"
      title="title"
      virtualization={true} // 启用虚拟化
      rowHeight={30} // 设置行高
      overscan={5} // 设置预渲染行数
    />
  );
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/block-gantt)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/gantt)
