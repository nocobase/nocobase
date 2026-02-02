---
title: "Load react-big-calendar with importAsync"
description: "Load react-big-calendar and date-fns in RunJS via ctx.importAsync, and render the calendar with ctx.render."
---

# Load react-big-calendar with importAsync

In RunJS, use `ctx.importAsync()` to load React, react-big-calendar, and date-fns; create a container with `document.createElement`, render it into the current block with `ctx.render()`, then mount the calendar with `createRoot().render()`.

```ts
// 1. Load styles
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Load React, react-dom, react-big-calendar, date-fns, and locale (same React instance)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const { Calendar, dateFnsLocalizer } = await ctx.importAsync('react-big-calendar@1.11.4?deps=react@18.2.0,react-dom@18.2.0');
const { format, parse, startOfWeek, getDay } = await ctx.importAsync('date-fns@2.30.0');
const enUS = await ctx.importAsync('date-fns@2.30.0/locale/en-US.js');

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

const events = [
  { title: 'All Day Event', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Meeting', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Create container and render to current block with ctx.render
const rootEl = document.createElement('div');
rootEl.style.height = '500px';
ctx.render(rootEl);

// 4. Mount React calendar
createRoot(rootEl).render(
  React.createElement(Calendar, {
    localizer,
    events,
    startAccessor: 'start',
    endAccessor: 'end',
    style: { height: '100%' },
  })
);
```

## Notes

- **Module loading**: `ctx.importAsync` calls can be placed at the top.
- **CSS**: `ctx.importAsync` also supports loading `.css` files.
- **React in this scenario**: Do not rely on a built-in or in-page React instance. Always load React and react-dom via `ctx.importAsync('react@18.2.0')` and `ctx.importAsync('react-dom@18.2.0/client')` so that react-big-calendar (and any other ESM-loaded React libs) use the same React instance; otherwise you get "Invalid hook call" or duplicate React.
- **React version**: Use `?deps=react@18.2.0,react-dom@18.2.0` so react-big-calendar shares the same React instance as the page and avoids "Invalid hook call".
- **No JSX**: Use `React.createElement`; no JSX compilation required.
