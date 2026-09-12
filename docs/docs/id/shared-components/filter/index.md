---
title: "CollectionFilter"
description: "CollectionFilter: Memfilter Collection dengan beberapa kondisi."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` digunakan untuk memfilter Collection dengan beberapa kondisi.

## Penggunaan dasar

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

<CollectionFilter
  collection={collection}
  t={t}
  onChange={(filter) => {
    listRequest.run({ filter });
  }}
/>;
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
| `buttonText` | `React.ReactNode` | Teks tombol kustom |
| `showCount` | `boolean` | Apakah menampilkan jumlah kondisi |
| `popoverProps` | `PopoverProps` | Props yang diteruskan ke Antd Popover |
| `buttonProps` | `ButtonProps` | Props yang diteruskan ke Antd Button |
| `popoverMinWidth` | `number` | Lebar minimum konten Popover |

## Tautan terkait

- [CollectionFilterPanel](./collection-filter-panel)
