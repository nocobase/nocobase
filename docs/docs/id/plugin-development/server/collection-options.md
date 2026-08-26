---
title: "Parameter Konfigurasi Collection"
description: "Konfigurasi NocoBase defineCollection: name, title, migrationRules, inherits, fields, timestamps, autoGenId, dan lainnya."
keywords: "CollectionOptions,defineCollection,name,fields,migrationRules,inherits,NocoBase"
---


## Penjelasan Parameter Konfigurasi Collection

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

### `name` - Nama Tabel Data
- **Tipe**: `string`
- **Wajib**: Ya
- **Penjelasan**: Identifier unik tabel data, harus unik di seluruh aplikasi
- **Contoh**:
```typescript
{
  name: 'users'  // Tabel data pengguna
}
```

### `title` - Judul Tabel Data
- **Tipe**: `string`
- **Wajib**: Tidak
- **Penjelasan**: Judul tampilan tabel data, digunakan untuk tampilan antarmuka front-end
- **Contoh**:
```typescript
{
  name: 'users',
  title: 'Manajemen Pengguna'  // Ditampilkan sebagai "Manajemen Pengguna" di antarmuka
}
```

### `migrationRules` - Aturan Migrasi
- **Tipe**: `MigrationRule[]`
- **Wajib**: Tidak
- **Penjelasan**: Aturan penanganan saat migrasi data
- **Contoh**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Overwrite data yang ada
  fields: [...]
}
```

### `inherits` - Tabel Data Inheritance
- **Tipe**: `string[] | string`
- **Wajib**: Tidak
- **Penjelasan**: Mewarisi definisi field dari tabel data lain, mendukung inheritance dari satu atau beberapa tabel data
- **Contoh**:

```typescript
// Inheritance tunggal
{
  name: 'admin_users',
  inherits: 'users',  // Mewarisi semua field tabel data users
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Inheritance multiple
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Mewarisi beberapa tabel data
  fields: [...]
}
```

### `filterTargetKey` - Filter Target Key
- **Tipe**: `string | string[]`
- **Wajib**: Tidak
- **Penjelasan**: Target key untuk filter query, mendukung satu atau beberapa key
- **Contoh**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filter berdasarkan ID pengguna
  fields: [...]
}

// Multiple filter key
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filter berdasarkan ID pengguna dan ID kategori
  fields: [...]
}
```

### `fields` - Definisi Field
- **Tipe**: `FieldOptions[]`
- **Wajib**: Tidak
- **Default**: `[]`
- **Penjelasan**: Array definisi field tabel data, setiap field berisi tipe, nama, konfigurasi, dan informasi lainnya
- **Contoh**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Username'
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
      title: 'Password'
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
- **Wajib**: Tidak
- **Penjelasan**: Menentukan class model Sequelize kustom, dapat berupa nama class atau class model itu sendiri
- **Contoh**:
```typescript
// Menggunakan string untuk menentukan nama class model
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Menggunakan class model
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repository Kustom
- **Tipe**: `string | RepositoryType`
- **Wajib**: Tidak
- **Penjelasan**: Menentukan class repository kustom, untuk menangani logika akses data
- **Contoh**:
```typescript
// Menggunakan string untuk menentukan nama class repository
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Menggunakan class repository
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Otomatis Generate ID
- **Tipe**: `boolean`
- **Wajib**: Tidak
- **Default**: `true`
- **Penjelasan**: Apakah otomatis menghasilkan primary key ID
- **Contoh**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Otomatis menghasilkan primary key ID
  fields: [...]
}

// Menonaktifkan auto generate ID (perlu menentukan primary key secara manual)
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

### `timestamps` - Mengaktifkan Timestamp
- **Tipe**: `boolean`
- **Wajib**: Tidak
- **Default**: `true`
- **Penjelasan**: Apakah mengaktifkan field waktu pembuatan dan waktu update
- **Contoh**:
```typescript
{
  name: 'users',
  timestamps: true,  // Mengaktifkan timestamp
  fields: [...]
}
```

