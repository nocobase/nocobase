:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/logger).
:::

# ctx.logger

Pembungkus (wrapper) log berbasis [pino](https://github.com/pinojs/pino), menyediakan log JSON terstruktur berperforma tinggi. Direkomendasikan untuk menggunakan `ctx.logger` alih-alih `console` guna memudahkan pengumpulan dan analisis log.

## Skenario Penggunaan

`ctx.logger` dapat digunakan di semua skenario RunJS untuk debugging, pelacakan kesalahan, analisis performa, dan lain-lain.

## Definisi Tipe

```ts
logger: pino.Logger;
```

`ctx.logger` adalah `engine.logger.child({ module: 'flow-engine' })`, yaitu child logger pino dengan konteks `module`.

## Tingkat Log (Log Levels)

pino mendukung tingkat berikut (dari tertinggi ke terendah):

| Tingkat | Metode | Keterangan |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Kesalahan fatal, biasanya menyebabkan proses berhenti |
| `error` | `ctx.logger.error()` | Kesalahan, menunjukkan kegagalan permintaan atau operasi |
| `warn` | `ctx.logger.warn()` | Peringatan, menunjukkan potensi risiko atau situasi abnormal |
| `info` | `ctx.logger.info()` | Informasi runtime umum |
| `debug` | `ctx.logger.debug()` | Informasi debugging, digunakan selama pengembangan |
| `trace` | `ctx.logger.trace()` | Pelacakan mendetail, digunakan untuk diagnosis mendalam |

## Penulisan yang Direkomendasikan

Format yang direkomendasikan adalah `level(msg, meta)`: pesan di awal, diikuti oleh objek metadata opsional.

```ts
ctx.logger.info('Pemuatan blok selesai');
ctx.logger.info('Operasi berhasil', { recordId: 456 });
ctx.logger.warn('Peringatan performa', { duration: 5000 });
ctx.logger.error('Operasi gagal', { userId: 123, action: 'create' });
ctx.logger.error('Permintaan gagal', { err });
```

pino juga mendukung `level(meta, msg)` (objek di awal) atau `level({ msg, ...meta })` (objek tunggal), yang dapat digunakan sesuai kebutuhan.

## Contoh

### Penggunaan Dasar

```ts
ctx.logger.info('Pemuatan blok selesai');
ctx.logger.warn('Permintaan gagal, menggunakan cache', { err });
ctx.logger.debug('Sedang menyimpan...', { recordId: ctx.record?.id });
```

### Menggunakan child() untuk Membuat Child Logger

```ts
// Membuat child logger dengan konteks untuk logika saat ini
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Mengeksekusi langkah 1');
log.debug('Mengeksekusi langkah 2', { step: 2 });
```

### Hubungan dengan console

Direkomendasikan untuk menggunakan `ctx.logger` secara langsung guna mendapatkan log JSON terstruktur. Jika Anda terbiasa menggunakan `console`, padanannya adalah: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Format Log

pino menghasilkan JSON terstruktur, di mana setiap entri log berisi:

- `level`: Tingkat log (numerik)
- `time`: Timestamp (milidetik)
- `msg`: Pesan log
- `module`: Tetap sebagai `flow-engine`
- Bidang kustom lainnya (dikirim melalui objek)

## Catatan

- Log berupa JSON terstruktur, sehingga mudah dikumpulkan, dicari, dan dianalisis.
- Child logger yang dibuat melalui `child()` juga direkomendasikan menggunakan format `level(msg, meta)`.
- Beberapa lingkungan runtime (seperti alur kerja) mungkin menggunakan metode output log yang berbeda.

## Terkait

- [pino](https://github.com/pinojs/pino) — Pustaka logging yang mendasarinya.