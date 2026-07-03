---
title: "FileSizeInput"
description: "FileSizeInput: Saisir une taille de fichier et la stocker en octets."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` sert à saisir une taille de fichier et la stocker en octets.

## Utilisation de base

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `number` | Valeur actuelle |
| `onChange` | `(value: number | null) => void` | Callback de changement |
| `disabled` | `boolean` | Indique si le composant est désactivé |
| `min` | `number` | Valeur minimale |
| `max` | `number` | Valeur maximale |
