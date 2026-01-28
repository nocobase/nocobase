---
title: "Fetch & render list"
description: "Fetch a small list via ctx.api and render basic HTML."
---

# Fetch & render list

Fetch a small list via ctx.api and render basic HTML

```ts
// Fetch users
const { data } = await ctx.api.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

// Render as a simple HTML list
ctx.element.innerHTML = [
  '<div style="padding:12px">',
  '<h4 style="margin:0 0 8px">' + ctx.t('Users') + '</h4>',
  '<ul style="margin:0; padding-left:20px">',
  ...rows.map((r, i) => '<li>#' + (i + 1) + ': ' + String((r && (r.nickname ?? r.username ?? r.id)) ?? '') + '</li>'),
  '</ul>',
  '</div>'
].join('');
```
