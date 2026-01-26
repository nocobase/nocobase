---
title: "Cascade select (load child roles)"
description: "Load child roles based on the selected parent role."
---

# Cascade select (load child roles)

Load child roles based on the selected parent role

```ts
// Get selected parent role (adjust field name to match your form)
const parentRoleId = ctx.record?.parentRole?.id;

if (!parentRoleId) {
  return;
}

const res = await ctx.api.request({
  url: 'roles:list',
  method: 'get',
  params: {
    pageSize: 100,
    filter: {
      parentId: parentRoleId,
    },
  },
});

const childRoles = res?.data?.data || [];

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

const roleField = candidates.find((item) => item?.props?.name === 'role');

if (roleField) {
  roleField.setProps({
    dataSource: childRoles.map((role) => ({
      value: role.id,
      label: role.name,
    })),
    value: undefined,
  });
}
```
