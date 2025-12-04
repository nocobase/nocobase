:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Parameter Konfigurasi Koleksi

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Nama Koleksi
- **Tipe**: `string`
- **Wajib**: ✅
- **Deskripsi**: Pengidentifikasi unik untuk koleksi, yang harus unik di seluruh aplikasi.
- **Contoh**:
```typescript
{
  name: 'users'  // Koleksi pengguna
}
```

### `title` - Judul Koleksi
- **Tipe**: `string`
- **Wajib**: ❌
- **Deskripsi**: Judul tampilan koleksi, digunakan untuk ditampilkan di antarmuka tampilan depan.
- **Contoh**:
```typescript
{
  name: 'users',
  title: 'Manajemen Pengguna'  // Ditampilkan sebagai "Manajemen Pengguna" di antarmuka
}
```

### `migrationRules` - Aturan Migrasi
- **Tipe**: `MigrationRule[]`
- **Wajib**: ❌
- **Deskripsi**: Aturan pemrosesan untuk migrasi data.
- **Contoh**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Menimpa data yang ada
  fields: [...]
}
```

### `inherits` - Mewarisi Koleksi
- **Tipe**: `string[] | string`
- **Wajib**: ❌
- **Deskripsi**: Mewarisi definisi bidang dari koleksi lain. Mendukung pewarisan dari satu atau beberapa koleksi.
- **Contoh**:

```typescript
// Pewarisan tunggal
{
  name: 'admin_users',
  inherits: 'users',  // Mewarisi semua bidang dari koleksi pengguna
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Pewarisan ganda
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Mewarisi dari beberapa koleksi
  fields: [...]
}
```

### `filterTargetKey` - Kunci Target Filter
- **Tipe**: `string | string[]`
- **Wajib**: ❌
- **Deskripsi**: Kunci target yang digunakan untuk memfilter kueri. Mendukung satu atau beberapa kunci.
- **Contoh**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filter berdasarkan ID pengguna
  fields: [...]
}

// Beberapa kunci filter
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filter berdasarkan ID pengguna dan ID kategori
  fields: [...]
}
```

### `fields` - Definisi Bidang
- **Tipe**: `FieldOptions[]`
- **Wajib**: ❌
- **Nilai Default**: `[]`
- **Deskripsi**: Array definisi bidang untuk koleksi. Setiap bidang mencakup informasi seperti tipe, nama, dan konfigurasi.
- **Contoh**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nama Pengguna'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Email'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Kata Sandi'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Waktu Pembuatan'
    }
  ]
}
```

### `model` - Model Kustom
- **Tipe**: `string | ModelStatic<Model>`
- **Wajib**: ❌
- **Deskripsi**: Tentukan kelas model Sequelize kustom, yang bisa berupa nama kelas atau kelas model itu sendiri.
- **Contoh**:
```typescript
// Tentukan nama kelas model sebagai string
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Gunakan kelas model
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repository Kustom
- **Tipe**: `string | RepositoryType`
- **Wajib**: ❌
- **Deskripsi**: Tentukan kelas repository kustom untuk menangani logika akses data.
- **Contoh**:
```typescript
// Tentukan nama kelas repository sebagai string
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Gunakan kelas repository
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID Otomatis
- **Tipe**: `boolean`
- **Wajib**: ❌
- **Nilai Default**: `true`
- **Deskripsi**: Apakah akan secara otomatis menghasilkan ID kunci utama.
- **Contoh**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Otomatis menghasilkan ID kunci utama
  fields: [...]
}

// Nonaktifkan pembuatan ID otomatis (memerlukan spesifikasi kunci utama secara manual)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Aktifkan Stempel Waktu
- **Tipe**: `boolean`
- **Wajib**: ❌
- **Nilai Default**: `true`
- **Deskripsi**: Apakah akan mengaktifkan bidang `createdAt` dan `updatedAt`.
- **Contoh**:
```typescript
{
  name: 'users',
  timestamps: true,  // Aktifkan stempel waktu
  fields: [...]
}
```

### `createdAt` - Bidang Waktu Pembuatan
- **Tipe**: `boolean | string`
- **Wajib**: ❌
- **Nilai Default**: `true`
- **Deskripsi**: Konfigurasi untuk bidang `createdAt`.
- **Contoh**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Nama kustom untuk bidang waktu pembuatan
  fields: [...]
}
```

