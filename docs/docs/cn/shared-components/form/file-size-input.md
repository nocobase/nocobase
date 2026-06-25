---
title: "FileSizeInput"
description: "FileSizeInput：用 Byte / KB / MB / GB 输入文件大小，并统一保存为字节数。"
keywords: "FileSizeInput,文件大小,字节,KB,MB,GB,NocoBase"
---

# FileSizeInput

`FileSizeInput` 用来输入文件大小、内存上限这类数值。界面上可以选择 Byte / KB / MB / GB，最终保存的值始终是字节数。

## 基本用法

```tsx file="../_demos/file-size-input.tsx" preview
```

在表单里使用：

```tsx
import { FileSizeInput } from '@nocobase/client-v2';

<Form.Item name="maxFileSize" label={t('Max file size')}>
  <FileSizeInput min={1} max={1024 * 1024 * 1024} defaultValue={20 * 1024 * 1024} />
</Form.Item>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `number` | - | 当前字节数 |
| `onChange` | `(value?: number) => void` | - | 值变化回调，参数始终是字节数 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `min` | `number` | `1` | 最小字节数 |
| `max` | `number` | `Infinity` | 最大字节数 |
| `defaultValue` | `number` | `20 * 1024 * 1024` | 空值时用于推导初始单位 |

输入框 blur 时，如果值为空或小于 `min`，会自动回到 `min`。切换单位时，组件会按当前显示值重新换算成字节数。
