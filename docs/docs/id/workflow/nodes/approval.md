---
pkg: '@nocobase/plugin-workflow-approval'
title: "Node Workflow - Persetujuan"
description: "Node persetujuan: khusus untuk alur persetujuan, mengonfigurasi operasi setujui/tolak/kembalikan, hanya dapat digunakan dalam alur persetujuan."
keywords: "Workflow,Node persetujuan,Approval,setujui tolak kembalikan,alur persetujuan,NocoBase"
---

# Persetujuan

## Pengantar

Pada alur kerja persetujuan, perlu menggunakan Node "Persetujuan" khusus untuk mengonfigurasi logika operasi pemrosesan (setujui, tolak, atau kembalikan) persetujuan yang diinisiasi untuk penyetuju, Node "Persetujuan" juga hanya dapat digunakan dalam alur persetujuan.

:::info{title=Tips}
Perbedaan dengan Node "Penanganan Manual" biasa: Node "Penanganan Manual" biasa ditujukan untuk skenario yang lebih umum, dapat digunakan untuk lebih banyak tipe Workflow seperti input data manual, keputusan manual apakah alur dilanjutkan, dll. "Node persetujuan" adalah Node pemrosesan yang dispesialisasi khusus untuk alur persetujuan, hanya menangani data yang menginisiasi persetujuan, tidak dapat digunakan dalam Workflow lainnya.
:::

## Membuat Node

Klik tombol plus ("+") di alur, tambahkan Node "Persetujuan", lalu pilih salah satu mode persetujuan, buat Node persetujuan:

![Node persetujuan_buat](https://static-docs.nocobase.com/20251107000938.png)

## Konfigurasi Node

### Mode Persetujuan

Mode persetujuan ada dua:

1.  Mode Langsung: biasanya digunakan untuk alur yang relatif sederhana. Lulus atau tidaknya Node persetujuan hanya menentukan apakah alur berakhir, dalam kasus tidak lulus langsung keluar dari alur.

    ![Node persetujuan_mode persetujuan_mode langsung](https://static-docs.nocobase.com/20251107001043.png)

2.  Mode Cabang: biasanya digunakan untuk logika data yang lebih kompleks. Setelah Node persetujuan menghasilkan hasil apa pun, dapat melanjutkan eksekusi Node lainnya dalam cabang hasilnya.

    ![Node persetujuan_mode persetujuan_mode cabang](https://static-docs.nocobase.com/20251107001234.png)

    Setelah Node ini "Disetujui", selain mengeksekusi cabang setuju, juga akan melanjutkan eksekusi alur berikutnya. Setelah operasi "Tolak" secara default juga dapat melanjutkan eksekusi alur berikutnya, juga dapat dikonfigurasi pada Node untuk mengakhiri alur setelah mengeksekusi cabang.

:::info{title=Tips}
Mode persetujuan tidak dapat dimodifikasi setelah Node dibuat.
:::

### Penyetuju

Penyetuju adalah kumpulan pengguna yang bertanggung jawab atas perilaku persetujuan Node tersebut, dapat satu atau beberapa pengguna. Sumber pemilihan dapat berupa nilai statis yang dipilih dari daftar pengguna, atau juga nilai dinamis yang ditentukan oleh variabel:

![Node persetujuan_penyetuju](https://static-docs.nocobase.com/20251107001433.png)

Saat memilih variabel, hanya dapat memilih primary key atau foreign key data pengguna dari konteks dan hasil Node. Jika variabel yang dipilih saat eksekusi adalah array (relasi to-many), maka setiap pengguna dalam array akan digabung ke seluruh kumpulan penyetuju.

Selain langsung memilih pengguna atau variabel, juga dapat memfilter pengguna yang memenuhi kondisi secara dinamis berdasarkan kondisi kueri tabel pengguna sebagai penyetuju:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Mode Negosiasi

Jika penyetuju saat eksekusi akhir hanya satu (termasuk kasus setelah deduplikasi beberapa variabel), maka apa pun mode negosiasi yang dipilih, hanya pengguna tersebut yang akan mengeksekusi operasi persetujuan, hasilnya juga hanya ditentukan oleh pengguna tersebut.

Saat ada beberapa pengguna dalam kumpulan penyetuju, memilih mode negosiasi yang berbeda merepresentasikan cara pemrosesan yang berbeda:

1. Tanda tangan ATAU: cukup salah satu menyetujui untuk merepresentasikan Node disetujui, semua menolak baru merepresentasikan Node ditolak.
2. Tanda tangan AND: perlu semua menyetujui untuk merepresentasikan Node disetujui, cukup salah satu menolak untuk merepresentasikan Node ditolak.
3. Voting: perlu lebih dari rasio jumlah orang yang ditetapkan untuk menyetujui untuk merepresentasikan Node disetujui, jika tidak merepresentasikan Node ditolak.

Untuk operasi pengembalian, pada mode apa pun, jika ada pengguna dalam kumpulan penyetuju yang memprosesnya sebagai pengembalian, maka Node akan langsung keluar dari alur.

### Urutan Pemrosesan

Sama halnya, ketika ada beberapa pengguna dalam kumpulan penyetuju, memilih urutan pemrosesan yang berbeda merepresentasikan cara pemrosesan yang berbeda:

1. Paralel: semua penyetuju dapat memproses dalam urutan apa pun, tidak peduli urutan pemrosesan.
2. Berurutan: penyetuju memproses secara berurutan sesuai urutan dalam kumpulan penyetuju, setelah penyetuju sebelumnya mengirim, baru penyetuju berikutnya dapat memproses.

Apakah diatur sebagai pemrosesan "Berurutan" atau tidak, hasil yang dihasilkan berdasarkan urutan pemrosesan aktual juga mengikuti aturan dalam "Mode Negosiasi" di atas. Setelah mencapai kondisi yang sesuai, Node tersebut selesai dieksekusi.

### Keluar dari Workflow Setelah Cabang Tolak Berakhir

Saat "Mode Persetujuan" diatur sebagai "Mode Cabang", dapat memilih untuk keluar dari Workflow setelah cabang tolak berakhir. Setelah dicentang, di akhir cabang tolak akan ditampilkan "✗", menandakan setelah cabang tersebut berakhir tidak akan melanjutkan Node berikutnya:

![Node persetujuan_keluar setelah ditolak](https://static-docs.nocobase.com/20251107001839.png)

### Konfigurasi Antarmuka Penyetuju

Konfigurasi antarmuka penyetuju digunakan untuk menyediakan antarmuka operasi penyetuju ketika Workflow persetujuan dieksekusi sampai Node ini, klik tombol konfigurasi untuk membuka dialog:

![Node persetujuan_konfigurasi antarmuka_dialog](https://static-docs.nocobase.com/20251107001958.png)

Pada dialog konfigurasi dapat menambahkan Block seperti konten pengiriman asli, informasi persetujuan, formulir pemrosesan, dan teks tip kustom:

![Node persetujuan_konfigurasi antarmuka_tambah Block](https://static-docs.nocobase.com/20251107002604.png)

#### Konten Pengiriman Asli

Block detail konten persetujuan yaitu Block data yang dikirim penginisiasi, mirip dengan Block data biasa, dapat menambahkan komponen field tabel data secara bebas, dan dapat diatur dengan bebas, untuk mengorganisir konten yang perlu dilihat penyetuju:

![Node persetujuan_konfigurasi antarmuka_Block detail](https://static-docs.nocobase.com/20251107002925.png)

#### Formulir Pemrosesan

Pada Block formulir operasi dapat menambahkan tombol operasi yang didukung Node ini, termasuk "Setujui", "Tolak", "Kembalikan", "Pemindahan Tanda Tangan", dan "Penambahan Tanda Tangan":

![Node persetujuan_konfigurasi antarmuka_Block formulir operasi](https://static-docs.nocobase.com/20251107003015.png)

Selain itu, pada formulir operasi juga dapat menambahkan field yang dapat dimodifikasi penyetuju. Field-field ini akan ditampilkan pada formulir operasi saat penyetuju memproses persetujuan, penyetuju dapat memodifikasi nilai field-field ini, setelah dikirim juga akan memperbarui data yang digunakan untuk persetujuan, serta snapshot data yang sesuai dalam alur persetujuan.

![Node persetujuan_konfigurasi antarmuka_formulir operasi_field modifikasi konten persetujuan](https://static-docs.nocobase.com/20251107003206.png)

#### "Setujui" dan "Tolak"

Pada tombol operasi persetujuan, "Setujui" dan "Tolak" adalah operasi penentu, setelah dikirim maka pemrosesan penyetuju yang sesuai pada Node tersebut selesai, field tambahan yang perlu diisi saat dikirim dapat ditambahkan pada dialog "Konfigurasi Pemrosesan" tombol operasi, seperti "Komentar", dll.

![Node persetujuan_konfigurasi antarmuka_formulir operasi_konfigurasi pemrosesan](https://static-docs.nocobase.com/20251107003314.png)

#### "Kembalikan"

"Kembalikan" juga merupakan operasi penentu, selain dapat mengonfigurasi komentar, juga dapat mengonfigurasi Node yang dapat dikembalikan:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Pemindahan Tanda Tangan" dan "Penambahan Tanda Tangan"

"Pemindahan Tanda Tangan" dan "Penambahan Tanda Tangan" adalah operasi non-penentu, digunakan untuk menyesuaikan secara dinamis penyetuju dalam alur persetujuan, "Pemindahan Tanda Tangan" adalah memberikan tugas persetujuan pengguna saat ini ke pengguna lain untuk diproses, "Penambahan Tanda Tangan" adalah menambahkan satu penyetuju sebelum atau sesudah penyetuju saat ini, persetujuan dilanjutkan oleh penyetuju yang ditambahkan.

Setelah mengaktifkan tombol operasi "Pemindahan Tanda Tangan" atau "Penambahan Tanda Tangan", perlu memilih "Lingkup Pengguna yang Ditugaskan" pada menu konfigurasi tombol, untuk mengatur lingkup penyetuju baru yang dapat ditugaskan:

![Node persetujuan_konfigurasi antarmuka_formulir operasi_lingkup pengguna yang ditugaskan](https://static-docs.nocobase.com/20241226232321.png)

Sama dengan konfigurasi penyetuju asli Node, lingkup pengguna yang ditugaskan juga dapat berupa penyetuju yang langsung dipilih, atau berdasarkan kondisi kueri tabel pengguna, akhirnya akan digabungkan menjadi satu kumpulan, dan tidak termasuk pengguna yang sudah ada di kumpulan penyetuju.

:::warning{title=Penting}
Jika mengaktifkan atau menonaktifkan tombol operasi tertentu, atau memodifikasi lingkup pengguna yang ditugaskan, perlu menyimpan konfigurasi Node setelah menutup dialog konfigurasi antarmuka operasi, jika tidak perubahan tombol operasi tersebut tidak akan berlaku.
:::

### Kartu "Persetujuan Saya" <Badge>2.0+</Badge>

Dapat digunakan untuk mengonfigurasi kartu tugas dalam daftar "Persetujuan Saya" pusat tugas.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

Pada kartu dapat dengan bebas mengonfigurasi field bisnis (kecuali field relasi) yang ingin ditampilkan, atau informasi terkait persetujuan.

Setelah persetujuan masuk ke Node ini, daftar pusat tugas dapat melihat kartu tugas kustom:

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Hasil Node

Setelah persetujuan selesai, status dan data terkait akan dicatat dalam hasil Node, dapat digunakan sebagai variabel oleh Node berikutnya.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Status Persetujuan Node

Merepresentasikan status pemrosesan Node persetujuan saat ini, hasilnya adalah nilai enum.

### Data Setelah Persetujuan

Jika penyetuju memodifikasi konten persetujuan dalam formulir operasi, data yang dimodifikasi akan dicatat dalam hasil Node, untuk digunakan Node berikutnya. Jika perlu menggunakan field relasi, perlu mengonfigurasi pre-load untuk field relasi pada Trigger.

### Record Persetujuan

> v1.8.0+

Record pemrosesan persetujuan adalah array, mengandung record pemrosesan semua penyetuju di Node tersebut. Setiap baris record pemrosesan mengandung field berikut:

| Field | Tipe | Penjelasan |
| --- | --- | --- |
| id | number | Pengidentifikasi unik record pemrosesan |
| userId | number | ID pengguna yang memproses record tersebut |
| status | number | Status pemrosesan |
| comment | string | Komentar saat pemrosesan |
| updatedAt | string | Waktu pembaruan record pemrosesan |

Dapat menggunakan field di dalamnya sebagai variabel pada Node setelahnya sesuai kebutuhan.
