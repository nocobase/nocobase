---
title: "Render a Calendar with FullCalendar"
description: "Load the FullCalendar library via ctx.requireAsync and render a calendar component."
---

# Render a Calendar with FullCalendar

```ts
// 1. Load the FullCalendar library (UMD format)
await ctx.requireAsync('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.global.min.js');

// 2. Create a calendar container
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.element.append(calendarEl);

// 3. Initialize and render the calendar
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  // Add more options like events and date selection
  // events: [...],
  // dateClick: (info) => { ... },
});

calendar.render();
```

> Tip:
> - `ctx.requireAsync` is suitable for UMD/global libraries (e.g., FullCalendar, jQuery plugins)
> - After loading, the library is attached to the global object (e.g., `window.FullCalendar`)
> - If the library provides an ESM version, you can also use `ctx.importAsync`