### `createdAt` - Field Waktu Pembuatan
- **Tipe**: `boolean | string`
- **Wajib**: Tidak
- **Default**: `true`
- **Penjelasan**: Konfigurasi field waktu pembuatan
- **Contoh**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Custom nama field waktu pembuatan
  fields: [...]
}
```

### `updatedAt` - Field Waktu Update
- **Tipe**: `boolean | string`
- **Wajib**: Tidak
- **Default**: `true`
- **Penjelasan**: Konfigurasi field waktu update
- **Contoh**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Custom nama field waktu update
  fields: [...]
}
```

### `deletedAt` - Field Soft Delete
- **Tipe**: `boolean | string`
- **Wajib**: Tidak
- **Default**: `false`
- **Penjelasan**: Konfigurasi field soft delete
- **Contoh**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Mengaktifkan soft delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Mode Soft Delete
- **Tipe**: `boolean`
- **Wajib**: Tidak
- **Default**: `false`
- **Penjelasan**: Apakah mengaktifkan mode soft delete
- **Contoh**:
```typescript
{
  name: 'users',
  paranoid: true,  // Mengaktifkan soft delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Penamaan Underscore
- **Tipe**: `boolean`
- **Wajib**: Tidak
- **Default**: `false`
- **Penjelasan**: Apakah menggunakan gaya penamaan underscore
- **Contoh**:
```typescript
{
  name: 'users',
  underscored: true,  // Menggunakan gaya penamaan underscore
  fields: [...]
}
```

### `indexes` - Konfigurasi Index
- **Tipe**: `ModelIndexesOptions[]`
- **Wajib**: Tidak
- **Penjelasan**: Konfigurasi index database
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

## Penjelasan Konfigurasi Parameter Field

NocoBase mendukung berbagai tipe field, semua field didefinisikan berdasarkan tipe union `FieldOptions`. Konfigurasi field mencakup property dasar, property spesifik tipe data, property relasi, dan property rendering front-end.

### Opsi Field Dasar

Semua tipe field diwarisi dari `BaseFieldOptions`, menyediakan kemampuan konfigurasi field umum:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Parameter umum
  name?: string;                    // Nama field
  hidden?: boolean;                 // Apakah disembunyikan
  validation?: ValidationOptions<T>; // Aturan validasi

  // Property field kolom umum
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Terkait front-end
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
  allowNull: false,        // Tidak mengizinkan nilai kosong
  unique: true,           // Constraint unik
  defaultValue: '',       // Default string kosong
  index: true,            // Membuat index
  comment: 'Nama login pengguna'    // Komentar database
}
```

### `name` - Nama Field

- **Tipe**: `string`
- **Wajib**: Tidak
- **Penjelasan**: Nama kolom field di database, harus unik dalam collection
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',  // Nama field
  title: 'Username'
}
```

### `hidden` - Field Tersembunyi

- **Tipe**: `boolean`
- **Default**: `false`
- **Penjelasan**: Apakah secara default menyembunyikan field ini di list/form
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Menyembunyikan field internal ID
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
  key: string;                      // Nama key aturan
  name: FieldValidationRuleName<T>; // Nama aturan
  args?: {                         // Parameter aturan
    [key: string]: any;
  };
  paramsType?: 'object';           // Tipe parameter
}
```

- **Tipe**: `ValidationOptions<T>`
- **Penjelasan**: Mendefinisikan aturan validasi sisi server menggunakan Joi
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

### `allowNull` - Mengizinkan Nilai Kosong

- **Tipe**: `boolean`
- **Default**: `true`
- **Penjelasan**: Mengontrol apakah database mengizinkan penulisan nilai `NULL`
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Tidak mengizinkan nilai kosong
  title: 'Username'
}
```

### `defaultValue` - Nilai Default

- **Tipe**: `any`
- **Penjelasan**: Nilai default field, akan digunakan saat membuat record tanpa menyediakan nilai field tersebut
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Default status draft
  title: 'Status'
}
```

### `unique` - Constraint Unik

- **Tipe**: `boolean | string`
- **Default**: `false`
- **Penjelasan**: Apakah unik; string dapat menentukan nama constraint
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email harus unik
  title: 'Email'
}
```

### `primaryKey` - Primary Key

- **Tipe**: `boolean`
- **Default**: `false`
- **Penjelasan**: Mendeklarasikan field ini sebagai primary key
- **Contoh**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Diset sebagai primary key
  autoIncrement: true
}
```

