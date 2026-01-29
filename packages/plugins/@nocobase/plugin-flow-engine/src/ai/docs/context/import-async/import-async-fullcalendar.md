---
title: "Load FullCalendar ESM with importAsync"
description: "Dynamically import FullCalendar ESM modules via ctx.importAsync and render a calendar."
---

# Load FullCalendar ESM with importAsync

```ts
// 1. Dynamically import the FullCalendar core module
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Dynamically import the dayGrid plugin
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Create a calendar container and render it
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Initialize and render the calendar
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

> Tip:
> - `ctx.importAsync` is suitable for ESM modules and returns a module namespace object
> - Some CDNs (e.g., skypack.dev) automatically resolve module dependencies without an importmap
> - Plugin modules may export via `default` or named exports, so handle both cases (e.g., `dayGridPlugin.default || dayGridPlugin`)
