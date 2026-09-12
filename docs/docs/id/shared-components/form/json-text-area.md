---
title: "JsonTextArea"
description: "JsonTextArea: Mengedit konfigurasi JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` digunakan untuk mengedit konfigurasi JSON / JSON5.

## Penggunaan dasar

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `unknown` | Nilai saat ini |
| `onChange` | `(value: unknown) => void` | Callback perubahan |
| `space` | `number` | Stringify indentation |
| `json5` | `boolean` | Apakah parsing memakai JSON5 |
| `showError` | `boolean` | Apakah menampilkan error parsing |

## Tautan terkait

- [VariableJsonTextArea](./variable-json-text-area)
