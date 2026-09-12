---
title: "Storage (SDK)"
description: "Storage SDK frontend NocoBase: penyimpanan lokal, wrapper sessionStorage."
keywords: "Storage SDK,penyimpanan lokal,sessionStorage,storage frontend,NocoBase"
---

# Storage

## Ikhtisar

Class `Storage` digunakan untuk penyimpanan informasi di sisi client, secara default menggunakan `localStorage`.

### Penggunaan Dasar

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## Method Class

### `setItem()`

Menyimpan konten.

#### Signature

- `setItem(key: string, value: string): void`

### `getItem()`

Mengambil konten.

#### Signature

- `getItem(key: string): string | null`

### `removeItem()`

Menghapus konten.

#### Signature

- `removeItem(key: string): void`

### `clear()`

Menghapus semua konten.

#### Signature

- `clear(): void`
