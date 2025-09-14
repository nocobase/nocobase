# 日历插件示例

## 概述

日历插件 (`@nocobase/plugin-calendar`) 提供了日历数据表模板和区块，用于管理日期数据，通常用于事件、约会、任务等与日期/时间相关的信息。

## 功能特性

- 提供日历数据表模板
- 支持日历区块展示
- 集成中国农历支持
- 支持重复事件配置
- 与 NocoBase 数据表无缝集成

## 安装和启用

```bash
yarn add @nocobase/plugin-calendar
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import CalendarPlugin from '@nocobase/plugin-calendar';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(CalendarPlugin);
  }
}
```

## 基本使用

### 1. 创建日历数据表

```ts
// src/server/calendar-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const calendarCollection: CollectionOptions = {
  name: 'events',
  title: '事件',
  template: 'calendar', // 使用日历模板
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题'
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
      type: 'string',
      name: 'description',
      title: '描述'
    }
  ]
};
```

### 2. 在页面中使用日历区块

```tsx
// src/client/pages/CalendarPage.tsx
import React from 'react';
import { CalendarBlock } from '@nocobase/plugin-calendar/client';

export default function CalendarPage() {
  return (
    <CalendarBlock
      collection="events"
      startDate="startDate"
      endDate="endDate"
      title="title"
      description="description"
    />
  );
}
```

## 高级用法

### 1. 自定义日历视图

```tsx
// src/client/components/CustomCalendar.tsx
import React from 'react';
import { CalendarBlock } from '@nocobase/plugin-calendar/client';

export default function CustomCalendar() {
  return (
    <CalendarBlock
      collection="events"
      startDate="startDate"
      endDate="endDate"
      title="title"
      description="description"
      views={['month', 'week', 'day']} // 自定义视图
      defaultView="week" // 默认视图
      selectable={true} // 是否可选择日期
      onSelectSlot={(slotInfo) => {
        // 处理日期选择事件
        console.log('Selected slot:', slotInfo);
      }}
    />
  );
}
```

### 2. 集成农历支持

```ts
// src/server/lunar-support.ts
import { Lunar } from '@nocobase/plugin-calendar';

export function getLunarDate(date: Date) {
  return Lunar.toLunar(date);
}
```

## 最佳实践

1. **数据建模**：
   - 合理设计事件数据结构
   - 使用适当的字段类型存储日期信息
   - 考虑时区处理

2. **用户体验**：
   - 提供清晰的事件创建和编辑界面
   - 支持拖拽调整事件时间
   - 实现事件提醒功能

3. **性能优化**：
   - 对大量事件数据进行分页加载
   - 使用缓存机制提高渲染性能
   - 实现懒加载机制

## 扩展示例

### 1. 任务管理系统

```ts
// src/server/task-collection.ts
export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '任务',
  template: 'calendar',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务标题'
    },
    {
      type: 'date',
      name: 'dueDate',
      title: '截止日期'
    },
    {
      type: 'boolean',
      name: 'completed',
      title: '已完成'
    },
    {
      type: 'string',
      name: 'priority',
      title: '优先级',
      defaultValue: 'medium'
    }
  ]
};
```

### 2. 带提醒功能的日历

```tsx
// src/client/components/ReminderCalendar.tsx
import React, { useEffect } from 'react';
import { CalendarBlock } from '@nocobase/plugin-calendar/client';
import { useNotification } from '@nocobase/client';

export default function ReminderCalendar() {
  const { notification } = useNotification();
  
  useEffect(() => {
    // 检查即将到来的任务并发送提醒
    const checkReminders = () => {
      // 实现提醒逻辑
    };
    
    const interval = setInterval(checkReminders, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, []);
  
  return (
    <CalendarBlock
      collection="tasks"
      startDate="dueDate"
      title="title"
    />
  );
}
```

## 常见问题

### 1. 时区处理

确保正确处理不同时区的日期显示：

```ts
// src/utils/timezone.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function convertToTimezone(date: Date, tz: string) {
  return dayjs(date).tz(tz).toDate();
}
```

### 2. 重复事件处理

对于重复事件，需要特殊处理：

```ts
// src/server/recurring-events.ts
export function generateRecurringEvents(baseEvent, recurrenceRule) {
  // 实现重复事件生成逻辑
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/calendar)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/calendar)