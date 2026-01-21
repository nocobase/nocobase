---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Penanganan Manual

## Pendahuluan

Ketika proses bisnis tidak dapat sepenuhnya mengotomatisasi pengambilan keputusan, sebagian wewenang pengambilan keputusan dapat diserahkan kepada manusia melalui node manual.

Ketika node manual dieksekusi, node ini akan menginterupsi eksekusi seluruh alur kerja dan menghasilkan tugas yang perlu ditindaklanjuti untuk pengguna yang bersangkutan. Setelah pengguna menyerahkan tugas, alur kerja akan dilanjutkan, tetap tertunda, atau dihentikan berdasarkan status yang dipilih. Ini sangat berguna dalam skenario seperti proses persetujuan.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur kerja untuk menambahkan node "Penanganan Manual":

![Membuat Node Manual](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Mengonfigurasi Node

### Penanggung Jawab

Node manual perlu menetapkan seorang pengguna sebagai pelaksana tugas yang perlu ditindaklanjuti. Daftar tugas yang perlu ditindaklanjuti dapat ditambahkan sebagai blok di halaman, dan konten pop-up tugas untuk setiap node perlu dikonfigurasi dalam konfigurasi antarmuka node.

Pilih seorang pengguna, atau pilih kunci utama (primary key) atau kunci asing (foreign key) dari data pengguna dalam konteks melalui variabel.

![Node Manual_Konfigurasi_Penanggung Jawab_Pilih Variabel](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Catatan}
Saat ini, opsi penanggung jawab untuk node manual belum mendukung penanganan oleh banyak pengguna. Fitur ini akan didukung di versi mendatang.
:::

### Mengonfigurasi Antarmuka Pengguna

Konfigurasi antarmuka untuk item yang perlu ditindaklanjuti adalah bagian inti dari node manual. Anda dapat mengklik tombol "Konfigurasi antarmuka pengguna" untuk membuka pop-up konfigurasi terpisah, yang dapat dikonfigurasi secara WYSIWYG (What You See Is What You Get), sama seperti halaman biasa:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Tab

Tab dapat digunakan untuk membedakan konten yang berbeda. Misalnya, satu tab untuk pengajuan formulir persetujuan, tab lain untuk pengajuan formulir penolakan, atau untuk menampilkan detail data terkait. Tab dapat dikonfigurasi secara bebas.

#### Blok

Jenis blok yang didukung terutama terbagi menjadi dua kategori: blok data dan blok formulir. Selain itu, Markdown terutama digunakan untuk konten statis seperti pesan informasi.

##### Blok Data

Blok data dapat menampilkan data pemicu atau hasil pemrosesan dari node mana pun, menyediakan informasi kontekstual yang relevan kepada penanggung jawab tugas yang perlu ditindaklanjuti. Misalnya, jika alur kerja dipicu oleh peristiwa formulir, Anda dapat membuat blok detail untuk data pemicu. Ini konsisten dengan konfigurasi detail halaman biasa, memungkinkan Anda memilih bidang apa pun dari data pemicu untuk ditampilkan:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Blok Data_Pemicu](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Blok data node serupa; Anda dapat memilih hasil data dari node sebelumnya (upstream) untuk ditampilkan sebagai detail. Misalnya, hasil dari node perhitungan sebelumnya dapat berfungsi sebagai informasi referensi kontekstual untuk tugas yang perlu ditindaklanjuti oleh penanggung jawab:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Blok Data_Data Node](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Catatan}
Karena alur kerja tidak dalam status dieksekusi selama konfigurasi antarmuka, tidak ada data spesifik yang ditampilkan di blok data. Data relevan untuk instans alur kerja tertentu hanya dapat dilihat di antarmuka pop-up tugas yang perlu ditindaklanjuti setelah alur kerja dipicu dan dieksekusi.
:::

##### Blok Formulir

Setidaknya satu blok formulir harus dikonfigurasi di antarmuka tugas yang perlu ditindaklanjuti untuk menangani keputusan akhir apakah alur kerja harus dilanjutkan. Tidak mengonfigurasi formulir akan mencegah alur kerja berlanjut setelah terinterupsi. Ada tiga jenis blok formulir, yaitu:

