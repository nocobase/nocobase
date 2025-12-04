:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Logger

NocoBase menyediakan sistem pencatatan (logging) berkinerja tinggi yang didasarkan pada [pino](https://github.com/pinojs/pino). Di mana pun Anda memiliki akses ke `context`, Anda bisa mendapatkan instance logger melalui `ctx.logger` untuk mencatat log penting selama runtime plugin atau sistem.

## Penggunaan Dasar

```ts
// Mencatat kesalahan fatal (misalnya: kegagalan inisialisasi)
ctx.logger.fatal('Inisialisasi aplikasi gagal', { error });

// Mencatat kesalahan umum (misalnya: kesalahan permintaan API)
ctx.logger.error('Gagal memuat data', { status, message });

// Mencatat informasi peringatan (misalnya: risiko kinerja atau anomali operasi pengguna)
ctx.logger.warn('Formulir saat ini berisi perubahan yang belum disimpan');

// Mencatat informasi runtime umum (misalnya: komponen selesai dimuat)
ctx.logger.info('Komponen profil pengguna selesai dimuat');

// Mencatat informasi debug (misalnya: perubahan status)
ctx.logger.debug('Status pengguna saat ini', { user });

// Mencatat informasi pelacakan rinci (misalnya: alur rendering)
ctx.logger.trace('Komponen selesai dirender', { component: 'UserProfile' });
```

Metode-metode ini sesuai dengan level log yang berbeda (dari tinggi ke rendah):

| Level   | Metode              | Deskripsi |
| ------- | ------------------- | ----------- |
| `fatal` | `ctx.logger.fatal()` | Kesalahan fatal, biasanya menyebabkan program berhenti |
| `error` | `ctx.logger.error()` | Log kesalahan, menunjukkan kegagalan permintaan atau operasi |
| `warn`  | `ctx.logger.warn()`  | Informasi peringatan, memberi tahu potensi risiko atau situasi tak terduga |
| `info`  | `ctx.logger.info()`  | Informasi runtime umum |
| `debug` | `ctx.logger.debug()` | Informasi debug, digunakan untuk lingkungan pengembangan |
| `trace` | `ctx.logger.trace()` | Informasi pelacakan rinci, biasanya untuk diagnosis mendalam |

## Format Log

Setiap output log dalam format JSON terstruktur, secara default berisi bidang-bidang berikut:

| Bidang     | Tipe   | Deskripsi |
| --------- | ------ | ----------- |
| `level`   | number | Level log   |
| `time`    | number | Timestamp (milidetik) |
| `pid`     | number | ID Proses  |
| `hostname` | string | Nama host    |
| `msg`     | string | Pesan log |
| Lainnya    | object | Informasi konteks kustom |

Contoh output:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Pengikatan Konteks (Context Binding)

`ctx.logger` secara otomatis menyuntikkan informasi konteks, seperti plugin, modul, atau sumber permintaan saat ini, membuat log lebih akurat dalam melacak sumbernya.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Contoh output (dengan konteks):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger Kustom

Anda dapat membuat instance logger kustom di dalam plugin, mewarisi atau memperluas konfigurasi default:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Child logger akan mewarisi konfigurasi logger utama dan secara otomatis melampirkan konteks.

## Hierarki Level Log

Level log Pino mengikuti definisi numerik dari tinggi ke rendah, di mana angka yang lebih kecil menunjukkan prioritas yang lebih rendah.
Berikut adalah tabel hierarki level log lengkap:

| Nama Level | Nilai | Nama Metode | Deskripsi |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Kesalahan fatal, biasanya menyebabkan program tidak dapat terus berjalan |
| `error` | 50 | `logger.error()` | Kesalahan umum, menunjukkan kegagalan permintaan atau pengecualian operasi |
| `warn` | 40 | `logger.warn()` | Informasi peringatan, memberi tahu potensi risiko atau situasi tak terduga |
| `info` | 30 | `logger.info()` | Informasi umum, mencatat status sistem atau operasi normal |
| `debug` | 20 | `logger.debug()` | Informasi debug, untuk analisis masalah pada tahap pengembangan |
| `trace` | 10 | `logger.trace()` | Informasi pelacakan rinci, untuk diagnosis mendalam |
| `silent` | -Infinity | (Tidak ada metode yang sesuai) | Mematikan semua output log |

Pino hanya akan mengeluarkan log yang lebih besar dari atau sama dengan konfigurasi `level` saat ini. Misalnya, ketika level log adalah `info`, log `debug` dan `trace` akan diabaikan.

## Praktik Terbaik dalam Pengembangan Plugin

1.  **Gunakan Logger Konteks**
    Gunakan `ctx.logger` dalam konteks plugin, model, atau aplikasi untuk secara otomatis membawa informasi sumber.

2.  **Bedakan Level Log**
    -   Gunakan `error` untuk mencatat pengecualian bisnis
    -   Gunakan `info` untuk mencatat perubahan status
    -   Gunakan `debug` untuk mencatat informasi debug pengembangan

3.  **Hindari Logging Berlebihan**
    Terutama pada level `debug` dan `trace`, disarankan untuk hanya mengaktifkannya di lingkungan pengembangan.

4.  **Gunakan Data Terstruktur**
    Teruskan parameter objek daripada menggabungkan string, yang membantu analisis dan pemfilteran log.

Dengan mengikuti praktik-praktik di atas, pengembang dapat melacak eksekusi plugin dengan lebih efisien, memecahkan masalah, dan menjaga sistem log tetap terstruktur serta dapat diperluas.