### `autoIncrement` - Auto Increment

- **Tipe**: `boolean`
- **Default**: `false`
- **Penjelasan**: Mengaktifkan auto increment (hanya berlaku untuk field tipe numerik)
- **Contoh**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto increment
  primaryKey: true
}
```

### `field` - Nama Kolom Database

- **Tipe**: `string`
- **Penjelasan**: Menentukan nama kolom database aktual (sama dengan `field` Sequelize)
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
- **Penjelasan**: Catatan field database, untuk dokumentasi
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nama login pengguna, untuk login sistem',  // Komentar database
  title: 'Username'
}
```

### `title` - Judul Tampilan

- **Tipe**: `string`
- **Penjelasan**: Judul tampilan field, sering digunakan untuk tampilan antarmuka front-end
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',  // Judul yang ditampilkan di front-end
  allowNull: false
}
```

### `description` - Deskripsi Field

- **Tipe**: `string`
- **Penjelasan**: Informasi deskripsi field, untuk membantu pengguna memahami tujuan field
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Silakan masukkan alamat email yang valid',  // Deskripsi field
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Component Antarmuka

- **Tipe**: `string`
- **Penjelasan**: Component antarmuka field front-end yang direkomendasikan
- **Contoh**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Konten',
  interface: 'textarea',  // Direkomendasikan menggunakan component text area
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interface Tipe Field

### `type: 'string'` - Field String

- **Penjelasan**: Digunakan untuk menyimpan data teks pendek, mendukung pembatasan panjang dan auto trim
- **Tipe Database**: `VARCHAR`
- **Property Khusus**:
  - `length`: Pembatasan panjang string
  - `trim`: Apakah otomatis menghapus spasi di awal dan akhir

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Pembatasan panjang string
  trim?: boolean;     // Apakah otomatis menghapus spasi di awal dan akhir
}
```

**Contoh**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',
  length: 50,           // Maksimum 50 karakter
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

### `type: 'text'` - Field Teks

