:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Penyimpanan

## Gambaran Umum

Kelas `Storage` digunakan untuk penyimpanan informasi sisi klien, secara default menggunakan `localStorage`.

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

## Metode Kelas

### `setItem()`

Menyimpan konten.

#### Tanda Tangan

- `setItem(key: string, value: string): void`

### `getItem()`

Mengambil konten.

#### Tanda Tangan

- `getItem(key: string): string | null`

### `removeItem()`

Menghapus konten.

#### Tanda Tangan

- `removeItem(key: string): void`

### `clear()`

Menghapus semua konten.

#### Tanda Tangan

- `clear(): void`