- Formulir kustom
- Formulir buat data baru
- Formulir perbarui data

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Jenis Formulir](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formulir buat data baru dan formulir perbarui data memerlukan pemilihan koleksi dasar. Setelah pengguna tugas yang perlu ditindaklanjuti mengirimkan, nilai-nilai dalam formulir akan digunakan untuk membuat atau memperbarui data dalam koleksi yang ditentukan. Formulir kustom memungkinkan Anda untuk secara bebas mendefinisikan formulir sementara yang tidak terikat pada koleksi. Nilai bidang yang dikirimkan oleh pengguna tugas yang perlu ditindaklanjuti dapat digunakan di node berikutnya.

Tombol kirim formulir dapat dikonfigurasi menjadi tiga jenis, yaitu:

- Kirim dan lanjutkan alur kerja
- Kirim dan hentikan alur kerja
- Hanya simpan nilai formulir

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Formulir](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Ketiga tombol tersebut mewakili tiga status node dalam proses alur kerja. Setelah pengiriman, status node akan berubah menjadi "Selesai", "Ditolak", atau tetap dalam status "Menunggu". Sebuah formulir harus memiliki setidaknya salah satu dari dua tombol pertama yang dikonfigurasi untuk menentukan alur pemrosesan selanjutnya dari seluruh alur kerja.

Pada tombol "Lanjutkan alur kerja", Anda dapat mengonfigurasi penugasan untuk bidang formulir:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Formulir_Atur Nilai Formulir](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Formulir_Pop-up Atur Nilai Formulir](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Setelah membuka pop-up, Anda dapat menetapkan nilai ke bidang formulir mana pun. Setelah formulir dikirimkan, nilai ini akan menjadi nilai akhir bidang tersebut. Ini sangat berguna saat meninjau data. Anda dapat menggunakan beberapa tombol "Lanjutkan alur kerja" yang berbeda dalam satu formulir, dengan setiap tombol menetapkan nilai enumerasi yang berbeda untuk bidang seperti status, sehingga mencapai efek melanjutkan eksekusi alur kerja berikutnya dengan nilai data yang berbeda.

## Blok Tugas yang Perlu Ditindaklanjuti

Untuk penanganan manual, Anda juga perlu menambahkan daftar tugas yang perlu ditindaklanjuti ke halaman untuk menampilkan tugas-tugas tersebut. Ini memungkinkan personel terkait untuk mengakses dan menangani tugas spesifik dari node manual melalui daftar ini.

### Menambahkan Blok

Anda dapat memilih "Tugas Alur Kerja yang Perlu Ditindaklanjuti" dari blok di halaman untuk menambahkan blok daftar tugas yang perlu ditindaklanjuti:

![Node Manual_Menambahkan Blok Tugas yang Perlu Ditindaklanjuti](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Contoh blok daftar tugas yang perlu ditindaklanjuti:

![Node Manual_Daftar Tugas yang Perlu Ditindaklanjuti](https://static-docs.nocobase.com/cfefb0533deebff6b3f6ef4408066e688.png)

### Detail Tugas yang Perlu Ditindaklanjuti

Setelah itu, personel terkait dapat mengklik tugas yang perlu ditindaklanjuti yang sesuai untuk membuka pop-up tugas yang perlu ditindaklanjuti dan melakukan penanganan manual:

![Node Manual_Detail Tugas yang Perlu Ditindaklanjuti](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Contoh

### Peninjauan Artikel

Misalkan sebuah artikel yang diajukan oleh pengguna biasa perlu disetujui oleh administrator sebelum dapat diperbarui menjadi status terbit. Jika alur kerja ditolak, artikel akan tetap dalam status draf (tidak publik). Proses ini dapat diimplementasikan menggunakan formulir pembaruan di node manual.

Buat sebuah alur kerja yang dipicu oleh "Buat Artikel Baru" dan tambahkan node manual:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Orkestrasi Alur Kerja" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Di node manual, konfigurasikan penanggung jawab sebagai administrator. Dalam konfigurasi antarmuka, tambahkan blok berdasarkan data pemicu untuk menampilkan detail artikel baru:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Blok Detail" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Dalam konfigurasi antarmuka, tambahkan blok berdasarkan formulir perbarui data, pilih koleksi artikel, agar administrator memutuskan apakah akan menyetujui. Setelah persetujuan, artikel yang bersangkutan akan diperbarui berdasarkan konfigurasi selanjutnya. Setelah menambahkan formulir, secara default akan ada tombol "Lanjutkan alur kerja", yang dapat dianggap sebagai persetujuan setelah diklik. Kemudian, tambahkan tombol "Hentikan alur kerja" untuk digunakan dalam kasus penolakan peninjauan:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Formulir dan Tindakan" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Saat melanjutkan alur kerja, kita perlu memperbarui status artikel. Ada dua cara untuk mengonfigurasi ini. Salah satunya adalah menampilkan bidang status artikel langsung di formulir agar operator dapat memilih. Metode ini lebih cocok untuk situasi yang memerlukan pengisian formulir secara aktif, seperti memberikan umpan balik:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Bidang Formulir" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Untuk menyederhanakan tugas operator, cara lain adalah mengonfigurasi penugasan nilai formulir pada tombol "Lanjutkan alur kerja". Dalam penugasan, tambahkan bidang "Status" dengan nilai "Terbit". Ini berarti bahwa ketika operator mengklik tombol, artikel akan diperbarui ke status terbit:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Penugasan Formulir" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Kemudian, dari menu konfigurasi di sudut kanan atas blok formulir, pilih kondisi filter untuk data yang akan diperbarui. Di sini, pilih koleksi "Artikel", dan kondisi filternya adalah "ID `sama dengan` Variabel pemicu / Data pemicu / ID":

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Kondisi Formulir" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Terakhir, Anda dapat mengubah judul setiap blok, teks tombol yang relevan, dan teks petunjuk bidang formulir untuk membuat antarmuka lebih ramah pengguna:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Konfigurasi Node_Formulir Akhir" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b884620d" width="678" />
</figure>

Tutup panel konfigurasi dan klik tombol kirim untuk menyimpan konfigurasi node. Alur kerja kini telah dikonfigurasi. Setelah mengaktifkan alur kerja ini, alur kerja akan secara otomatis terpicu saat artikel baru dibuat. Administrator dapat melihat bahwa alur kerja ini perlu diproses dari daftar tugas yang perlu ditindaklanjuti. Mengklik untuk melihat akan menampilkan detail tugas yang perlu ditindaklanjuti:

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Daftar Tugas yang Perlu Ditindaklanjuti" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-f372-4f69-9c84-5a786c061e0e" width="1363" />
</figure>

<figure>
  <img alt="Node Manual_Contoh_Peninjauan Artikel_Detail Tugas yang Perlu Ditindaklanjuti" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Administrator dapat membuat penilaian manual berdasarkan detail artikel untuk memutuskan apakah artikel dapat diterbitkan. Jika ya, mengklik tombol "Setujui" akan memperbarui artikel ke status terbit. Jika tidak, mengklik tombol "Tolak" akan menjaga artikel dalam status draf.

## Persetujuan Cuti

Misalkan seorang karyawan perlu mengajukan cuti, yang harus disetujui oleh atasan agar berlaku, dan data cuti karyawan yang bersangkutan perlu dipotong. Terlepas dari persetujuan atau penolakan, node permintaan HTTP akan digunakan untuk memanggil API SMS guna mengirim pesan notifikasi terkait kepada karyawan (lihat bagian [Permintaan HTTP](#_HTTP_请求)). Skenario ini dapat diimplementasikan menggunakan formulir kustom di node manual.

Buat sebuah alur kerja yang dipicu oleh "Buat Permintaan Cuti" dan tambahkan node manual. Ini serupa dengan proses peninjauan artikel sebelumnya, namun di sini penanggung jawabnya adalah atasan. Dalam konfigurasi antarmuka, tambahkan blok berdasarkan data pemicu untuk menampilkan detail permintaan cuti baru. Kemudian, tambahkan blok lain berdasarkan formulir kustom agar atasan dapat memutuskan apakah akan menyetujui. Dalam formulir kustom, tambahkan bidang untuk status persetujuan dan bidang untuk alasan penolakan:

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Konfigurasi Node" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Berbeda dengan proses peninjauan artikel, karena kita perlu melanjutkan proses berikutnya berdasarkan hasil persetujuan atasan, di sini kita hanya mengonfigurasi satu tombol "Lanjutkan alur kerja" sebagai pengajuan, tanpa menggunakan tombol "Hentikan alur kerja".

Pada saat yang sama, setelah node manual, kita dapat menggunakan node kondisi untuk menentukan apakah atasan telah menyetujui permintaan cuti tersebut. Pada cabang persetujuan, tambahkan pemrosesan data untuk memotong cuti, dan setelah cabang-cabang bergabung, tambahkan node permintaan untuk mengirim notifikasi SMS kepada karyawan. Ini menghasilkan alur kerja lengkap berikut:

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Orkestrasi Alur Kerja" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Kondisi dalam node kondisi dikonfigurasi sebagai "Node Manual / Data formulir kustom / Nilai bidang persetujuan adalah 'Disetujui'":

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Kondisi" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Data dalam node kirim permintaan juga dapat menggunakan variabel formulir yang sesuai dari node manual untuk membedakan konten SMS untuk persetujuan dan penolakan. Ini menyelesaikan seluruh konfigurasi alur kerja. Setelah alur kerja diaktifkan, ketika seorang karyawan mengajukan formulir permintaan cuti, atasan dapat memproses persetujuan dalam tugas yang perlu ditindaklanjuti. Operasinya pada dasarnya serupa dengan proses peninjauan artikel.