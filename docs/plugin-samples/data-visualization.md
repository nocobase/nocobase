# 数据可视化插件示例

## 概述

数据可视化插件 (`@nocobase/plugin-data-visualization`) 是 NocoBase 中用于创建图表和数据可视化的重要插件。它提供了丰富的图表类型和灵活的配置选项，可以满足各种数据展示需求。

## 功能特性

- 支持多种图表类型（折线图、面积图、柱状图等）
- 提供图表区块和图表筛选区块
- 可扩展的图表类型系统
- 与 NocoBase 数据表无缝集成
- 支持自定义图表配置

## 安装和启用

```bash
yarn add @nocobase/plugin-data-visualization
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import DataVisualizationPlugin from '@nocobase/plugin-data-visualization';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(DataVisualizationPlugin);
  }
}
```

## 基本使用

### 1. 创建图表区块

在客户端组件中使用图表区块：

```tsx
// src/client/pages/MyPage.tsx
import React from 'react';
import { ChartBlock } from '@nocobase/plugin-data-visualization/client';

export default function MyPage() {
  return (
    <ChartBlock
      collection="users"
      type="line"
      xAxis="createdAt"
      yAxis="count"
      query={{
        // 查询条件
      }}
    />
  );
}
```

### 2. 配置图表数据源

```ts
// src/server/chart-config.ts
import { ChartType } from '@nocobase/plugin-data-visualization';

export const chartConfig: ChartType = {
  name: 'user-growth',
  title: '用户增长图表',
  collection: 'users',
  type: 'line',
  xAxis: 'createdAt',
  yAxis: 'count',
  query: {
    // 自定义查询逻辑
  }
};
```

## 高级用法

### 1. 自定义图表类型

```ts
// src/server/custom-chart.ts
import { ChartType, registerChartType } from '@nocobase/plugin-data-visualization';

class CustomChart implements ChartType {
  name = 'custom-chart';
  title = '自定义图表';
  
  async render(data, config) {
    // 自定义渲染逻辑
    return {
      type: 'custom',
      data,
      options: config.options
    };
  }
}

// 注册自定义图表类型
registerChartType(new CustomChart());
```

### 2. 图表筛选器

```tsx
// src/client/components/ChartFilter.tsx
import React from 'react';
import { ChartFilterBlock } from '@nocobase/plugin-data-visualization/client';

export default function ChartFilter() {
  return (
    <ChartFilterBlock
      collection="orders"
      field="status"
      type="select"
      options={[
        { label: '待处理', value: 'pending' },
        { label: '已完成', value: 'completed' }
      ]}
    />
  );
}
```

## 最佳实践

1. **性能优化**：
   - 合理设置查询条件，避免加载大量数据
   - 使用缓存机制提高图表渲染性能
   - 对大数据集进行分页或采样处理

2. **用户体验**：
   - 提供清晰的图表标题和说明
   - 使用合适的颜色搭配和视觉元素
   - 支持响应式设计，适配不同屏幕尺寸

3. **数据安全**：
   - 确保图表数据遵循访问控制规则
   - 对敏感数据进行脱敏处理
   - 实施适当的权限控制

## 扩展示例

### 1. 创建仪表板页面

```tsx
// src/client/pages/Dashboard.tsx
import React from 'react';
import { ChartBlock, ChartFilterBlock } from '@nocobase/plugin-data-visualization/client';

export default function Dashboard() {
  return (
    <div>
      <h1>数据仪表板</h1>
      <ChartFilterBlock
        collection="sales"
        field="dateRange"
        type="date"
      />
      <div style={{ display: 'flex' }}>
        <ChartBlock
          collection="sales"
          type="line"
          xAxis="date"
          yAxis="amount"
        />
        <ChartBlock
          collection="sales"
          type="bar"
          xAxis="product"
          yAxis="quantity"
        />
      </div>
    </div>
  );
}
```

### 2. 自定义主题

```ts
// src/server/chart-theme.ts
import { ChartTheme } from '@nocobase/plugin-data-visualization';

export const customTheme: ChartTheme = {
  colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
};
```

## 常见问题

### 1. 图表不显示数据

检查以下几点：
- 确认数据表和字段名称正确
- 验证查询条件是否返回了数据
- 检查是否有权限访问相关数据

### 2. 性能问题

对于大数据集：
- 使用服务端分页
- 实现数据采样
- 添加加载状态提示

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/data-visualization)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/data-visualization)