- **Penjelasan**: Digunakan untuk menyimpan data teks panjang, mendukung tipe teks dengan panjang berbeda di MySQL
- **Tipe Database**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Property Khusus**:
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
  length: 'medium',     // Menggunakan MEDIUMTEXT
  allowNull: true
}
```

### Tipe Numerik

### `type: 'integer'` - Field Integer

- **Penjelasan**: Digunakan untuk menyimpan data integer, mendukung auto increment dan primary key
- **Tipe Database**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Mewarisi semua opsi tipe Sequelize INTEGER
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

### `type: 'bigInt'` - Field Big Integer

- **Penjelasan**: Digunakan untuk menyimpan data integer besar, dengan rentang lebih besar dari integer
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

### `type: 'float'` - Field Floating Point

- **Penjelasan**: Digunakan untuk menyimpan floating point presisi tunggal
- **Tipe Database**: `FLOAT`
- **Property Khusus**:
  - `precision`: Presisi (jumlah digit total)
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

### `type: 'double'` - Field Double Floating Point

- **Penjelasan**: Digunakan untuk menyimpan floating point presisi ganda, presisi lebih tinggi dari float
- **Tipe Database**: `DOUBLE`
- **Property Khusus**:
  - `precision`: Presisi (jumlah digit total)
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

### `type: 'real'` - Field Real

- **Penjelasan**: Digunakan untuk menyimpan bilangan real, terkait database
- **Tipe Database**: `REAL`
- **Property Khusus**:
  - `precision`: Presisi (jumlah digit total)
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

### `type: 'decimal'` - Field Decimal Akurat

- **Penjelasan**: Digunakan untuk menyimpan decimal yang akurat, cocok untuk perhitungan keuangan
- **Tipe Database**: `DECIMAL`
- **Property Khusus**:
  - `precision`: Presisi (jumlah digit total)
  - `scale`: Jumlah digit desimal

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Presisi (jumlah digit total)
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

### `type: 'boolean'` - Field Boolean

- **Penjelasan**: Digunakan untuk menyimpan nilai true/false, biasanya digunakan untuk status switch
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

### `type: 'radio'` - Field Radio

- **Penjelasan**: Digunakan untuk menyimpan nilai radio, biasanya digunakan untuk situasi pilihan dua
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

### Tipe Tanggal Waktu

### `type: 'date'` - Field Tanggal

- **Penjelasan**: Digunakan untuk menyimpan data tanggal, tidak menyertakan informasi waktu
- **Tipe Database**: `DATE`
- **Property Khusus**:
  - `timezone`: Apakah menyertakan informasi zona waktu

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Apakah menyertakan informasi zona waktu
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

### `type: 'time'` - Field Waktu

- **Penjelasan**: Digunakan untuk menyimpan data waktu, tidak menyertakan informasi tanggal
- **Tipe Database**: `TIME`
- **Property Khusus**:
  - `timezone`: Apakah menyertakan informasi zona waktu

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

### `type: 'datetimeTz'` - Field Tanggal Waktu Dengan Zona Waktu

- **Penjelasan**: Digunakan untuk menyimpan data tanggal waktu dengan zona waktu
- **Tipe Database**: `TIMESTAMP WITH TIME ZONE`
- **Property Khusus**:
  - `timezone`: Apakah menyertakan informasi zona waktu

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

### `type: 'datetimeNoTz'` - Field Tanggal Waktu Tanpa Zona Waktu

- **Penjelasan**: Digunakan untuk menyimpan data tanggal waktu tanpa zona waktu
- **Tipe Database**: `TIMESTAMP` atau `DATETIME`
- **Property Khusus**:
  - `timezone`: Apakah menyertakan informasi zona waktu

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
  title: 'Waktu Update',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Field Hanya Tanggal

- **Penjelasan**: Digunakan untuk menyimpan data yang hanya berisi tanggal, tidak menyertakan waktu
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

### `type: 'unixTimestamp'` - Field Unix Timestamp

- **Penjelasan**: Digunakan untuk menyimpan data Unix timestamp
- **Tipe Database**: `BIGINT`
- **Property Khusus**:
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

### `type: 'json'` - Field JSON

- **Penjelasan**: Digunakan untuk menyimpan data format JSON, mendukung struktur data kompleks
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

### `type: 'jsonb'` - Field JSONB

- **Penjelasan**: Digunakan untuk menyimpan data format JSONB (khusus PostgreSQL), mendukung index dan query
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

### `type: 'array'` - Field Array

- **Penjelasan**: Digunakan untuk menyimpan data array, mendukung berbagai tipe element
- **Tipe Database**: `JSON` atau `ARRAY`
- **Property Khusus**:
  - `dataType`: Tipe penyimpanan (json/array)
  - `elementType`: Tipe element (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Tipe penyimpanan
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Tipe element
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

### `type: 'set'` - Field Set

- **Penjelasan**: Digunakan untuk menyimpan data set, mirip array tetapi memiliki constraint keunikan
- **Tipe Database**: `JSON` atau `ARRAY`
- **Property Khusus**:
  - `dataType`: Tipe penyimpanan (json/array)
  - `elementType`: Tipe element (STRING/INTEGER/BOOLEAN/JSON)

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

### Tipe Identifier

### `type: 'uuid'` - Field UUID

- **Penjelasan**: Digunakan untuk menyimpan identifier unik format UUID
- **Tipe Database**: `UUID` atau `VARCHAR(36)`
- **Property Khusus**:
  - `autoFill`: Otomatis terisi

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Otomatis terisi
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

### `type: 'nanoid'` - Field Nanoid

- **Penjelasan**: Digunakan untuk menyimpan identifier unik pendek format Nanoid
- **Tipe Database**: `VARCHAR`
- **Property Khusus**:
  - `size`: Panjang ID
  - `customAlphabet`: Set karakter kustom
  - `autoFill`: Otomatis terisi

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

### `type: 'uid'` - Field UID Kustom

- **Penjelasan**: Digunakan untuk menyimpan identifier unik format kustom
- **Tipe Database**: `VARCHAR`
- **Property Khusus**:
  - `prefix`: Prefix
  - `pattern`: Pattern validasi

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefix
  pattern?: string; // Pattern validasi
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

### `type: 'snowflakeId'` - Field Snowflake ID

- **Penjelasan**: Digunakan untuk menyimpan identifier unik yang dihasilkan oleh algoritma snowflake
- **Tipe Database**: `BIGINT`
- **Contoh**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Field Fungsional

### `type: 'password'` - Field Password

- **Penjelasan**: Digunakan untuk menyimpan data password yang sudah dienkripsi
- **Tipe Database**: `VARCHAR`
- **Property Khusus**:
  - `length`: Panjang hash
  - `randomBytesSize`: Ukuran random bytes

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Panjang hash
  randomBytesSize?: number;  // Ukuran random bytes
}
```

