---
nav:
  path: /client
group:
  path: /schema-components
---

# Kanban <Badge>待定</Badge>

## 参数说明

* dataSource 数据源
* groupField 分组字段，dataSource 以哪个字段作为分组
* useDataSource，动态数据源
* useGroupField，动态的分组字段

## 示例

### 静态数据

<code src="./demos/demo1.tsx" />

```ts
{
  'x-component': 'Kanban',
  'x-component-props': {
    dataSource: [],
    groupField: {
      name: 'status',
      enum: [
        { label: '进行中', value: 'running' }
        { label: '已完成', value: 'done',  }
      ],
    },
  },
}
```

### 动态数据

```ts
{
  'x-component': 'Kanban',
  'x-component-props': {
    useDataSource: (options) => {
      // 与表格、日历类似
      return useRequest(() => Promise.resolve({ data: [] }), options);
    },
    useGroupField: () => {
      // 从上下文获取
      return {
        name: 'status',
        enum: [
          { label: '进行中', value: 'running' }
          { label: '已完成', value: 'done',  }
        ],
      },
    },
  },
}
```

### 特殊节点

* Kanban. Card 卡片的 schema
* Kanban. CardViewer 卡片点击打开的详情
* Kanban. CardAdder 添加卡片的按钮

```ts
{
  'x-component': 'Kanban',
  'x-component-props': {
    dataSource: [],
    groupField: {
      name: 'status',
      enum: [
        { label: '进行中', value: 'running' }
        { label: '已完成', value: 'done',  }
      ],
    },
  },
  properties: {
    card: {
      'x-component': 'Kanban.Card',
    },
    viewer: {
      'x-component': 'Kanban.CardViewer',
    },
    adder: {
      'x-component': 'Kanban.CardAdder',
    },
  }
}
```
