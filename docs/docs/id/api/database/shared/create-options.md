:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

**Tipe**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Detail**

- `values`: Objek data untuk catatan yang akan dibuat.
- `whitelist`: Menentukan kolom mana dalam objek data catatan yang akan dibuat **yang dapat ditulis**. Jika parameter ini tidak diberikan, secara default semua kolom diizinkan untuk ditulis.
- `blacklist`: Menentukan kolom mana dalam objek data catatan yang akan dibuat **yang tidak diizinkan untuk ditulis**. Jika parameter ini tidak diberikan, secara default semua kolom diizinkan untuk ditulis.
- `transaction`: Objek transaksi. Jika parameter transaksi tidak diberikan, metode ini akan secara otomatis membuat transaksi internal.