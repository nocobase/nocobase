:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# ICollection

`ICollection` adalah antarmuka untuk model data, yang berisi informasi seperti nama model, bidang, dan asosiasi.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## Anggota

### repository

Instans `Repository` tempat `ICollection` berada.

## API

### updateOptions()

Memperbarui properti `koleksi`.

#### Tanda Tangan

- `updateOptions(options: any): void`

### setField()

Mengatur bidang untuk `koleksi`.

#### Tanda Tangan

- `setField(name: string, options: any): IField`

### removeField()

Menghapus bidang dari `koleksi`.

#### Tanda Tangan

- `removeField(name: string): void`

### getFields()

Mendapatkan semua bidang dari `koleksi`.

#### Tanda Tangan

- `getFields(): Array<IField>`

### getField()

Mendapatkan bidang `koleksi` berdasarkan namanya.

#### Tanda Tangan

- `getField(name: string): IField`