---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/multi-app/multi-app/index).
:::

# Manajemen Multi-aplikasi

## Ringkasan Fitur

Manajemen multi-aplikasi adalah solusi manajemen aplikasi terpadu yang disediakan oleh NocoBase untuk membuat dan mengelola beberapa instans aplikasi NocoBase yang terisolasi secara fisik dalam satu atau lebih lingkungan runtime. Melalui pengawas aplikasi (AppSupervisor), pengguna dapat membuat dan memelihara beberapa aplikasi dalam satu pintu masuk terpadu untuk memenuhi kebutuhan berbagai bisnis dan tahapan skala yang berbeda.

## Aplikasi Tunggal

Pada tahap awal proyek, sebagian besar pengguna akan memulai dengan aplikasi tunggal.

Dalam mode ini, sistem hanya perlu menerapkan satu instans NocoBase, di mana semua fungsi bisnis, data, dan pengguna berjalan dalam aplikasi yang sama. Penerapannya sederhana, biaya konfigurasi rendah, dan sangat cocok untuk verifikasi prototipe, proyek kecil, atau alat internal.

Namun, seiring dengan bertambahnya kompleksitas bisnis, aplikasi tunggal akan menghadapi beberapa batasan alami:

- Fitur terus bertambah, membuat sistem menjadi membengkak
- Sulit untuk mengisolasi berbagai bisnis yang berbeda
- Biaya perluasan dan pemeliharaan aplikasi terus meningkat

Pada titik ini, pengguna akan ingin memisahkan berbagai bisnis ke dalam beberapa aplikasi untuk meningkatkan pemeliharaan dan skalabilitas sistem.

## Multi-aplikasi Berbagi Memori

Ketika pengguna ingin memisahkan bisnis tetapi tidak ingin memperkenalkan arsitektur penerapan dan operasional yang kompleks, mereka dapat meningkatkan ke mode multi-aplikasi berbagi memori.

Dalam mode ini, beberapa aplikasi dapat berjalan secara bersamaan dalam satu instans NocoBase. Setiap aplikasi bersifat independen, dapat terhubung ke basis data independen, serta dapat dibuat, dijalankan, dan dihentikan secara terpisah, namun mereka berbagi proses dan ruang memori yang sama. Pengguna tetap hanya perlu memelihara satu instans NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Metode ini membawa peningkatan yang nyata:

- Bisnis dapat dipisahkan berdasarkan dimensi aplikasi
- Fungsi dan konfigurasi antar aplikasi menjadi lebih jelas
- Penggunaan sumber daya lebih rendah dibandingkan dengan solusi multi-proses atau multi-kontainer

Namun, karena semua aplikasi berjalan dalam proses yang sama, mereka akan berbagi sumber daya seperti CPU dan memori. Anomali atau beban tinggi pada satu aplikasi dapat memengaruhi stabilitas aplikasi lainnya.

Ketika jumlah aplikasi terus bertambah, atau ketika tuntutan isolasi dan stabilitas yang lebih tinggi diajukan, arsitektur perlu ditingkatkan lebih lanjut.

## Penerapan Campuran Multi-lingkungan

Ketika skala dan kompleksitas bisnis mencapai tingkat tertentu, dan jumlah aplikasi perlu diperluas secara massal, mode multi-aplikasi berbagi memori akan menghadapi tantangan seperti perebutan sumber daya, stabilitas, dan keamanan. Pada tahap skalabilitas, pengguna dapat mempertimbangkan untuk mengadopsi metode penerapan campuran multi-lingkungan untuk mendukung skenario bisnis yang lebih kompleks.

Inti dari arsitektur ini adalah pengenalan aplikasi pintu masuk, yaitu menerapkan satu NocoBase sebagai pusat manajemen terpadu, sekaligus menerapkan beberapa NocoBase sebagai lingkungan runtime aplikasi untuk menjalankan aplikasi bisnis yang sebenarnya.

Aplikasi pintu masuk bertanggung jawab untuk:

- Pembuatan, konfigurasi, dan manajemen siklus hidup aplikasi
- Pengiriman perintah manajemen dan ringkasan status

Lingkungan instans aplikasi bertanggung jawab untuk:

- Menampung dan menjalankan aplikasi bisnis secara nyata melalui mode multi-aplikasi berbagi memori

Bagi pengguna, beberapa aplikasi tetap dapat dibuat dan dikelola melalui satu pintu masuk, namun secara internal:

- Aplikasi yang berbeda dapat berjalan pada node atau klaster yang berbeda
- Setiap aplikasi dapat menggunakan basis data dan middleware independen
- Aplikasi dengan beban tinggi dapat diperluas atau diisolasi sesuai kebutuhan

![](https://static-docs.nocobase.com/202512231215186.png)

Metode ini cocok digunakan untuk platform SaaS, lingkungan demo dalam jumlah besar, atau skenario multi-penyewa, yang meningkatkan stabilitas dan kemudahan operasional sistem sambil tetap menjamin fleksibilitas.