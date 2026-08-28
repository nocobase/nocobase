---
title: "TypedVariableInput"
description: "TypedVariableInput: Membuat field menerima konstanta dan variabel sekaligus."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` digunakan untuk membuat field menerima konstanta dan variabel sekaligus.

## Penggunaan dasar

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `unknown` | Nilai saat ini |
| `onChange` | `(next: unknown) => void` | Callback perubahan |
| `types` | `TypedConstantSpec[]` | Allowed constant types |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `nullable` | `boolean` | Apakah null diizinkan |
| `delimiters` | `[string, string]` | Variable delimiters |
| `disabled` | `boolean` | Apakah dinonaktifkan |
| `placeholder` | `string` | Placeholder text |
| `style` | `React.CSSProperties` | Gaya kustom |
| `className` | `string` | className kustom |
