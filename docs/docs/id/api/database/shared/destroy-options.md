:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

**Tipe**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detail**

- `filter`: Menentukan kondisi filter untuk catatan yang akan dihapus. Untuk penggunaan detail Filter, silakan lihat metode [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter untuk catatan yang akan dihapus berdasarkan TargetKey.
- `truncate`: Apakah akan mengosongkan data koleksi. Ini hanya berlaku jika parameter `filter` atau `filterByTk` tidak disediakan.
- `transaction`: Objek transaksi. Jika parameter transaksi tidak diteruskan, metode ini akan secara otomatis membuat transaksi internal.