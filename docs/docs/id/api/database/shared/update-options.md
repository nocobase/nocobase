:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

**Tipe**

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Detail**

- `values`: Objek data untuk rekaman yang akan diperbarui.
- `filter`: Menentukan kondisi filter untuk rekaman yang akan diperbarui. Untuk penggunaan `Filter` secara detail, lihat metode [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter untuk rekaman yang akan diperbarui berdasarkan `TargetKey`.
- `whitelist`: Daftar putih (whitelist) untuk bidang `values`. Hanya bidang dalam daftar ini yang akan ditulis.
- `blacklist`: Daftar hitam (blacklist) untuk bidang `values`. Bidang dalam daftar ini tidak akan ditulis.
- `transaction`: Objek transaksi. Jika parameter transaksi tidak diteruskan, metode ini akan secara otomatis membuat transaksi internal.

Setidaknya salah satu dari `filterByTk` atau `filter` harus diteruskan.