:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kontrol Izin ACL

ACL (Access Control List) digunakan untuk mengontrol izin operasi sumber daya. Anda dapat memberikan izin kepada peran, atau melewati batasan peran untuk langsung mengatur izin. Sistem ACL menyediakan mekanisme manajemen izin yang fleksibel, mendukung snippet izin, middleware, penilaian kondisi, dan berbagai metode lainnya.

:::tip Catatan

Objek ACL termasuk dalam sumber data (`dataSource.acl`). ACL sumber data utama dapat diakses dengan cepat melalui `app.acl`. Untuk penggunaan ACL sumber data lainnya, lihat bab [Manajemen Sumber Data](./data-source-manager.md).

:::

## Mendaftarkan Snippet Izin

Snippet izin dapat mendaftarkan kombinasi izin yang umum digunakan sebagai unit izin yang dapat digunakan kembali. Setelah peran terikat dengan snippet, peran tersebut akan mendapatkan serangkaian izin yang sesuai, sehingga mengurangi konfigurasi yang berulang dan meningkatkan efisiensi manajemen izin.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Awalan ui.* menunjukkan izin yang dapat dikonfigurasi di antarmuka
  actions: ['customRequests:*'], // Operasi sumber daya yang sesuai, mendukung wildcard
});
```

## Izin yang Melewati Batasan Peran (allow)

`acl.allow()` digunakan untuk mengizinkan operasi tertentu melewati batasan peran. Ini cocok untuk API publik, skenario izin yang memerlukan penilaian dinamis, atau kasus di mana penilaian izin perlu didasarkan pada konteks permintaan.

```ts
// Akses publik, tidak memerlukan login
acl.allow('app', 'getLang', 'public');

// Hanya pengguna yang sudah masuk yang dapat mengakses
acl.allow('app', 'getInfo', 'loggedIn');

// Berdasarkan penilaian kondisi kustom
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Deskripsi parameter `condition`:**

- `'public'` : Pengguna mana pun (termasuk pengguna yang belum terautentikasi) dapat mengakses, tanpa memerlukan autentikasi apa pun.
- `'loggedIn'` : Hanya pengguna yang sudah masuk yang dapat mengakses, memerlukan identitas pengguna yang valid.
- `(ctx) => Promise<boolean>` atau `(ctx) => boolean` : Fungsi kustom yang secara dinamis menentukan apakah akses diizinkan berdasarkan konteks permintaan, dapat mengimplementasikan logika izin yang kompleks.

## Mendaftarkan Middleware Izin (use)

`acl.use()` digunakan untuk mendaftarkan middleware izin kustom, memungkinkan penyisipan logika kustom ke dalam alur pemeriksaan izin. Biasanya digunakan bersama dengan `ctx.permission` untuk aturan izin kustom. Ini cocok untuk skenario yang memerlukan implementasi kontrol izin yang tidak konvensional, seperti formulir publik yang memerlukan verifikasi kata sandi kustom, pemeriksaan izin dinamis berdasarkan parameter permintaan, dll.

**Skenario aplikasi umum:**

- Skenario formulir publik: Tidak ada pengguna, tidak ada peran, tetapi izin perlu dibatasi melalui kata sandi kustom.
- Kontrol izin berdasarkan parameter permintaan, alamat IP, dan kondisi lainnya.
- Aturan izin kustom, melewati atau memodifikasi alur pemeriksaan izin default.

**Mengontrol izin melalui `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Contoh: Formulir publik memerlukan verifikasi kata sandi untuk melewati pemeriksaan izin
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verifikasi berhasil, lewati pemeriksaan izin
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Melakukan pemeriksaan izin (melanjutkan alur ACL)
  await next();
});
```

**Deskripsi properti `ctx.permission`:**

- `skip: true` : Melewati pemeriksaan izin ACL berikutnya, dan langsung mengizinkan akses.
- Dapat diatur secara dinamis dalam middleware berdasarkan logika kustom, untuk mencapai kontrol izin yang fleksibel.

