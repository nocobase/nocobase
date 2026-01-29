---
title: "使用 FullCalendar 渲染日历"
description: "通过 ctx.requireAsync 加载 FullCalendar 库并渲染日历组件。"
---

# 使用 FullCalendar 渲染日历

```ts
// 1. 加载 FullCalendar 库（UMD 格式）
await ctx.requireAsync('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.global.min.js');

// 2. 创建日历容器
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.element.append(calendarEl);

// 3. 初始化并渲染日历
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  // 可以添加更多配置，如事件、日期选择等
  // events: [...],
  // dateClick: (info) => { ... },
});

calendar.render();
```

> 提示：
> - `ctx.requireAsync` 适合加载 UMD/全局库（如 FullCalendar、jQuery 插件等）
> - 加载后，库会挂载到全局对象（如 `window.FullCalendar`），可直接使用
> - 若库提供 ESM 版本，也可以使用 `ctx.importAsync` 加载
