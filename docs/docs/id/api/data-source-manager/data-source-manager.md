:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# DataSourceManager

`DataSourceManager` adalah kelas manajemen untuk beberapa instans `dataSource`.

## API

### add()
Menambahkan sebuah instans `dataSource`.

#### Tanda Tangan

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Menambahkan middleware global ke instans `dataSource`.

### middleware()

Mendapatkan middleware dari instans `dataSourceManager` saat ini, yang dapat digunakan untuk merespons permintaan HTTP.

### afterAddDataSource()

Sebuah fungsi *hook* yang dipanggil setelah `dataSource` baru ditambahkan.

#### Tanda Tangan

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Mendaftarkan tipe sumber data dan kelasnya.

#### Tanda Tangan

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Mendapatkan kelas sumber data.

#### Tanda Tangan

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Membuat instans sumber data berdasarkan tipe sumber data yang terdaftar dan opsi instans.

#### Tanda Tangan

- `buildDataSourceByType(type: string, options: any): DataSource`