### `updatedAt` - Bidang Waktu Pembaruan
- **Tipe**: `boolean | string`
- **Wajib**: ❌
- **Nilai Default**: `true`
- **Deskripsi**: Konfigurasi untuk bidang `updatedAt`.
- **Contoh**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Nama kustom untuk bidang waktu pembaruan
  fields: [...]
}
```

### `deletedAt` - Bidang Penghapusan Lunak
- **Tipe**: `boolean | string`
- **Wajib**: ❌
- **Nilai Default**: `false`
- **Deskripsi**: Konfigurasi untuk bidang penghapusan lunak.
- **Contoh**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Aktifkan penghapusan lunak
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Mode Penghapusan Lunak
- **Tipe**: `boolean`
- **Wajib**: ❌
- **Nilai Default**: `false`
- **Deskripsi**: Apakah akan mengaktifkan mode penghapusan lunak.
- **Contoh**:
```typescript
{
  name: 'users',
  paranoid: true,  // Aktifkan penghapusan lunak
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Penamaan Underscore
- **Tipe**: `boolean`
- **Wajib**: ❌
- **Nilai Default**: `false`
- **Deskripsi**: Apakah akan menggunakan gaya penamaan underscore.
- **Contoh**:
```typescript
{
  name: 'users',
  underscored: true,  // Gunakan gaya penamaan underscore
  fields: [...]
}
```

### `indexes` - Konfigurasi Indeks
- **Tipe**: `ModelIndexesOptions[]`
- **Wajib**: ❌
- **Deskripsi**: Konfigurasi indeks database.
- **Contoh**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Konfigurasi Parameter Bidang

NocoBase mendukung berbagai tipe bidang, yang semuanya didefinisikan berdasarkan tipe gabungan `FieldOptions`. Konfigurasi bidang mencakup properti dasar, properti spesifik tipe data, properti relasi, dan properti rendering tampilan depan.

### Opsi Bidang Dasar

Semua tipe bidang mewarisi dari `BaseFieldOptions`, menyediakan kemampuan konfigurasi bidang umum:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Parameter Umum
  name?: string;                    // Nama bidang
  hidden?: boolean;                 // Apakah disembunyikan
  validation?: ValidationOptions<T>; // Aturan validasi

  // Properti bidang kolom umum
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Terkait tampilan depan
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Contoh**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Tidak mengizinkan nilai null
  unique: true,           // Batasan unik
  defaultValue: '',       // Default string kosong
  index: true,            // Buat indeks
  comment: 'Nama login pengguna'    // Komentar database
}
```

### `name` - Nama Bidang

- **Tipe**: `string`
- **Wajib**: ❌
- **Deskripsi**: Nama kolom bidang dalam database, yang harus unik dalam satu koleksi.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',  // Nama bidang
  title: 'Nama Pengguna'
}
```

### `hidden` - Sembunyikan Bidang

- **Tipe**: `boolean`
- **Nilai Default**: `false`
- **Deskripsi**: Apakah bidang ini disembunyikan secara default dalam daftar/formulir.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Sembunyikan bidang ID internal
  title: 'ID Internal'
}
```

### `validation` - Aturan Validasi

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Tipe validasi
  rules: FieldValidationRule<T>[];  // Array aturan validasi
  [key: string]: any;              // Opsi validasi lainnya
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Kunci aturan
  name: FieldValidationRuleName<T>; // Nama aturan
  args?: {                         // Argumen aturan
    [key: string]: any;
  };
  paramsType?: 'object';           // Tipe parameter
}
```

- **Tipe**: `ValidationOptions<T>`
- **Deskripsi**: Gunakan Joi untuk mendefinisikan aturan validasi sisi server.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Mengizinkan Nilai Null

