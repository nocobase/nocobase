:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Deployment di Lingkungan Produksi

Saat melakukan deployment NocoBase di lingkungan produksi, instalasi dependensi bisa jadi rumit karena perbedaan dalam metode pembangunan di berbagai sistem dan lingkungan. Untuk mendapatkan pengalaman fungsional yang lengkap, kami merekomendasikan deployment menggunakan **Docker**. Jika lingkungan sistem Anda tidak dapat menggunakan Docker, Anda juga dapat melakukan deployment menggunakan **create-nocobase-app**.

:::warning
Tidak disarankan untuk melakukan deployment langsung dari kode sumber di lingkungan produksi. Kode sumber memiliki banyak dependensi, ukurannya besar, dan kompilasi penuh membutuhkan CPU dan memori yang tinggi. Jika Anda benar-benar perlu melakukan deployment dari kode sumber, disarankan untuk membuat *image* Docker kustom terlebih dahulu, lalu melakukan deployment.
:::

## Proses Deployment

Untuk deployment di lingkungan produksi, Anda dapat merujuk pada langkah-langkah instalasi dan pembaruan yang sudah ada.

### Instalasi Baru

- [Instalasi Docker](../installation/docker.mdx)
- [Instalasi create-nocobase-app](../installation/create-nocobase-app.mdx)

### Memperbarui Aplikasi

- [Pembaruan Instalasi Docker](../installation/docker.mdx)
- [Pembaruan Instalasi create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalasi dan Pembaruan Plugin Pihak Ketiga

- [Instalasi dan Pembaruan Plugin](../install-upgrade-plugins.mdx)

## Proksi Aset Statis

Di lingkungan produksi, disarankan untuk mengelola aset statis dengan server proksi, misalnya:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Perintah Operasi Umum

Bergantung pada metode instalasi yang berbeda, Anda dapat menggunakan perintah berikut untuk mengelola proses NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)