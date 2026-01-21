:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

Pengembangan plugin sisi klien NocoBase menawarkan beragam fungsionalitas dan kemampuan untuk membantu pengembang menyesuaikan dan memperluas fitur frontend NocoBase. Berikut adalah kemampuan utama dan bab terkait dalam pengembangan plugin sisi klien NocoBase:

| Modul                  | Deskripsi                                           | Bab Terkait                                      |
|---------------------------|------------------------------------------------|-----------------------------------------------|
| **Kelas Plugin**               | Membuat dan mengelola plugin sisi klien, memperluas fungsionalitas frontend             | [plugin.md](plugin.md)                       |
| **Router**               | Menyesuaikan routing frontend, mengimplementasikan navigasi dan pengalihan halaman             | [router.md](router.md)                       |
| **Sumber Daya**               | Mengelola sumber daya frontend, menangani pengambilan dan operasi data               | [resource.md](resource.md)                   |
| **Permintaan**               | Menyesuaikan permintaan HTTP, menangani panggilan API dan transmisi data      | [request.md](request.md)                     |
| **Konteks**             | Mendapatkan dan menggunakan konteks aplikasi, mengakses status dan layanan global       | [context.md](context.md)                     |
| **ACL**               | Mengimplementasikan kontrol akses frontend, mengontrol izin akses halaman dan fitur     | [acl.md](acl.md)                             |
| **Manajer Sumber Data**             | Mengelola dan menggunakan beberapa sumber data, mengimplementasikan pengalihan dan akses sumber data | [data-source-manager.md](data-source-manager.md) |
| **Gaya & Tema**             | Menyesuaikan gaya dan tema, mengimplementasikan kustomisasi dan estetika antarmuka pengguna           | [styles-themes.md](styles-themes.md)          |
| **I18n**             | Mengintegrasikan dukungan multi-bahasa, mengimplementasikan internasionalisasi dan lokalisasi             | [i18n.md](i18n.md)                            |
| **Pencatat Log**               | Menyesuaikan format dan metode output log, meningkatkan kemampuan debugging dan pemantauan   | [logger.md](logger.md)                        |
| **Pengujian**           | Menulis dan menjalankan kasus uji, memastikan stabilitas plugin dan akurasi fungsional | [test.md](test.md)                            |

Ekstensi UI

| Modul      | Deskripsi                                                                                   | Bab Terkait                                      |
|---------------|----------------------------------------------------------------------------------------|-----------------------------------------------|
| **Konfigurasi UI**  | Menggunakan FlowEngine dan model alur untuk mengimplementasikan konfigurasi dan orkestrasi properti komponen secara dinamis, mendukung kustomisasi visual halaman dan interaksi yang kompleks   | [FlowEngine](../../flow-engine/index.md) dan [model alur](../../flow-engine/flow-model.md) |
| **Ekstensi Blok**  | Menyesuaikan blok halaman, membuat modul dan tata letak UI yang dapat digunakan kembali                                         | [blok](../../ui-development-block/index.md) |
| **Ekstensi Bidang**  | Menyesuaikan tipe bidang, mengimplementasikan tampilan dan pengeditan data yang kompleks  | [bidang](../../ui-development-field/index.md) |
| **Ekstensi Aksi**  | Menyesuaikan tipe aksi, mengimplementasikan logika kompleks dan penanganan interaksi  | [aksi](../../ui-development-action/index.md) |