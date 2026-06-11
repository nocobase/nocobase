---
title: "ACL Kontrol Hak Akses (Server)"
description: "ACL server NocoBase: registerSnippet, allow/deny, snippet hak akses, hak akses role, middleware, penilaian kondisi."
keywords: "ACL,kontrol hak akses,registerSnippet,allow,deny,snippet hak akses,hak akses role,NocoBase"
---

# ACL Kontrol Hak Akses

ACL (Access Control List) digunakan untuk mengontrol hak akses operasi resource. Anda dapat memberikan hak akses ke role, atau melewati batasan role untuk membatasi hak akses secara langsung. Sistem ACL menyediakan mekanisme manajemen hak akses yang fleksibel, mendukung berbagai cara seperti snippet hak akses, middleware, penilaian kondisi, dll.

:::tip Tips

Objek ACL milik data source (`dataSource.acl`), ACL data source utama dapat diakses cepat melalui `app.acl`. Cara penggunaan ACL data source lain lihat [DataSourceManager Manajemen Data Source](./data-source-manager.md).

:::

## Mendaftarkan Snippet Hak Akses (Snippet)

Snippet hak akses (Snippet) dapat mendaftarkan kombinasi hak akses umum sebagai unit hak akses yang dapat digunakan kembali. Setelah role diikat dengan Snippet, akan mendapatkan satu set hak akses yang sesuai, mengurangi konfigurasi yang berulang.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Prefix ui.* berarti hak akses yang diizinkan untuk dikonfigurasi di antarmuka
  actions: ['customRequests:*'], // Operasi resource yang sesuai, mendukung wildcard
});
```

## Hak Akses yang Melewati Batasan Role (allow)

`acl.allow()` digunakan untuk membuat operasi tertentu melewati batasan role, cocok untuk API publik, skenario yang memerlukan penilaian hak akses dinamis, atau situasi yang memerlukan penilaian hak akses berdasarkan konteks request.

```ts
// Akses publik, tanpa perlu login
acl.allow('app', 'getLang', 'public');

// Pengguna yang sudah login dapat mengakses
acl.allow('app', 'getInfo', 'loggedIn');

// Penilaian berdasarkan kondisi kustom
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Penjelasan parameter condition:**

- `'public'`: Pengguna mana pun (termasuk yang belum login) dapat mengakses, tanpa verifikasi identitas apa pun
- `'loggedIn'`: Hanya pengguna yang sudah login dapat mengakses, memerlukan identitas pengguna yang valid
- `(ctx) => Promise<boolean>` atau `(ctx) => boolean`: Function kustom, secara dinamis menentukan apakah mengizinkan akses berdasarkan konteks request, dapat mengimplementasikan logika hak akses yang kompleks

## Mendaftarkan Middleware Hak Akses (use)

`acl.use()` digunakan untuk mendaftarkan middleware hak akses kustom, dapat menyisipkan logika kustom ke dalam alur pemeriksaan hak akses. Biasanya digunakan bersama dengan `ctx.permission`, untuk aturan hak akses kustom. Cocok untuk skenario yang memerlukan kontrol hak akses non-konvensional, seperti form publik yang memerlukan verifikasi password kustom, penilaian hak akses dinamis berdasarkan parameter request, dll.

**Skenario penggunaan tipikal:**

- Skenario form publik: Tanpa pengguna tanpa role, tetapi perlu membatasi hak akses melalui password kustom
- Kontrol hak akses berdasarkan parameter request, alamat IP, dan kondisi lainnya
- Aturan hak akses kustom, melewati atau memodifikasi alur pemeriksaan hak akses default

**Mengontrol hak akses melalui `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Contoh: Form publik perlu memverifikasi password lalu melewati pemeriksaan hak akses
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verifikasi berhasil, lewati pemeriksaan hak akses
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Eksekusi pemeriksaan hak akses (lanjutkan alur ACL)
  await next();
});
```

**Penjelasan property `ctx.permission`:**

- `skip: true`: Lewati pemeriksaan hak akses ACL berikutnya, langsung izinkan akses
- Dapat diatur secara dinamis dalam middleware berdasarkan logika kustom, untuk implementasi kontrol hak akses yang fleksibel

