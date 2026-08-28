---
title: "FileSizeInput"
description: "FileSizeInput: Enter a file size and store it as bytes."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` is used to enter a file size and store it as bytes.

## Basic Usage

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `number` | Current value |
| `onChange` | `(value: number | null) => void` | Change callback |
| `disabled` | `boolean` | Whether disabled |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
