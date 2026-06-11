# nb maksud desain aplikasi

Perintah terkait `nb app` pada dasarnya merupakan adaptasi berdasarkan metode manajemen proses yang berbeda, dan kemudian disatukan menjadi satu set pintu masuk manajemen aplikasi yang stabil. Tujuannya adalah untuk mencoba menyatukan penggunaan mental selama pengoperasian dan pemeliharaan sehari-hari ke dalam serangkaian perintah.

Saat ini, metode manajemen proses aplikasi yang didukung oleh CLI terutama meliputi:

- buruh pelabuhan
-PM2

Jika kami perlu mendukung lebih banyak metode di masa mendatang, seperti Supervisor, kami akan terus melakukan adaptasi pada lapisan ini. Pintu masuk perintah frekuensi tinggi yang terpapar ke dunia luar tetap sama:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Mengapa kita harus menyatukannya menjadi `nb app`

Manajemen proses dapat diterapkan dengan banyak cara, namun bagi sebagian besar pengguna, yang benar-benar mereka pedulikan bukanlah apa yang digunakan di lapisan bawah, namun tindakan spesifik seperti "Saya ingin memulai aplikasi", "Saya ingin membaca log", dan "Saya ingin mengupgrade aplikasi".

Jika perbedaan mendasar terungkap secara langsung, pengguna harus terlebih dahulu menentukan mode operasi mana yang sedang mereka gunakan, lalu mengingat serangkaian metode operasi yang sesuai. Setelah disatukan menjadi `nb app`, tindakan frekuensi tinggi ini dapat menyatu menjadi serangkaian pintu masuk yang stabil.

### Mengurangi biaya pembelajaran

Solusi manajemen proses yang berbeda beroperasi dengan cara yang berbeda:

- Docker memiliki sistem perintah Docker
- PM2 memiliki sistem perintah PM2
- Supervisor juga memiliki metode konfigurasinya sendiri

Jika perbedaan ini terlihat secara langsung, pengguna perlu mempelajari beberapa metode penggunaan, dan akan lebih mudah untuk melewatkan langkah-langkah penting dalam skenario frekuensi tinggi seperti peningkatan versi, mulai ulang, dan pemecahan masalah log.

Setelah penyatuan sebagai `nb app`, sebagian besar manajemen harian hanya memerlukan penguasaan satu set perintah.

### Menyatukan proses bisnis

Manajemen siklus hidup aplikasi bukan hanya tentang manajemen proses.

Dalam proses seperti memulai, meningkatkan, dan menghentikan, CLI sering kali perlu menangani logika tambahan, seperti:

- Inspeksi lingkungan
- Pemrosesan konfigurasi
- Migrasi data
- Peningkatan versi
- Manajemen log

Dengan menggunakan `nb app` sebagai pintu masuk terpadu, Anda dapat memastikan bahwa perilaku proses ini konsisten. Jika Anda terus memperluas kemampuan Anda di masa mendatang, Anda tidak perlu mempelajari kembali pintu masuk pengoperasian dan pemeliharaan yang baru.

## Mengapa `nb app autostart` masih dibutuhkan?

Setelah memiliki pintu masuk manajemen proses terpadu, lapisan lain dari kemampuan "manajemen memulai sendiri" perlu ditambahkan untuk menyelesaikan seluruh proses. Inilah sebabnya mengapa `nb app autostart` ada.

Penggunaan umum adalah:

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

Fokus dari rangkaian perintah ini adalah untuk terus menjaga persatuan secara eksternal. Dengan kata lain, dalam benak pengguna pada lapisan `nb app` ini, Anda tidak perlu peduli apakah lapisan terbawah adalah Docker, PM2, atau metode lain yang mungkin didukung di masa mendatang. Metode operasi terpadu eksternal masih mirip dengan:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` Lapisan ini beradaptasi dengan apa?

`nb app autostart` juga dibagi menjadi dua tingkat tanggung jawab:

- `enable` / `disable` bertanggung jawab untuk mengatur apakah env tertentu mengizinkan startup otomatis
- `run` bertanggung jawab untuk menarik semua env yang mengaktifkan self-starting selama fase startup sistem.

Dengan kata lain, CLI juga akan menyediakan entri `run` terpadu untuk menyediakan akses ke mekanisme self-starting sistem:

```bash
nb app autostart run
```

Yang diadaptasi di sini adalah mekanisme startup sistem seperti `systemd`, `launchd`, dan skrip startup host, bukan pengelola proses aplikasi seperti Supervisor.

## Keseluruhan

- Perintah terkait `nb app` pada dasarnya adalah lapisan adaptasi di atas metode manajemen proses yang berbeda. Setelah disatukan secara eksternal, mereka dapat mengurangi kebingungan mental pengguna.
- Implementasi manajemen proses dapat berupa Docker, PM2, Supervisor, dll. Saat ini Docker dan PM2 sudah didukung
- Karena konfigurasi mulai mandiri dari metode manajemen proses yang berbeda berbeda, diperlukan serangkaian kemampuan `nb app autostart` yang terpadu agar seluruh proses dapat diselesaikan.

Jika Anda ingin terus melihat operasional harian, Anda dapat langsung membuka [Kelola Aplikasi](../operations/manage-app.md). Jika Anda siap untuk menyebarkan aplikasi ke lingkungan formal, Anda dapat terus melihat [Penerapan Lingkungan Produksi](../production/index.md).
