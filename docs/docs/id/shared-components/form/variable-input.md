---
title: "VariableInput"
description: "VariableInput: Membuat field satu baris menerima variabel seperti `{{ $env.X }}` digunakan untuk dan `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` digunakan untuk membuat field satu baris menerima variabel seperti `{{ $env.X }}` dan `{{ $user.name }}`.

## Penggunaan dasar

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `string` | Nilai saat ini |
| `onChange` | `(value: string) => void` | Callback perubahan |
| `disabled` | `boolean` | Apakah dinonaktifkan |
| `placeholder` | `string` | Placeholder text |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `className` | `string` | className kustom |
| `style` | `React.CSSProperties` | Gaya kustom |

## Tautan terkait

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
