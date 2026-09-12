---
title: "EnvVariableInput"
description: "EnvVariableInput: Hanya mengizinkan variabel lingkungan `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` digunakan untuk hanya mengizinkan variabel lingkungan `$env`.

## Penggunaan dasar

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `string` | Nilai saat ini |
| `onChange` | `(value: string) => void` | Callback perubahan |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `disabled` | `boolean` | Apakah dinonaktifkan |
| `password` | `boolean` | Mask plain non-variable values |
| `placeholder` | `string` | Placeholder text |

## Tautan terkait

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
