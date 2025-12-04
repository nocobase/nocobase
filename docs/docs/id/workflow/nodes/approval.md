---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Persetujuan

## Pendahuluan

Dalam sebuah alur kerja persetujuan, Anda perlu menggunakan node 'Persetujuan' khusus untuk mengonfigurasi logika operasional bagi pemberi persetujuan untuk memproses (menyetujui, menolak, atau mengembalikan) persetujuan yang diajukan. Node 'Persetujuan' ini hanya dapat digunakan dalam proses persetujuan.

:::info{title=Tips}
Perbedaan dengan node 'Manual' biasa: Node 'Manual' biasa ditujukan untuk skenario yang lebih umum, dapat digunakan untuk berbagai jenis alur kerja seperti input data manual atau keputusan manual apakah proses akan dilanjutkan. Node 'Persetujuan' adalah node pemrosesan khusus yang dirancang eksklusif untuk proses persetujuan, hanya menangani data dari persetujuan yang diajukan, dan tidak dapat digunakan dalam alur kerja lain.
:::

## Membuat Node

Klik tombol plus ('+') pada alur kerja, tambahkan node 'Persetujuan', lalu pilih salah satu mode persetujuan untuk membuat node persetujuan.

![审批节点_创建](https://static-docs.nocobase.com/20251107000938.png)

## Konfigurasi Node

### Mode Persetujuan

Ada dua mode persetujuan:

1.  **Mode Langsung**: Biasanya digunakan untuk proses yang lebih sederhana. Node persetujuan lulus atau tidak hanya menentukan apakah proses berakhir. Jika tidak lulus, proses akan langsung keluar.

    ![审批节点_通过模式_直通模式](https://static-docs.nocobase.com/20251107001043.png)

2.  **Mode Cabang**: Biasanya digunakan untuk logika data yang lebih kompleks. Setelah node persetujuan menghasilkan hasil apa pun, node lain dapat terus dieksekusi di dalam cabang hasilnya.

    ![审批节点_通过模式_分支模式](https://static-docs.nocobase.com/20251107001234.png)

    Setelah node ini 'Disetujui', selain mengeksekusi cabang persetujuan, proses selanjutnya juga akan terus berjalan. Setelah tindakan 'Tolak', proses selanjutnya juga dapat terus berjalan secara default, atau Anda dapat mengonfigurasi node untuk mengakhiri proses setelah mengeksekusi cabang.

:::info{title=Tips}
Mode persetujuan tidak dapat diubah setelah node dibuat.
:::

### Pemberi Persetujuan

Pemberi persetujuan adalah kumpulan pengguna yang bertanggung jawab atas tindakan persetujuan pada node ini. Dapat berupa satu atau lebih pengguna. Sumber pilihan dapat berupa nilai statis yang dipilih dari daftar pengguna, atau nilai dinamis yang ditentukan oleh variabel.

![审批节点_审批人](https://static-docs.nocobase.com/20251107001433.png)

Saat memilih variabel, Anda hanya dapat memilih kunci utama atau kunci asing dari data pengguna dari konteks dan hasil node. Jika variabel yang dipilih adalah array selama eksekusi (relasi banyak-ke-banyak), maka setiap pengguna dalam array akan digabungkan ke dalam seluruh kumpulan pemberi persetujuan.

Selain memilih pengguna atau variabel secara langsung, Anda juga dapat menyaring pengguna yang memenuhi kriteria secara dinamis berdasarkan kondisi kueri dari tabel pengguna untuk dijadikan pemberi persetujuan:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Mode Konsensus

Jika hanya ada satu pemberi persetujuan pada saat eksekusi akhir (termasuk kasus setelah deduplikasi beberapa variabel), maka terlepas dari mode konsensus yang dipilih, hanya pengguna tersebut yang akan melakukan tindakan persetujuan, dan hasilnya juga hanya akan ditentukan oleh pengguna tersebut.

Ketika ada beberapa pengguna dalam kumpulan pemberi persetujuan, memilih mode konsensus yang berbeda akan mewakili metode pemrosesan yang berbeda:

1.  **Salah Satu (OR)**: Hanya perlu satu orang yang menyetujui agar node dianggap lulus. Node dianggap ditolak hanya jika semua orang menolak.
2.  **Semua (AND)**: Semua orang harus menyetujui agar node dianggap lulus. Node dianggap ditolak jika hanya satu orang menolak.
3.  **Voting**: Jumlah orang yang menyetujui harus melebihi rasio yang ditetapkan agar node dianggap lulus; jika tidak, node dianggap ditolak.

Untuk tindakan pengembalian, dalam mode apa pun, jika ada pengguna dalam kumpulan pemberi persetujuan yang memprosesnya sebagai pengembalian, maka node akan langsung keluar dari alur kerja.

### Urutan Pemrosesan

Demikian pula, ketika ada beberapa pengguna dalam kumpulan pemberi persetujuan, memilih urutan pemrosesan yang berbeda akan mewakili metode pemrosesan yang berbeda:

1.  **Paralel**: Semua pemberi persetujuan dapat memproses dalam urutan apa pun; urutan pemrosesan tidak relevan.
2.  **Berurutan**: Pemberi persetujuan memproses secara berurutan sesuai dengan urutan dalam kumpulan pemberi persetujuan. Pemberi persetujuan berikutnya hanya dapat memproses setelah yang sebelumnya telah mengirimkan.

Terlepas dari apakah diatur ke pemrosesan 'Berurutan' atau tidak, hasil yang dihasilkan sesuai dengan urutan pemrosesan aktual juga akan mengikuti aturan dalam 'Mode Konsensus' yang disebutkan di atas. Node akan menyelesaikan eksekusinya setelah kondisi yang sesuai terpenuhi.

### Keluar dari alur kerja setelah cabang penolakan berakhir

Ketika 'Mode Persetujuan' diatur ke 'Mode Cabang', Anda dapat memilih untuk keluar dari alur kerja setelah cabang penolakan berakhir. Setelah dicentang, tanda '✗' akan ditampilkan di akhir cabang penolakan, menunjukkan bahwa node selanjutnya tidak akan dilanjutkan setelah cabang ini berakhir:

![审批节点_拒绝后退出](https://static-docs.nocobase.com/20251107001839.png)

### Konfigurasi Antarmuka Pemberi Persetujuan

Konfigurasi antarmuka pemberi persetujuan digunakan untuk menyediakan antarmuka operasi bagi pemberi persetujuan saat alur kerja persetujuan dieksekusi hingga node ini. Klik tombol konfigurasi untuk membuka jendela pop-up:

![审批节点_界面配置_弹窗](https://static-docs.nocobase.com/20251107001958.png)

Dalam jendela pop-up konfigurasi, Anda dapat menambahkan blok seperti konten pengajuan asli, informasi persetujuan, formulir tindakan, dan teks petunjuk kustom:

![审批节点_界面配置_添加区块](https://static-docs.nocobase.com/20251107002604.png)

#### Konten Pengajuan Asli

Blok detail konten persetujuan adalah blok data yang diajukan oleh pemrakarsa. Mirip dengan blok data biasa, Anda dapat menambahkan komponen bidang dari tabel data dan mengaturnya secara bebas untuk menyusun konten yang perlu dilihat oleh pemberi persetujuan:

![审批节点_界面配置_详情区块](https://static-docs.nocobase.com/20251107002925.png)

#### Formulir Tindakan

Dalam blok formulir tindakan, Anda dapat menambahkan tombol tindakan yang didukung oleh node ini, termasuk 'Setujui', 'Tolak', 'Kembalikan', 'Alihkan Tanda Tangan', dan 'Tambah Penyetuju':

![审批节点_界面配置_操作表单区块](https://static-docs.nocobase.com/20251107003015.png)

Selain itu, bidang yang dapat diubah oleh pemberi persetujuan juga dapat ditambahkan ke formulir tindakan. Bidang-bidang ini akan ditampilkan dalam formulir tindakan saat pemberi persetujuan memproses persetujuan. Pemberi persetujuan dapat mengubah nilai bidang-bidang ini, dan setelah pengajuan, data untuk persetujuan serta snapshot data yang sesuai dalam proses persetujuan akan diperbarui secara bersamaan.

![审批节点_界面配置_操作表单_修改审批内容字段](https://static-docs.nocobase.com/20251107003206.png)

#### 'Setujui' dan 'Tolak'

Di antara tombol tindakan persetujuan, 'Setujui' dan 'Tolak' adalah tindakan yang menentukan. Setelah pengajuan, pemrosesan pemberi persetujuan untuk node ini selesai. Bidang tambahan yang perlu diisi saat pengajuan dapat ditambahkan di jendela pop-up 'Konfigurasi Pemrosesan' tombol tindakan, seperti 'Komentar' dan lainnya.

![审批节点_界面配置_操作表单_处理配置](https://static-docs.nocobase.com/20251107003314.png)

#### 'Kembalikan'

'Kembalikan' juga merupakan tindakan yang menentukan. Selain dapat mengonfigurasi komentar, Anda juga dapat mengonfigurasi node yang dapat dikembalikan:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### 'Alihkan Tanda Tangan' dan 'Tambah Penyetuju'

'Alihkan Tanda Tangan' dan 'Tambah Penyetuju' adalah tindakan non-penentu, digunakan untuk menyesuaikan pemberi persetujuan dalam alur kerja persetujuan secara dinamis. 'Alihkan Tanda Tangan' adalah menyerahkan tugas persetujuan pengguna saat ini kepada pengguna lain untuk diproses. 'Tambah Penyetuju' adalah menambahkan pemberi persetujuan sebelum atau sesudah pemberi persetujuan saat ini, di mana pemberi persetujuan yang baru ditambahkan akan melanjutkan persetujuan bersama.

Setelah mengaktifkan tombol tindakan 'Alihkan Tanda Tangan' atau 'Tambah Penyetuju', Anda perlu memilih 'Lingkup Penugasan Personel' di menu konfigurasi tombol untuk mengatur cakupan personel yang dapat ditugaskan sebagai pemberi persetujuan baru:

![审批节点_界面配置_操作表单_指派人员范围](https://static-docs.nocobase.com/20241226232321.png)

Sama seperti konfigurasi pemberi persetujuan asli node, lingkup penugasan personel juga dapat berupa pemberi persetujuan yang dipilih secara langsung, atau berdasarkan kondisi kueri dari koleksi pengguna. Pada akhirnya akan digabungkan menjadi satu kumpulan, dan tidak akan menyertakan pengguna yang sudah ada dalam kumpulan pemberi persetujuan.

:::warning{title=Penting}
Jika sebuah tombol tindakan diaktifkan atau dinonaktifkan, atau lingkup penugasan personel diubah, Anda harus menyimpan konfigurasi node ini setelah menutup jendela pop-up konfigurasi antarmuka tindakan. Jika tidak, perubahan pada tombol tindakan tersebut tidak akan berlaku.
:::

## Hasil Node

Setelah persetujuan selesai, status dan data yang relevan akan dicatat dalam hasil node dan dapat digunakan sebagai variabel oleh node selanjutnya.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Status Persetujuan Node

Mewakili status pemrosesan node persetujuan saat ini. Hasilnya adalah nilai enumerasi.

### Data Setelah Persetujuan

Jika pemberi persetujuan mengubah konten persetujuan dalam formulir tindakan, data yang diubah akan dicatat dalam hasil node untuk digunakan oleh node selanjutnya. Jika Anda perlu menggunakan bidang relasi, Anda harus mengonfigurasi pemuatan awal (preloading) untuk bidang relasi tersebut di pemicu.

### Catatan Persetujuan

> v1.8.0+

Catatan pemrosesan persetujuan adalah sebuah array yang berisi catatan pemrosesan dari semua pemberi persetujuan dalam node ini. Setiap baris catatan pemrosesan mencakup bidang-bidang berikut:

| Bidang | Tipe | Deskripsi |
| --- | --- | --- |
| id | number | Pengidentifikasi unik untuk catatan pemrosesan |
| userId | number | ID pengguna yang memproses catatan ini |
| status | number | Status pemrosesan |
| comment | string | Komentar saat pemrosesan |
| updatedAt | string | Waktu pembaruan catatan pemrosesan |

Anda dapat menggunakan bidang-bidang ini sebagai variabel di node selanjutnya sesuai kebutuhan.