- **Tipe**: `boolean`
- **Nilai Default**: `true`
- **Deskripsi**: Mengontrol apakah database mengizinkan penulisan nilai `NULL`.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Tidak mengizinkan nilai null
  title: 'Nama Pengguna'
}
```

### `defaultValue` - Nilai Default

- **Tipe**: `any`
- **Deskripsi**: Nilai default untuk bidang, digunakan saat catatan dibuat tanpa memberikan nilai untuk bidang ini.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Default ke status draf
  title: 'Status'
}
```

### `unique` - Batasan Unik

- **Tipe**: `boolean | string`
- **Nilai Default**: `false`
- **Deskripsi**: Apakah nilainya harus unik; string dapat digunakan untuk menentukan nama batasan.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email harus unik
  title: 'Email'
}
```

### `primaryKey` - Kunci Utama

- **Tipe**: `boolean`
- **Nilai Default**: `false`
- **Deskripsi**: Mendeklarasikan bidang ini sebagai kunci utama.
- **Contoh**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Ditetapkan sebagai kunci utama
  autoIncrement: true
}
```

### `autoIncrement` - Otomatis Bertambah

- **Tipe**: `boolean`
- **Nilai Default**: `false`
- **Deskripsi**: Mengaktifkan penambahan otomatis (hanya berlaku untuk bidang numerik).
- **Contoh**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Otomatis bertambah
  primaryKey: true
}
```

### `field` - Nama Kolom Database

- **Tipe**: `string`
- **Deskripsi**: Menentukan nama kolom database aktual (konsisten dengan `field` Sequelize).
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nama kolom di database
  title: 'ID Pengguna'
}
```

### `comment` - Komentar Database

- **Tipe**: `string`
- **Deskripsi**: Komentar untuk bidang database, digunakan untuk tujuan dokumentasi.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nama login pengguna, digunakan untuk login sistem',  // Komentar database
  title: 'Nama Pengguna'
}
```

### `title` - Judul Tampilan

- **Tipe**: `string`
- **Deskripsi**: Judul tampilan untuk bidang, sering digunakan dalam antarmuka tampilan depan.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nama Pengguna',  // Judul yang ditampilkan di tampilan depan
  allowNull: false
}
```

### `description` - Deskripsi Bidang

- **Tipe**: `string`
- **Deskripsi**: Informasi deskriptif tentang bidang untuk membantu pengguna memahami tujuannya.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Silakan masukkan alamat email yang valid',  // Deskripsi bidang
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Komponen Antarmuka

- **Tipe**: `string`
- **Deskripsi**: Komponen antarmuka tampilan depan yang direkomendasikan untuk bidang.
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Konten',
  interface: 'textarea',  // Rekomendasikan penggunaan komponen textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Antarmuka Tipe Bidang

### `type: 'string'` - Bidang String

- **Deskripsi**: Digunakan untuk menyimpan data teks pendek. Mendukung batasan panjang dan pemangkasan otomatis.
- **Tipe Database**: `VARCHAR`
- **Properti Spesifik**:
  - `length`: Batasan panjang string
  - `trim`: Apakah akan secara otomatis menghapus spasi di awal dan akhir

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Batasan panjang string
  trim?: boolean;     // Apakah akan secara otomatis menghapus spasi di awal dan akhir
}
```

**Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nama Pengguna',
  length: 50,           // Maksimal 50 karakter
  trim: true,           // Otomatis menghapus spasi
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Bidang Teks

- **Deskripsi**: Digunakan untuk menyimpan data teks panjang. Mendukung berbagai tipe teks di MySQL.
- **Tipe Database**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Properti Spesifik**:
  - `length`: Tipe panjang teks MySQL (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Tipe panjang teks MySQL
}
```

**Contoh**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Konten',
  length: 'medium',     // Gunakan MEDIUMTEXT
  allowNull: true
}
```

### Tipe Numerik

### `type: 'integer'` - Bidang Integer

- **Deskripsi**: Digunakan untuk menyimpan data integer. Mendukung penambahan otomatis dan kunci utama.
- **Tipe Database**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Mewarisi semua opsi dari tipe INTEGER Sequelize
}
```

**Contoh**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Bidang Big Integer

