---
title: "ctx.logger"
description: "ctx.logger adalah instance logger RunJS, untuk output log berjenjang seperti debug, info, warn, error."
keywords: "ctx.logger,log,debug,info,warn,error,RunJS,NocoBase"
---

# ctx.logger

Wrapper log berbasis [pino](https://github.com/pinojs/pino), menyediakan log JSON terstruktur berkinerja tinggi. Direkomendasikan menggunakan `ctx.logger` sebagai pengganti `console` untuk pengumpulan dan analisis log yang lebih mudah.

## Skenario Penggunaan

Semua skenario RunJS dapat menggunakan `ctx.logger`, untuk debugging, error tracking, performance analysis, dll.

## Definisi Tipe

```ts
logger: pino.Logger;
```

`ctx.logger` adalah `engine.logger.child({ module: 'flow-engine' })`, yaitu pino child logger dengan konteks `module`.

## Level Log

pino mendukung level berikut (dari tertinggi ke terendah):

| Level | Method | Deskripsi |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Error fatal, biasanya menyebabkan proses keluar |
| `error` | `ctx.logger.error()` | Error, menunjukkan request atau operasi gagal |
| `warn` | `ctx.logger.warn()` | Peringatan, menunjukkan risiko potensial atau situasi tidak normal |
| `info` | `ctx.logger.info()` | Informasi runtime umum |
| `debug` | `ctx.logger.debug()` | Informasi debugging, untuk development |
| `trace` | `ctx.logger.trace()` | Tracing detail, untuk diagnosis mendalam |

## Penulisan yang Direkomendasikan

Direkomendasikan menggunakan bentuk `level(msg, meta)`: pesan di depan, objek metadata opsional di belakang.

```ts
ctx.logger.info('Block selesai dimuat');
ctx.logger.info('Operasi berhasil', { recordId: 456 });
ctx.logger.warn('Peringatan performa', { duration: 5000 });
ctx.logger.error('Operasi gagal', { userId: 123, action: 'create' });
ctx.logger.error('Request gagal', { err });
```

pino juga mendukung `level(meta, msg)` (objek di depan) atau `level({ msg, ...meta })` (objek tunggal), dapat digunakan sesuai kebutuhan.

## Contoh

### Penggunaan Dasar

```ts
ctx.logger.info('Block selesai dimuat');
ctx.logger.warn('Request gagal, gunakan cache', { err });
ctx.logger.debug('Sedang menyimpan', { recordId: ctx.record?.id });
```

### Menggunakan child() untuk Membuat Sub-logger

```ts
// Membuat sub-logger dengan konteks untuk logika saat ini
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Eksekusi langkah 1');
log.debug('Eksekusi langkah 2', { step: 2 });
```

### Hubungan dengan console

Direkomendasikan langsung menggunakan `ctx.logger` untuk mendapatkan log JSON terstruktur. Jika terbiasa menggunakan `console`, dapat disesuaikan: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Format Log

pino menghasilkan output JSON terstruktur, setiap log berisi:

- `level`: level log (numerik)
- `time`: timestamp (milidetik)
- `msg`: pesan log
- `module`: tetap `flow-engine`
- Field kustom lainnya (diteruskan melalui objek)

## Hal yang Perlu Diperhatikan

- Log adalah JSON terstruktur, untuk pengumpulan, pencarian, dan analisis yang lebih mudah
- Sub-logger yang dibuat melalui `child()` juga direkomendasikan menggunakan penulisan `level(msg, meta)`
- Sebagian environment runtime (seperti workflow) mungkin menggunakan cara output log yang berbeda

## Terkait

- [pino](https://github.com/pinojs/pino) — Library log dasar
