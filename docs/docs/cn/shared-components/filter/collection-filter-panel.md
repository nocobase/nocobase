---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel：把 Collection 多条件筛选面板嵌入页面。"
keywords: "CollectionFilterPanel,筛选,filter,Collection,NocoBase"
---

# CollectionFilterPanel

`CollectionFilterPanel` 用来把 Collection 多条件筛选表单直接嵌在 drawer、设置页或自定义面板里。

如果你只需要一个点击后弹出筛选表单的按钮，默认用 [CollectionFilter](./)。

## 基本用法

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `collection` | `Collection \| undefined` | 字段来源 |
| `initialValue` | `Record<string, unknown> \| undefined` | 初始 filter |
| `onChange` | `(filter) => void` | 条件变化或 reset 时触发 |
| `t` | `(key, options?) => string` | 翻译函数 |
| `filterableFieldNames` | `string[]` | 字段白名单 |
| `nonfilterableFieldNames` | `string[]` | 字段黑名单 |
| `noIgnore` | `boolean` | 跳过白名单限制 |

ref 暴露：

| 方法 | 说明 |
| --- | --- |
| `getFilter()` | 获取当前编译后的 filter |
| `reset()` | 清空条件 |

## 相关链接

- [CollectionFilter](./) — 以按钮和 Popover 形态使用筛选
