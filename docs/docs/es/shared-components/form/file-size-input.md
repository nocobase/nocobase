---
title: "FileSizeInput"
description: "FileSizeInput: Introducir un tamaño de archivo y guardarlo como bytes."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` sirve para introducir un tamaño de archivo y guardarlo como bytes.

## Uso básico

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `number` | Valor actual |
| `onChange` | `(value: number | null) => void` | Callback de cambio |
| `disabled` | `boolean` | Si está deshabilitado |
| `min` | `number` | Valor mínimo |
| `max` | `number` | Valor máximo |
