:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

Pengembangan plugin sisi server NocoBase menyediakan berbagai fungsionalitas dan kemampuan untuk membantu pengembang menyesuaikan dan memperluas fitur inti NocoBase. Berikut adalah kemampuan utama dan bab terkait dalam pengembangan plugin sisi server NocoBase:

| Modul Fungsionalitas                  | Deskripsi                                           | Bab Terkait                                      |
|---------------------------------------|-----------------------------------------------------|--------------------------------------------------|
| **Kelas Plugin**                      | Membuat dan mengelola plugin sisi server, serta memperluas fungsionalitas inti             | [plugin.md](plugin.md)                       |
| **Operasi Database**                  | Menyediakan antarmuka untuk operasi database, mendukung operasi CRUD dan manajemen transaksi | [database.md](database.md)                    |
| **Koleksi Kustom**                    | Menyesuaikan struktur koleksi berdasarkan kebutuhan bisnis untuk manajemen model data yang fleksibel | [collections.md](collections.md)              |
| **Kompatibilitas Data Peningkatan Plugin** | Memastikan peningkatan plugin tidak memengaruhi data yang ada dengan melakukan migrasi data dan penanganan kompatibilitas | [migration.md](migration.md)                  |
| **Manajemen Sumber Data Eksternal**   | Mengintegrasikan dan mengelola sumber data eksternal untuk memungkinkan interaksi data             | [data-source-manager.md](data-source-manager.md) |
| **API Kustom**                        | Memperluas manajemen sumber daya API dengan menulis antarmuka kustom               | [resource-manager.md](resource-manager.md)    |
| **Manajemen Izin API**                | Menyesuaikan izin API untuk kontrol akses yang terperinci             | [acl.md](acl.md)                              |
| **Intersepsi dan Pemfilteran Permintaan/Respons** | Menambahkan interseptor atau middleware permintaan dan respons untuk menangani tugas seperti pencatatan log, autentikasi, dll. | [context.md](context.md) dan [middleware.md](middleware.md) |
| **Mendengarkan Peristiwa (Event Listening)** | Mendengarkan peristiwa sistem (misalnya, dari aplikasi atau database) dan memicu penangan yang sesuai       | [event.md](event.md)                          |
| **Manajemen Cache**                   | Mengelola cache untuk meningkatkan kinerja aplikasi dan kecepatan respons               | [cache.md](cache.md)                          |
| **Tugas Terjadwal**                   | Membuat dan mengelola tugas terjadwal, seperti pembersihan berkala, sinkronisasi data, dll.     | [cron-job-manager.md](cron-job-manager.md)    |
| **Dukungan Multi-bahasa**             | Mengintegrasikan dukungan multi-bahasa untuk mengimplementasikan internasionalisasi dan lokalisasi             | [i18n.md](i18n.md)                            |
| **Output Log**                        | Menyesuaikan format log dan metode output untuk meningkatkan kemampuan debugging dan pemantauan   | [logger.md](logger.md)                        |
| **Perintah Kustom**                   | Memperluas NocoBase CLI dengan menambahkan perintah kustom               | [command.md](command.md)                      |
| **Menulis Kasus Uji**                 | Menulis dan menjalankan kasus uji untuk memastikan stabilitas plugin dan akurasi fungsional | [test.md](test.md)                            |