- **Deskripsi**: Digunakan untuk menyimpan data integer besar, dengan rentang yang lebih besar dari `integer`.
- **Tipe Database**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Contoh**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID Pengguna',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Bidang Float

- **Deskripsi**: Digunakan untuk menyimpan angka floating-point presisi tunggal.
- **Tipe Database**: `FLOAT`
- **Properti Spesifik**:
  - `precision`: Presisi (jumlah total digit)
  - `scale`: Jumlah digit desimal

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Presisi
  scale?: number;      // Jumlah digit desimal
}
```

**Contoh**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Skor',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Bidang Float Presisi Ganda

- **Deskripsi**: Digunakan untuk menyimpan angka floating-point presisi ganda, yang memiliki presisi lebih tinggi dari `float`.
- **Tipe Database**: `DOUBLE`
- **Properti Spesifik**:
  - `precision`: Presisi (jumlah total digit)
  - `scale`: Jumlah digit desimal

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Contoh**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Harga',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Bidang Real

- **Deskripsi**: Digunakan untuk menyimpan angka real; bergantung pada database.
- **Tipe Database**: `REAL`
- **Properti Spesifik**:
  - `precision`: Presisi (jumlah total digit)
  - `scale`: Jumlah digit desimal

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Contoh**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Nilai Tukar',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Bidang Desimal

- **Deskripsi**: Digunakan untuk menyimpan angka desimal yang tepat, cocok untuk perhitungan keuangan.
- **Tipe Database**: `DECIMAL`
- **Properti Spesifik**:
  - `precision`: Presisi (jumlah total digit)
  - `scale`: Jumlah digit desimal

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Presisi (jumlah total digit)
  scale?: number;      // Jumlah digit desimal
}
```

**Contoh**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Jumlah',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Tipe Boolean

### `type: 'boolean'` - Bidang Boolean

- **Deskripsi**: Digunakan untuk menyimpan nilai benar/salah, biasanya untuk status on/off.
- **Tipe Database**: `BOOLEAN` atau `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Contoh**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Apakah Aktif',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Bidang Radio

- **Deskripsi**: Digunakan untuk menyimpan nilai tunggal yang dipilih, biasanya untuk pilihan biner.
- **Tipe Database**: `BOOLEAN` atau `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Contoh**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Apakah Default',
  defaultValue: false,
  allowNull: false
}
```

### Tipe Tanggal dan Waktu

### `type: 'date'` - Bidang Tanggal

- **Deskripsi**: Digunakan untuk menyimpan data tanggal tanpa informasi waktu.
- **Tipe Database**: `DATE`
- **Properti Spesifik**:
  - `timezone`: Apakah akan menyertakan informasi zona waktu

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Apakah akan menyertakan informasi zona waktu
}
```

**Contoh**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Tanggal Lahir',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Bidang Waktu

- **Deskripsi**: Digunakan untuk menyimpan data waktu tanpa informasi tanggal.
- **Tipe Database**: `TIME`
- **Properti Spesifik**:
  - `timezone`: Apakah akan menyertakan informasi zona waktu

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Waktu Mulai',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Bidang Datetime dengan Zona Waktu

- **Deskripsi**: Digunakan untuk menyimpan data tanggal dan waktu dengan informasi zona waktu.
- **Tipe Database**: `TIMESTAMP WITH TIME ZONE`
- **Properti Spesifik**:
  - `timezone`: Apakah akan menyertakan informasi zona waktu

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Waktu Pembuatan',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Bidang Datetime tanpa Zona Waktu

- **Deskripsi**: Digunakan untuk menyimpan data tanggal dan waktu tanpa informasi zona waktu.
- **Tipe Database**: `TIMESTAMP` atau `DATETIME`
- **Properti Spesifik**:
  - `timezone`: Apakah akan menyertakan informasi zona waktu

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Waktu Pembaruan',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Bidang Hanya Tanggal

- **Deskripsi**: Digunakan untuk menyimpan data yang hanya berisi tanggal, tanpa waktu.
- **Tipe Database**: `DATE`
- **Contoh**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Tanggal Publikasi',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Bidang Stempel Waktu Unix

