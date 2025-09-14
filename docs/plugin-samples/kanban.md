# 看板插件示例

## 概述

看板插件 (`@nocobase/plugin-kanban`) 提供了看板区块，用于任务和项目管理。它采用看板方法，通过可视化的方式帮助团队更好地组织和跟踪工作流程。

## 功能特性

- 提供看板区块组件
- 支持多列布局（待办、进行中、已完成等）
- 支持拖拽任务卡片
- 与 NocoBase 数据表无缝集成
- 支持自定义列和卡片样式

## 安装和启用

```bash
yarn add @nocobase/plugin-kanban
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import KanbanPlugin from '@nocobase/plugin-kanban';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(KanbanPlugin);
  }
}
```

## 基本使用

### 1. 创建任务数据表

```ts
// src/server/task-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务标题'
    },
    {
      type: 'string',
      name: 'description',
      title: '任务描述'
    },
    {
      type: 'string',
      name: 'status',
      title: '状态',
      defaultValue: 'todo'
    },
    {
      type: 'string',
      name: 'priority',
      title: '优先级'
    },
    {
      type: 'date',
      name: 'dueDate',
      title: '截止日期'
    }
  ]
};
```

### 2. 在页面中使用看板区块

```tsx
// src/client/pages/KanbanPage.tsx
import React from 'react';
import { KanbanBlock } from '@nocobase/plugin-kanban/client';

export default function KanbanPage() {
  return (
    <KanbanBlock
      collection="tasks"
      groupField="status"
      titleField="title"
      descriptionField="description"
      statusOptions={[
        { value: 'todo', label: '待办' },
        { value: 'in-progress', label: '进行中' },
        { value: 'review', label: '审核中' },
        { value: 'done', label: '已完成' }
      ]}
    />
  );
}
```

## 高级用法

### 1. 自定义看板卡片

```tsx
// src/client/components/CustomKanbanCard.tsx
import React from 'react';
import { KanbanBlock, KanbanCardProps } from '@nocobase/plugin-kanban/client';

const CustomCard: React.FC<KanbanCardProps> = ({ record }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h4>{record.title}</h4>
      <p>{record.description}</p>
      <div>
        <span style={{ 
          backgroundColor: getPriorityColor(record.priority),
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {record.priority}
        </span>
        {record.dueDate && (
          <span style={{ marginLeft: '8px', fontSize: '12px' }}>
            {formatDate(record.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#9e9e9e';
  }
}

export default function CustomKanban() {
  return (
    <KanbanBlock
      collection="tasks"
      groupField="status"
      cardComponent={CustomCard}
      statusOptions={[
        { value: 'todo', label: '待办' },
        { value: 'in-progress', label: '进行中' },
        { value: 'review', label: '审核中' },
        { value: 'done', label: '已完成' }
      ]}
    />
  );
}
```

### 2. 多维度看板

```tsx
// src/client/components/MultiDimensionKanban.tsx
import React from 'react';
import { KanbanBlock } from '@nocobase/plugin-kanban/client';

export default function MultiDimensionKanban() {
  return (
    <div>
      <h2>按优先级分组</h2>
      <KanbanBlock
        collection="tasks"
        groupField="priority"
        titleField="title"
        statusOptions={[
          { value: 'high', label: '高优先级' },
          { value: 'medium', label: '中优先级' },
          { value: 'low', label: '低优先级' }
        ]}
      />
      
      <h2>按状态分组</h2>
      <KanbanBlock
        collection="tasks"
        groupField="status"
        titleField="title"
        statusOptions={[
          { value: 'todo', label: '待办' },
          { value: 'in-progress', label: '进行中' },
          { value: 'review', label: '审核中' },
          { value: 'done', label: '已完成' }
        ]}
      />
    </div>
  );
}
```

## 最佳实践

1. **数据建模**：
   - 合理设计任务数据结构
   - 使用枚举类型定义状态和优先级
   - 考虑任务关联关系

2. **用户体验**：
   - 提供直观的拖拽操作
   - 支持快速创建和编辑任务
   - 实现任务状态的实时更新

3. **性能优化**：
   - 对大量任务数据进行分页加载
   - 使用虚拟滚动提高渲染性能
   - 实现懒加载机制

## 扩展示例

### 1. 带标签的任务看板

