---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Menyisipkan variabel ke konfigurasi JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` digunakan untuk menyisipkan variabel ke konfigurasi JSON / JSON5.

`VariableJsonTextArea` is based on [JsonTextArea](./json-text-area).

## Penggunaan dasar

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `unknown` | Nilai saat ini |
| `onChange` | `(value: unknown) => void` | Callback perubahan |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `metaTree` | `MetaTreeNode[] | function` | Pohon variabel kustom |
| `delimiters` | `[string, string]` | Variable delimiters |
| `formatPathToValue` | `(meta) => string | undefined` | Pemformat path variabel kustom |

## Tautan terkait

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
