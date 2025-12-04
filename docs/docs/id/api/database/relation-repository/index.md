:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# RelationRepository

`RelationRepository` adalah objek `Repository` untuk tipe relasi. `RelationRepository` memungkinkan operasi pada data terkait tanpa perlu memuat relasi tersebut. Berdasarkan `RelationRepository`, setiap tipe relasi memiliki implementasi turunan yang sesuai, yaitu:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Konstruktor

**Tanda Tangan**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parameter**

| Nama Parameter     | Tipe               | Nilai Default | Deskripsi                                                               |
| :----------------- | :----------------- | :------------ | :---------------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -             | Koleksi yang sesuai dengan relasi referensi (`referencing relation`) dalam relasi. |
| `association`      | `string`           | -             | Nama relasi                                                             |
| `sourceKeyValue`   | `string \| number` | -             | Nilai kunci yang sesuai dalam relasi referensi.                         |

## Properti Kelas Dasar

### `db: Database`

Objek database

### `sourceCollection`

Koleksi yang sesuai dengan relasi referensi (`referencing relation`) dalam relasi.

### `targetCollection`

Koleksi yang sesuai dengan relasi yang direferensikan (`referenced relation`) dalam relasi.

### `association`

Objek relasi di Sequelize yang sesuai dengan relasi saat ini.

### `associationField`

Bidang dalam koleksi yang sesuai dengan relasi saat ini.

### `sourceKeyValue`

Nilai kunci yang sesuai dalam relasi referensi.