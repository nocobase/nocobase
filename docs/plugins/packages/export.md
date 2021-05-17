---
title: '@nocobase/plugin-export'
---

# @nocobase/plugin-export

提供导出功能

<Alert title="注意" type="warning">
暂时只支持 excel 导出
</Alert>

## 安装

```bash
yarn nocobase pull export --start
```

## Action API

### export

参数和 list 一致，暂时只支持 excel 导出

```ts
api.resource(resourceName).export(params);
```
