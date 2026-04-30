---
title: "ctx.t()"
description: "ctx.t() adalah method translasi internasionalisasi RunJS, mengembalikan teks bahasa saat ini berdasarkan key."
keywords: "ctx.t,internasionalisasi,translasi,teks multi-bahasa,RunJS,NocoBase"
---

# ctx.t()

Function cepat i18n untuk menerjemahkan teks di RunJS, berdasarkan pengaturan bahasa konteks saat ini. Cocok untuk internasionalisasi teks inline seperti tombol, judul, tip.

## Skenario Penggunaan

Semua environment eksekusi RunJS dapat menggunakan `ctx.t()`.

## Definisi Tipe

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameter

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `key` | `string` | Key translasi atau template dengan placeholder (seperti `Hello {{name}}`, `{{count}} rows`) |
| `options` | `object` | Opsional. Variabel interpolasi (seperti `{ name: 'Andi', count: 5 }`), atau opsi i18n (seperti `defaultValue`, `ns`) |

## Return Value

- Mengembalikan string yang sudah diterjemahkan; jika key tidak memiliki translasi yang sesuai dan tidak menyediakan `defaultValue`, mungkin mengembalikan key itu sendiri atau string setelah interpolasi.

## Namespace (ns)

**Namespace default environment RunJS adalah `runjs`**. Saat tidak menentukan `ns`, `ctx.t(key)` akan mencari key dari namespace `runjs`.

```ts
// Default mengambil key dari namespace runjs
ctx.t('Submit'); // Setara dengan ctx.t('Submit', { ns: 'runjs' })

// Mengambil key dari namespace tertentu
ctx.t('Submit', { ns: 'myModule' });

// Mencari secara berurutan dari beberapa namespace (runjs dulu, kemudian common)
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Contoh

### Key Sederhana

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Dengan Variabel Interpolasi

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Teks Dinamis seperti Waktu Relatif

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Menentukan Namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Hal yang Perlu Diperhatikan

- **Plugin Lokalisasi**: jika perlu menerjemahkan teks, perlu mengaktifkan plugin lokalisasi terlebih dahulu. Frase yang tidak memiliki translasi akan otomatis diekstrak ke list manajemen lokalisasi, untuk pemeliharaan dan translasi yang lebih mudah.
- Mendukung interpolasi gaya i18next: gunakan `{{nama-variabel}}` di key, teruskan variabel dengan nama yang sama di `options` untuk menggantikan.
- Bahasa ditentukan oleh konteks saat ini (seperti `ctx.i18n.language`, locale user).

## Terkait

- [ctx.i18n](./i18n.md): Membaca atau berpindah bahasa
