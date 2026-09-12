---
title: "FileSizeInput"
description: "FileSizeInput: Memasukkan ukuran file dan menyimpannya sebagai byte."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` digunakan untuk memasukkan ukuran file dan menyimpannya sebagai byte.

## Penggunaan dasar

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `value` | `number` | Nilai saat ini |
| `onChange` | `(value: number | null) => void` | Callback perubahan |
| `disabled` | `boolean` | Apakah dinonaktifkan |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