- **Deskripsi**: Digunakan untuk menyimpan data stempel waktu Unix.
- **Tipe Database**: `BIGINT`
- **Properti Spesifik**:
  - `epoch`: Waktu epoch

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Waktu epoch
}
```

**Contoh**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Waktu Login Terakhir',
  allowNull: true,
  epoch: 0
}
```

### Tipe JSON

### `type: 'json'` - Bidang JSON

- **Deskripsi**: Digunakan untuk menyimpan data dalam format JSON, mendukung struktur data yang kompleks.
- **Tipe Database**: `JSON` atau `TEXT`
- **Contoh**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Bidang JSONB

- **Deskripsi**: Digunakan untuk menyimpan data dalam format JSONB (spesifik PostgreSQL), yang mendukung pengindeksan dan kueri.
- **Tipe Database**: `JSONB` (PostgreSQL)
- **Contoh**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Konfigurasi',
  allowNull: true,
  defaultValue: {}
}
```

### Tipe Array

### `type: 'array'` - Bidang Array

- **Deskripsi**: Digunakan untuk menyimpan data array, mendukung berbagai tipe elemen.
- **Tipe Database**: `JSON` atau `ARRAY`
- **Properti Spesifik**:
  - `dataType`: Tipe penyimpanan (json/array)
  - `elementType`: Tipe elemen (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Tipe penyimpanan
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Tipe elemen
}
```

**Contoh**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tag',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Bidang Set

- **Deskripsi**: Digunakan untuk menyimpan data set, yang mirip dengan array tetapi dengan batasan keunikan.
- **Tipe Database**: `JSON` atau `ARRAY`
- **Properti Spesifik**:
  - `dataType`: Tipe penyimpanan (json/array)
  - `elementType`: Tipe elemen (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Contoh**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Kategori',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Tipe Pengenal

### `type: 'uuid'` - Bidang UUID

- **Deskripsi**: Digunakan untuk menyimpan pengidentifikasi unik dalam format UUID.
- **Tipe Database**: `UUID` atau `VARCHAR(36)`
- **Properti Spesifik**:
  - `autoFill`: Otomatis mengisi

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Otomatis mengisi
}
```

**Contoh**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Bidang Nanoid

- **Deskripsi**: Digunakan untuk menyimpan pengidentifikasi unik pendek dalam format Nanoid.
- **Tipe Database**: `VARCHAR`
- **Properti Spesifik**:
  - `size`: Panjang ID
  - `customAlphabet`: Set karakter kustom
  - `autoFill`: Otomatis mengisi

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Panjang ID
  customAlphabet?: string;  // Set karakter kustom
  autoFill?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID Pendek',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Bidang UID Kustom

- **Deskripsi**: Digunakan untuk menyimpan pengidentifikasi unik dalam format kustom.
- **Tipe Database**: `VARCHAR`
- **Properti Spesifik**:
  - `prefix`: Awalan
  - `pattern`: Pola validasi

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Awalan
  pattern?: string; // Pola validasi
}
```

**Contoh**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Kode',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Bidang ID Snowflake

- **Deskripsi**: Digunakan untuk menyimpan pengidentifikasi unik yang dihasilkan oleh algoritma Snowflake.
- **Tipe Database**: `BIGINT`
- **Contoh**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Bidang Fungsional

### `type: 'password'` - Bidang Kata Sandi

- **Deskripsi**: Digunakan untuk menyimpan data kata sandi yang terenkripsi.
- **Tipe Database**: `VARCHAR`
- **Properti Spesifik**:
  - `length`: Panjang hash
  - `randomBytesSize`: Ukuran byte acak

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Panjang hash
  randomBytesSize?: number;  // Ukuran byte acak
}
```

**Contoh**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Kata Sandi',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Bidang Enkripsi

- **Deskripsi**: Digunakan untuk menyimpan data sensitif yang terenkripsi.
- **Tipe Database**: `VARCHAR`
- **Contoh**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Kunci Rahasia',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Bidang Virtual

- **Deskripsi**: Digunakan untuk menyimpan data virtual hasil perhitungan yang tidak disimpan dalam database.
- **Tipe Database**: Tidak ada (bidang virtual)
- **Contoh**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nama Lengkap'
}
```

