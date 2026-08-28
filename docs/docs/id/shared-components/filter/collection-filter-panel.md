---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Menyematkan panel filter Collection ke halaman."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` digunakan untuk menyematkan panel filter Collection ke halaman.

## Penggunaan dasar

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection yang digunakan sebagai sumber field |
| `initialValue` | `Record<string, unknown>` | Nilai filter awal |
| `onChange` | `(filter) => void` | Callback perubahan |
| `t` | `(key, options?) => string` | Fungsi terjemahan |
| `filterableFieldNames` | `string[]` | Daftar field yang diizinkan |
| `nonfilterableFieldNames` | `string[]` | Daftar field yang diblokir |
| `noIgnore` | `boolean` | Lewati batasan daftar izin |

## Metode

| Metode | Deskripsi |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Tautan terkait

- [CollectionFilter](./)