## Menambahkan Pembatasan Data Tetap untuk Operasi Tertentu (addFixedParams)

`addFixedParams` dapat menambahkan pembatasan rentang data tetap (filter) untuk operasi resource tertentu, pembatasan ini akan langsung berlaku melewati batasan role, biasanya digunakan untuk melindungi data kunci sistem.

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

// Bahkan jika pengguna memiliki hak akses untuk menghapus role, juga tidak dapat menghapus role sistem root, admin, member ini
```

:::tip Tips

`addFixedParams` dapat digunakan untuk mencegah data sensitif dihapus atau dimodifikasi secara tidak sengaja, seperti role bawaan sistem, akun administrator, dll. Pembatasan ini akan berlaku berlapis dengan hak akses role, memastikan bahkan dengan hak akses pun tidak dapat mengoperasikan data yang dilindungi.

:::

## Menilai Hak Akses (can)

`acl.can()` digunakan untuk menilai apakah suatu role memiliki hak akses untuk mengeksekusi operasi yang ditentukan, mengembalikan objek hasil hak akses atau `null`. Biasanya digunakan dalam middleware atau Handler operasi, secara dinamis menentukan apakah mengizinkan eksekusi operasi tertentu berdasarkan role.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Dapat memasukkan single role atau array role
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Role ${result.role} dapat mengeksekusi operasi ${result.action}`);
  // result.params berisi parameter tetap yang ditetapkan melalui addFixedParams
  console.log('Parameter tetap:', result.params);
} else {
  console.log('Tidak ada hak akses untuk mengeksekusi operasi tersebut');
}
```

:::tip Tips

Jika memasukkan beberapa role, akan memeriksa setiap role secara berurutan, mengembalikan hasil gabungan role.

:::

**Definisi tipe:**

```ts
interface CanArgs {
  role?: string;      // Single role
  roles?: string[];   // Multiple role (akan diperiksa secara berurutan, mengembalikan role pertama yang memiliki hak akses)
  resource: string;   // Nama resource
  action: string;    // Nama operasi
}

interface CanResult {
  role: string;       // Role yang memiliki hak akses
  resource: string;   // Nama resource
  action: string;    // Nama operasi
  params?: any;       // Informasi parameter tetap (jika diatur melalui addFixedParams)
}
```

## Mendaftarkan Operasi yang Dapat Dikonfigurasi (setAvailableAction)

Jika Anda ingin operasi kustom dapat dikonfigurasi hak aksesnya di antarmuka (misalnya ditampilkan di halaman "Manajemen Role"), perlu menggunakan `setAvailableAction` untuk mendaftarkan. Operasi yang sudah didaftarkan akan muncul di antarmuka konfigurasi hak akses, administrator dapat mengkonfigurasi hak akses operasi untuk role yang berbeda di antarmuka.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nama tampilan antarmuka, mendukung internasionalisasi
  type: 'new-data',               // Tipe operasi
  onNewRecord: true,              // Apakah berlaku saat record baru dibuat
});
```

**Penjelasan parameter:**

- **displayName**: Nama yang ditampilkan di antarmuka konfigurasi hak akses, mendukung internasionalisasi (menggunakan format `{{t("key")}}`)
- **type**: Tipe operasi, menentukan kategori operasi tersebut dalam konfigurasi hak akses
  - `'new-data'`: Operasi membuat data baru (seperti import, tambah, dll.)
  - `'existing-data'`: Operasi memodifikasi data yang ada (seperti update, delete, dll.)
- **onNewRecord**: Apakah berlaku saat record baru dibuat, hanya valid untuk tipe `'new-data'`

Setelah didaftarkan, operasi tersebut akan muncul di antarmuka konfigurasi hak akses, administrator dapat mengkonfigurasi hak akses operasi tersebut di halaman "Manajemen Role".

## Tautan Terkait

- [ResourceManager Manajemen Resource](./resource-manager.md) — Mendaftarkan API kustom dan operasi resource
- [Plugin](./plugin.md) — Mendaftarkan hak akses dalam siklus hidup plugin
- [Context Konteks Request](./context.md) — Mendapatkan role saat ini dan informasi hak akses dalam request
- [Middleware](./middleware.md) — Registrasi dan penggunaan middleware ACL
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Setiap data source memiliki instance ACL independen