## Menambahkan Batasan Data Tetap untuk Operasi Tertentu (addFixedParams)

`addFixedParams` dapat menambahkan batasan cakupan data (filter) tetap pada operasi sumber daya tertentu. Batasan ini akan melewati batasan peran dan diterapkan secara langsung, biasanya digunakan untuk melindungi data sistem yang krusial.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Meskipun pengguna memiliki izin untuk menghapus peran, mereka tidak dapat menghapus peran sistem seperti root, admin, member.
```

> **Tip:** `addFixedParams` dapat digunakan untuk mencegah data sensitif terhapus atau termodifikasi secara tidak sengaja, seperti peran bawaan sistem, akun administrator, dll. Batasan ini akan berlaku secara kumulatif dengan izin peran, memastikan bahwa meskipun memiliki izin, data yang dilindungi tidak dapat dimanipulasi.

## Memeriksa Izin (can)

`acl.can()` digunakan untuk memeriksa apakah suatu peran memiliki izin untuk melakukan operasi tertentu, mengembalikan objek hasil izin atau `null`. Ini umumnya digunakan untuk menilai izin secara dinamis dalam logika bisnis, misalnya dalam middleware atau handler operasi untuk memutuskan apakah operasi tertentu diizinkan berdasarkan peran.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Dapat menerima peran tunggal atau array peran
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Peran ${result.role} dapat melakukan operasi ${result.action}`);
  // result.params berisi parameter tetap yang diatur melalui addFixedParams
  console.log('Parameter tetap:', result.params);
} else {
  console.log('Tidak ada izin untuk melakukan operasi ini');
}
```

> **Tip:** Jika beberapa peran diberikan, setiap peran akan diperiksa secara berurutan, dan akan mengembalikan hasil untuk peran pertama yang memiliki izin.

**Definisi Tipe:**

```ts
interface CanArgs {
  role?: string;      // Peran tunggal
  roles?: string[];   // Beberapa peran (diperiksa secara berurutan, mengembalikan peran pertama yang memiliki izin)
  resource: string;   // Nama sumber daya
  action: string;    // Nama operasi
}

interface CanResult {
  role: string;       // Peran yang memiliki izin
  resource: string;   // Nama sumber daya
  action: string;    // Nama operasi
  params?: any;       // Informasi parameter tetap (jika diatur melalui addFixedParams)
}
```

## Mendaftarkan Operasi yang Dapat Dikonfigurasi (setAvailableAction)

Jika Anda ingin operasi kustom dapat dikonfigurasi izinnya di antarmuka (misalnya, ditampilkan di halaman manajemen peran), Anda perlu mendaftarkannya menggunakan `setAvailableAction`. Operasi yang sudah terdaftar akan muncul di antarmuka konfigurasi izin, di mana administrator dapat mengonfigurasi izin operasi untuk peran yang berbeda.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nama tampilan antarmuka, mendukung internasionalisasi
  type: 'new-data',               // Tipe operasi
  onNewRecord: true,              // Apakah berlaku saat membuat catatan baru
});
```

**Deskripsi parameter:**

- **displayName**: Nama yang ditampilkan di antarmuka konfigurasi izin, mendukung internasionalisasi (menggunakan format `{{t("key")}}`).
- **type**: Tipe operasi, menentukan klasifikasi operasi ini dalam konfigurasi izin.
  - `'new-data'` : Operasi yang membuat data baru (seperti impor, tambah, dll.).
  - `'existing-data'` : Operasi yang memodifikasi data yang sudah ada (seperti perbarui, hapus, dll.).
- **onNewRecord**: Apakah berlaku saat membuat catatan baru, hanya valid untuk tipe `'new-data'`.

Setelah pendaftaran, operasi ini akan muncul di antarmuka konfigurasi izin, di mana administrator dapat mengonfigurasi izin operasi tersebut di halaman manajemen peran.