:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Cache

## Metode Dasar

Anda bisa merujuk ke dokumentasi <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Metode Lain

### `wrapWithCondition()`

Mirip dengan `wrap()`, namun memungkinkan Anda untuk secara kondisional memutuskan apakah akan menggunakan cache atau tidak.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parameter eksternal untuk mengontrol apakah akan menggunakan hasil cache
    useCache?: boolean;
    // Menentukan apakah akan melakukan cache berdasarkan hasil data
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Ketika konten cache adalah objek, ubah nilai dari kunci (key) tertentu.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Ketika konten cache adalah objek, dapatkan nilai dari kunci (key) tertentu.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Ketika konten cache adalah objek, hapus kunci (key) tertentu.

```ts
async delValueInObject(key: string, objectKey: string)
```