:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

Pemicu adalah titik masuk untuk sebuah alur kerja. Ketika sebuah peristiwa yang memenuhi kondisi pemicu terjadi saat aplikasi berjalan, alur kerja akan dipicu dan dieksekusi. Jenis pemicu juga merupakan jenis alur kerja, yang dipilih saat membuat alur kerja, dan tidak dapat diubah setelah dibuat. Jenis pemicu yang saat ini didukung adalah sebagai berikut:

- [Peristiwa Koleksi](./collection) (Bawaan)
- [Jadwal](./schedule) (Bawaan)
- [Sebelum Aksi](./pre-action) (Disediakan oleh plugin @nocobase/plugin-workflow-request-interceptor)
- [Setelah Aksi](./post-action) (Disediakan oleh plugin @nocobase/plugin-workflow-action-trigger)
- [Aksi Kustom](./custom-action) (Disediakan oleh plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Persetujuan](./approval) (Disediakan oleh plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Disediakan oleh plugin @nocobase/plugin-workflow-webhook)

Waktu pemicuan setiap peristiwa ditunjukkan pada gambar di bawah ini:

![Peristiwa Alur Kerja](https://static-docs.nocobase.com/20251029221709.png)

Misalnya, ketika pengguna mengirimkan formulir, atau ketika data dalam sebuah koleksi berubah karena tindakan pengguna atau panggilan program, atau ketika tugas terjadwal mencapai waktu eksekusinya, sebuah alur kerja yang telah dikonfigurasi dapat dipicu.

Pemicu yang terkait dengan data (seperti aksi, peristiwa koleksi) biasanya membawa data konteks pemicu. Data ini berfungsi sebagai variabel dan dapat digunakan oleh node dalam alur kerja sebagai parameter pemrosesan untuk mencapai pemrosesan data otomatis. Misalnya, ketika pengguna mengirimkan formulir, jika tombol kirim terikat pada sebuah alur kerja, alur kerja tersebut akan dipicu dan dieksekusi. Data yang dikirimkan akan disuntikkan ke lingkungan konteks rencana eksekusi agar dapat digunakan oleh node berikutnya sebagai variabel.

Setelah membuat alur kerja, pada halaman tampilan alur kerja, pemicu akan ditampilkan sebagai node masuk di awal proses. Mengklik kartu ini akan membuka laci konfigurasi. Bergantung pada jenis pemicu, Anda dapat mengonfigurasi kondisi yang relevan.

![Pemicu_Node Masuk](https://static-docs.nocobase.com/20251029222231.png)