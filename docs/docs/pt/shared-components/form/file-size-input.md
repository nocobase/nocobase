---
title: "FileSizeInput"
description: "FileSizeInput: Informar um tamanho de arquivo e armazená-lo em bytes."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` é usado para informar um tamanho de arquivo e armazená-lo em bytes.

## Uso básico

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `number` | Valor atual |
| `onChange` | `(value: number | null) => void` | Callback de alteração |
| `disabled` | `boolean` | Se está desabilitado |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
