---
title: "VariableTextArea"
description: "VariableTextArea: Membuat teks multi-baris menerima variabel."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` digunakan untuk membuat teks multi-baris menerima variabel.

## Penggunaan dasar

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `string` | Nilai saat ini |
| `onChange` | `(value: string) => void` | Callback perubahan |
| `disabled` | `boolean` | Apakah dinonaktifkan |
| `placeholder` | `string` | Placeholder text |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `rows` | `number` | Fixed row count |
| `maxRows` | `number` | Maximum row count |

## Tautan terkait

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
