:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Peningkatan Instalasi Docker

:::warning Sebelum Melakukan Peningkatan

- Pastikan untuk mencadangkan basis data Anda terlebih dahulu.

:::

## 1. Beralih ke Direktori docker-compose.yml

Contoh:

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Perbarui Nomor Versi Image

:::tip Tentang Nomor Versi

- Versi alias, seperti `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, umumnya tidak perlu diubah.
- Nomor versi numerik, seperti `1.7.14`, `1.7.14-full`, perlu diubah ke nomor versi target.
- Hanya peningkatan yang didukung; penurunan versi tidak didukung!!!
- Di lingkungan produksi, disarankan untuk menggunakan versi numerik spesifik untuk menghindari peningkatan otomatis yang tidak disengaja. [Lihat semua versi](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Direkomendasikan menggunakan mirror Aliyun (jaringan di Indonesia mungkin lebih stabil)
    image: nocobase/nocobase:1.7.14-full
    # Anda juga bisa menggunakan versi alias (mungkin otomatis diperbarui, gunakan dengan hati-hati di lingkungan produksi)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (di Indonesia mungkin lambat/gagal)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Mulai Ulang Kontainer

```bash
# Tarik image terbaru
docker compose pull app

# Buat ulang kontainer
docker compose up -d app

# Periksa status proses aplikasi
docker compose logs -f app
```

## 4. Peningkatan Plugin Pihak Ketiga

Lihat [Instalasi dan Peningkatan Plugin](../install-upgrade-plugins.mdx)

## 5. Instruksi Rollback

NocoBase tidak mendukung penurunan versi. Jika Anda perlu melakukan rollback, harap pulihkan cadangan basis data dari sebelum peningkatan dan ubah kembali versi image ke versi semula.

## 6. Pertanyaan yang Sering Diajukan (FAQ)

**Q: Penarikan image lambat atau gagal**

Gunakan akselerator mirror, atau gunakan mirror Aliyun `nocobase/nocobase:<tag>`. Ini sering disebabkan oleh masalah jaringan.

**Q: Versi belum berubah**

Pastikan Anda telah mengubah `image` ke nomor versi baru dan berhasil menjalankan `docker compose pull app` serta `up -d app`.

**Q: Pengunduhan atau pembaruan plugin komersial gagal**

Untuk plugin komersial, harap verifikasi kunci lisensi di sistem, lalu mulai ulang kontainer Docker. Untuk detailnya, lihat [Panduan Aktivasi Lisensi Komersial NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).