---
title: "Display date field as relative time"
description: "Render date values as “3 days ago”, “just now”, etc."
---

# Display date field as relative time

Render date values as “3 days ago”, “just now”, etc.

```ts
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return ctx.t('just now');
  if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
  if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
  if (days < 30) return ctx.t('{{count}} days ago', { count: days });
  if (months < 12) return ctx.t('{{count}} months ago', { count: months });
  return ctx.t('{{count}} years ago', { count: years });
};

const dateStr = ctx.value;
if (!dateStr) {
  ctx.element.innerHTML = '-';
  return;
}

const relativeTime = formatRelativeTime(dateStr);
const fullDate = new Date(dateStr).toLocaleString();

ctx.element.innerHTML = \
```
