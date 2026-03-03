:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/t).
:::

# ctx.t()

Fungsi pintasan i18n yang digunakan dalam RunJS untuk menerjemahkan teks berdasarkan pengaturan bahasa pada konteks saat ini. Cocok untuk internasionalisasi teks inline seperti tombol, judul, dan petunjuk.

## Skenario Penggunaan

`ctx.t()` dapat digunakan di semua lingkungan eksekusi RunJS.

## Definisi Tipe

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-------------|
| `key` | `string` | Key terjemahan atau templat dengan placeholder (misalnya `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Opsional. Variabel interpolasi (misalnya `{ name: 'Budi', count: 5 }`), atau opsi i18n (misalnya `defaultValue`, `ns`). |

## Nilai Kembalian

- Mengembalikan string yang telah diterjemahkan. Jika tidak ada terjemahan untuk key tersebut dan `defaultValue` tidak disediakan, fungsi ini mungkin mengembalikan key itu sendiri atau string hasil interpolasi.

## Namespace (ns)

**Namespace default untuk lingkungan RunJS adalah `runjs`**. Jika `ns` tidak ditentukan, `ctx.t(key)` akan mencari key dalam namespace `runjs`.

```ts
// Secara default mengambil key dari namespace 'runjs'
ctx.t('Submit'); // Ekuivalen dengan ctx.t('Submit', { ns: 'runjs' })

// Mengambil key dari namespace tertentu
ctx.t('Submit', { ns: 'myModule' });

// Mencari di beberapa namespace secara berurutan (pertama 'runjs', kemudian 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Contoh

### Key sederhana

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Dengan variabel interpolasi

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Teks dinamis (misalnya waktu relatif)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Menentukan namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Catatan

- **Plugin Lokalisasi**: Untuk menerjemahkan teks, plugin Lokalisasi harus diaktifkan terlebih dahulu. Key terjemahan yang hilang akan secara otomatis diekstrak ke daftar manajemen lokalisasi untuk memudahkan pemeliharaan dan penerjemahan terpadu.
- Mendukung interpolasi gaya i18next: Gunakan `{{namaVariabel}}` dalam key dan masukkan variabel dengan nama yang sama dalam `options` untuk menggantinya.
- Bahasa ditentukan oleh konteks saat ini (misalnya `ctx.i18n.language`, locale pengguna).

## Terkait

- [ctx.i18n](./i18n.md): Membaca atau mengganti bahasa