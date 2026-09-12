---
title: "CollectionFilter"
description: "CollectionFilter：基于 Collection 渲染多条件筛选按钮。"
keywords: "CollectionFilter,筛选,filter,Collection,NocoBase"
---

# CollectionFilter

`CollectionFilter` 是绑定 Collection 的筛选按钮。点击后会打开 Popover，里面是多条件筛选表单。提交时，它会把条件编译成 NocoBase resource `list` 可用的 `filter` 参数。

## 基本用法

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

function Page() {
  const dataSource = ctx.dataSourceManager.getDataSource('main');
  const collection = dataSource.getCollection('users');

  return (
    <CollectionFilter
      collection={collection}
      t={t}
      onChange={(filter) => {
        listRequest.run({ filter });
      }}
    />
  );
}
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `collection` | `Collection \| undefined` | - | 字段来源，未传时按钮禁用 |
| `initialValue` | `Record<string, unknown> \| undefined` | - | 初始 filter |
| `onChange` | `(filter) => void` | - | Submit 或 Reset 时触发 |
| `t` | `(key, options?) => string` | identity | 翻译函数 |
| `filterableFieldNames` | `string[]` | - | 字段白名单 |
| `nonfilterableFieldNames` | `string[]` | - | 字段黑名单 |
| `noIgnore` | `boolean` | `false` | 跳过白名单限制 |
| `buttonText` | `React.ReactNode` | `t('Filter')` | 自定义按钮文案 |
| `showCount` | `boolean` | `true` | 有条件时是否显示条件数 |
| `popoverProps` | `PopoverProps` | - | 透传给 Antd `Popover` |
| `buttonProps` | `ButtonProps` | - | 透传给 Antd `Button` |
| `popoverMinWidth` | `number` | `520` | Popover 内容最小宽度 |

:::tip 提示

如果目标 Collection 是 `schema-only`，客户端 data source 里可能没有它。可以先用 `ExtendCollectionsProvider` 把 Collection 注入当前页面，再传给 `CollectionFilter`。

:::

## 相关链接

- [CollectionFilterPanel](./collection-filter-panel) — 把筛选面板直接嵌入 drawer 或设置页