### `type: 'context'` - Bidang Konteks

- **Deskripsi**: Digunakan untuk membaca data dari konteks runtime (misalnya, informasi pengguna saat ini).
- **Tipe Database**: Ditentukan oleh `dataType`
- **Properti Spesifik**:
  - `dataIndex`: Jalur indeks data
  - `dataType`: Tipe data
  - `createOnly`: Hanya diatur saat pembuatan

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Jalur indeks data
  dataType?: string;   // Tipe data
  createOnly?: boolean; // Hanya diatur saat pembuatan
}
```

**Contoh**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID Pengguna Saat Ini',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Bidang Relasi

### `type: 'belongsTo'` - Relasi Belongs To

- **Deskripsi**: Merepresentasikan relasi banyak-ke-satu, di mana catatan saat ini termasuk dalam catatan lain.
- **Tipe Database**: Bidang kunci asing
- **Properti Spesifik**:
  - `target`: Nama koleksi target
  - `foreignKey`: Nama bidang kunci asing
  - `targetKey`: Nama bidang kunci target dalam koleksi target
  - `onDelete`: Aksi kaskade saat penghapusan
  - `onUpdate`: Aksi kaskade saat pembaruan
  - `constraints`: Apakah akan mengaktifkan batasan kunci asing

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nama koleksi target
  foreignKey?: string;  // Nama bidang kunci asing
  targetKey?: string;   // Nama bidang kunci target dalam koleksi target
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Apakah akan mengaktifkan batasan kunci asing
}
```

**Contoh**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Penulis',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Relasi Has One

- **Deskripsi**: Merepresentasikan relasi satu-ke-satu, di mana catatan saat ini memiliki satu catatan terkait.
- **Tipe Database**: Bidang kunci asing
- **Properti Spesifik**:
  - `target`: Nama koleksi target
  - `foreignKey`: Nama bidang kunci asing
  - `sourceKey`: Nama bidang kunci sumber dalam koleksi sumber
  - `onDelete`: Aksi kaskade saat penghapusan
  - `onUpdate`: Aksi kaskade saat pembaruan
  - `constraints`: Apakah akan mengaktifkan batasan kunci asing

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nama bidang kunci sumber
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Profil Pengguna',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relasi Has Many

- **Deskripsi**: Merepresentasikan relasi satu-ke-banyak, di mana catatan saat ini memiliki beberapa catatan terkait.
- **Tipe Database**: Bidang kunci asing
- **Properti Spesifik**:
  - `target`: Nama koleksi target
  - `foreignKey`: Nama bidang kunci asing
  - `sourceKey`: Nama bidang kunci sumber dalam koleksi sumber
  - `sortBy`: Bidang pengurutan
  - `sortable`: Apakah dapat diurutkan
  - `onDelete`: Aksi kaskade saat penghapusan
  - `onUpdate`: Aksi kaskade saat pembaruan
  - `constraints`: Apakah akan mengaktifkan batasan kunci asing

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Bidang pengurutan
  sortable?: boolean; // Apakah dapat diurutkan
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Contoh**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Daftar Artikel',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Relasi Belongs To Many

- **Deskripsi**: Merepresentasikan relasi banyak-ke-banyak, menghubungkan dua koleksi melalui tabel penghubung.
- **Tipe Database**: Tabel penghubung
- **Properti Spesifik**:
  - `target`: Nama koleksi target
  - `through`: Nama tabel penghubung
  - `foreignKey`: Nama bidang kunci asing
  - `otherKey`: Kunci asing lain di tabel penghubung
  - `sourceKey`: Nama bidang kunci sumber dalam koleksi sumber
  - `targetKey`: Nama bidang kunci target dalam koleksi target
  - `onDelete`: Aksi kaskade saat penghapusan
  - `onUpdate`: Aksi kaskade saat pembaruan
  - `constraints`: Apakah akan mengaktifkan batasan kunci asing

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nama tabel penghubung
  foreignKey?: string;
  otherKey?: string;  // Kunci asing lain di tabel penghubung
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Contoh**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tag',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```