```ts
// src/server/task-with-tags.ts
export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务标题'
    },
    {
      type: 'string',
      name: 'status',
      title: '状态'
    },
    {
      type: 'belongsToMany',
      name: 'tags',
      title: '标签',
      target: 'tags',
      through: 'taskTags'
    }
  ]
};

export const tagCollection: CollectionOptions = {
  name: 'tags',
  title: '标签',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '标签名称'
    },
    {
      type: 'string',
      name: 'color',
      title: '颜色'
    }
  ]
};
```

```tsx
// src/client/components/TaggedKanban.tsx
import React from 'react';
import { KanbanBlock } from '@nocobase/plugin-kanban/client';

const TaggedCard: React.FC<KanbanCardProps> = ({ record }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h4>{record.title}</h4>
      <div>
        {record.tags?.map(tag => (
          <span 
            key={tag.id}
            style={{ 
              backgroundColor: tag.color,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              marginRight: '4px'
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function TaggedKanban() {
  return (
    <KanbanBlock
      collection="tasks"
      groupField="status"
      cardComponent={TaggedCard}
      statusOptions={[
        { value: 'todo', label: '待办' },
        { value: 'in-progress', label: '进行中' },
        { value: 'review', label: '审核中' },
        { value: 'done', label: '已完成' }
      ]}
    />
  );
}
```

### 2. 时间跟踪看板

```ts
// src/server/timed-task.ts
export const timedTaskCollection: CollectionOptions = {
  name: 'timedTasks',
  title: '计时任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务标题'
    },
    {
      type: 'string',
      name: 'status',
      title: '状态'
    },
    {
      type: 'date',
      name: 'startedAt',
      title: '开始时间'
    },
    {
      type: 'date',
      name: 'completedAt',
      title: '完成时间'
    },
    {
      type: 'integer',
      name: 'estimatedHours',
      title: '预估工时'
    }
  ]
};
```

```tsx
// src/client/components/TimedKanban.tsx
import React from 'react';
import { KanbanBlock } from '@nocobase/plugin-kanban/client';

const TimedCard: React.FC<KanbanCardProps> = ({ record }) => {
  const timeSpent = record.startedAt && record.completedAt ? 
    Math.round((new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime()) / (1000 * 60 * 60)) : 0;
    
  const progress = record.estimatedHours ? Math.min(100, (timeSpent / record.estimatedHours) * 100) : 0;

  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h4>{record.title}</h4>
      <div>
        <div style={{ fontSize: '12px' }}>
          预估: {record.estimatedHours || 0}小时 | 
          已用: {timeSpent}小时
        </div>
        <div style={{ width: '100%', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '4px' }}>
          <div 
            style={{ 
              width: `${progress}%`, 
              backgroundColor: progress > 100 ? '#f44336' : '#4caf50', 
              height: '8px', 
              borderRadius: '4px' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function TimedKanban() {
  return (
    <KanbanBlock
      collection="timedTasks"
      groupField="status"
      cardComponent={TimedCard}
      statusOptions={[
        { value: 'todo', label: '待办' },
        { value: 'in-progress', label: '进行中' },
        { value: 'review', label: '审核中' },
        { value: 'done', label: '已完成' }
      ]}
    />
  );
}
```

## 常见问题

### 1. 拖拽性能优化

```tsx
// src/client/components/OptimizedKanban.tsx
import React from 'react';
import { KanbanBlock } from '@nocobase/plugin-kanban/client';

export default function OptimizedKanban() {
  return (
    <KanbanBlock
      collection="tasks"
      groupField="status"
      titleField="title"
      virtualization={true} // 启用虚拟化
      itemHeight={100} // 设置卡片高度
      overscan={3} // 设置预渲染数量
      statusOptions={[
        { value: 'todo', label: '待办' },
        { value: 'in-progress', label: '进行中' },
        { value: 'review', label: '审核中' },
        { value: 'done', label: '已完成' }
      ]}
    />
  );
}
```

### 2. 权限控制

```ts
// src/server/kanban-permissions.ts
import { CollectionOptions } from '@nocobase/database';

export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '任务',
  fields: [
    // 字段定义
  ],
  // 添加权限控制
  acl: {
    // 只允许创建者编辑自己的任务
    'edit': {
      condition: {
        createdBy: '{{ currentUser.id }}'
      }
    }
  }
};
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/block-kanban)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/kanban)
