:::tip Pemberitahuan Terjemahan AI
Dokumentasi ini telah diterjemahkan secara otomatis oleh AI.
:::

**Parameter**

| Nama Parameter         | Tipe          | Nilai Default | Deskripsi                                                                 |
| :--------------------- | :------------ | :------------ | :------------------------------------------------------------------------ |
| `options.values`       | `M`           | `{}`          | Objek data yang akan disisipkan.                                          |
| `options.whitelist?`   | `string[]`    | -             | Daftar putih (whitelist) untuk bidang `values`. Hanya bidang dalam daftar ini yang akan disimpan. |
| `options.blacklist?`   | `string[]`    | -             | Daftar hitam (blacklist) untuk bidang `values`. Bidang dalam daftar ini tidak akan disimpan. |
| `options.transaction?` | `Transaction` | -             | Transaksi.                                                                |