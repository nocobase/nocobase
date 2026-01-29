---
title: "使用 importAsync 加载 FullCalendar ESM 模块"
description: "通过 ctx.importAsync 动态导入 FullCalendar 的 ESM 模块并渲染日历。"
---

# 使用 importAsync 加载 FullCalendar ESM 模块

```ts
// 1. 动态导入 FullCalendar 核心模块
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. 动态导入 dayGrid 插件
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. 创建日历容器并渲染
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. 初始化并渲染日历
const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin.default || dayGridPlugin],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth',
  },
});

calendar.render();
```

> 提示：
> - `ctx.importAsync` 适合加载 ESM 模块，返回模块命名空间对象
> - 某些 CDN（如 skypack.dev）会自动处理模块依赖，无需手动配置 importmap
> - 插件模块可能导出为 `default` 或命名导出，需要根据实际情况处理（如 `dayGridPlugin.default || dayGridPlugin`）