**Contoh**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Password',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Field Enkripsi

- **Penjelasan**: Digunakan untuk menyimpan data sensitif yang sudah dienkripsi
- **Tipe Database**: `VARCHAR`
- **Contoh**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Secret Key',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Field Virtual

- **Penjelasan**: Digunakan untuk menyimpan data virtual yang dihitung, tidak disimpan di database
- **Tipe Database**: Tidak ada (field virtual)
- **Contoh**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nama Lengkap'
}
```

### `type: 'context'` - Field Context

- **Penjelasan**: Digunakan untuk membaca data dari konteks runtime (seperti informasi pengguna saat ini)
- **Tipe Database**: Ditentukan berdasarkan dataType
- **Property Khusus**:
  - `dataIndex`: Path index data
  - `dataType`: Tipe data
  - `createOnly`: Hanya diset saat pembuatan

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Path index data
  dataType?: string;   // Tipe data
  createOnly?: boolean; // Hanya diset saat pembuatan
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

### Field Relasi

### `type: 'belongsTo'` - Relasi Belongs To

- **Penjelasan**: Merepresentasikan relasi many-to-one, record saat ini milik record lain
- **Tipe Database**: Field foreign key
- **Property Khusus**:
  - `target`: Nama tabel data target
  - `foreignKey`: Nama field foreign key
  - `targetKey`: Nama field key tabel target
  - `onDelete`: Operasi cascade saat delete
  - `onUpdate`: Operasi cascade saat update
  - `constraints`: Apakah mengaktifkan constraint foreign key

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nama tabel data target
  foreignKey?: string;  // Nama field foreign key
  targetKey?: string;   // Nama field key tabel target
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Apakah mengaktifkan constraint foreign key
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

- **Penjelasan**: Merepresentasikan relasi one-to-one, record saat ini memiliki satu record terkait
- **Tipe Database**: Field foreign key
- **Property Khusus**:
  - `target`: Nama tabel data target
  - `foreignKey`: Nama field foreign key
  - `sourceKey`: Nama field key tabel sumber
  - `onDelete`: Operasi cascade saat delete
  - `onUpdate`: Operasi cascade saat update
  - `constraints`: Apakah mengaktifkan constraint foreign key

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nama field key tabel sumber
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

- **Penjelasan**: Merepresentasikan relasi one-to-many, record saat ini memiliki banyak record terkait
- **Tipe Database**: Field foreign key
- **Property Khusus**:
  - `target`: Nama tabel data target
  - `foreignKey`: Nama field foreign key
  - `sourceKey`: Nama field key tabel sumber
  - `sortBy`: Field sorting
  - `sortable`: Apakah dapat diurutkan
  - `onDelete`: Operasi cascade saat delete
  - `onUpdate`: Operasi cascade saat update
  - `constraints`: Apakah mengaktifkan constraint foreign key

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Field sorting
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

### `type: 'belongsToMany'` - Relasi Many-to-Many

- **Penjelasan**: Merepresentasikan relasi many-to-many, menghubungkan dua tabel data melalui tabel perantara
- **Tipe Database**: Tabel perantara
- **Property Khusus**:
  - `target`: Nama tabel data target
  - `through`: Nama tabel perantara
  - `foreignKey`: Nama field foreign key
  - `otherKey`: Foreign key sisi lain tabel perantara
  - `sourceKey`: Nama field key tabel sumber
  - `targetKey`: Nama field key tabel target
  - `onDelete`: Operasi cascade saat delete
  - `onUpdate`: Operasi cascade saat update
  - `constraints`: Apakah mengaktifkan constraint foreign key

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nama tabel perantara
  foreignKey?: string;
  otherKey?: string;  // Foreign key sisi lain tabel perantara
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
