---
pkg: '@nocobase/plugin-workflow-manual'
title: "Pemrosesan Manual"
description: "Node Pemrosesan Manual: menyerahkan keputusan alur kepada user, menghasilkan task to-do, mendukung persetujuan, lanjut/tunggu/hentikan alur."
keywords: "Workflow,Pemrosesan Manual,persetujuan,to-do,kolaborasi manusia-mesin,NocoBase"
---

# Pemrosesan Manual

## Pengantar

Saat alur bisnis tidak dapat sepenuhnya diotomatiskan, Anda dapat menggunakan Node manual untuk menyerahkan sebagian keputusan kepada pemrosesan manual.

Node manual saat dieksekusi akan terlebih dahulu menghentikan eksekusi keseluruhan alur, menghasilkan task to-do untuk user yang sesuai. Setelah user submit, alur akan melanjutkan, terus menunggu, atau menghentikan alur berdasarkan status yang dipilih. Sangat berguna pada skenario seperti persetujuan alur.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Pemrosesan Manual":

![Membuat Node Manual](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Konfigurasi Node

### Penanggung Jawab

Node manual perlu menetapkan satu user sebagai pelaksana task to-do. Daftar task to-do dapat ditambahkan saat menambah Block pada halaman, isi popup task setiap Node perlu dikonfigurasi antarmukanya pada Node tersebut.

Pilih satu user, atau pilih primary key atau foreign key data user dari konteks melalui variable.

![Node Manual_Konfigurasi_Penanggung Jawab_Pilih Variable](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Tips}
Saat ini opsi penanggung jawab Node manual belum mendukung pemrosesan oleh banyak orang, akan didukung di versi mendatang.
:::

### Konfigurasi Antarmuka User

Konfigurasi antarmuka task to-do adalah inti dari Node manual, dapat dikonfigurasi secara independen melalui popup yang dibuka dengan mengklik tombol "Konfigurasi Antarmuka User". Sama seperti halaman biasa, dapat dikonfigurasi secara WYSIWYG:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Tab

Tab dapat digunakan untuk membedakan konten yang berbeda, misalnya satu tab untuk submit form yang lulus, tab lain untuk submit form yang ditolak, atau untuk menampilkan detail data terkait, dapat dikonfigurasi secara bebas.

#### Block

Tipe Block yang didukung utamanya ada dua kategori besar, Block data dan Block form, selain itu Markdown utamanya digunakan untuk konten statis seperti pesan informasi.

##### Block Data

Block data dapat memilih data trigger atau hasil pemrosesan Node mana pun, untuk menyediakan informasi konteks terkait kepada penanggung jawab to-do. Misalnya workflow di-trigger oleh event form, dapat membuat Block detail dari data trigger. Sama seperti konfigurasi detail halaman biasa, dapat memilih field yang ada dalam data trigger untuk ditampilkan:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Block Data_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Block data Node serupa, dapat memilih hasil data dari Node upstream sebagai detail untuk ditampilkan. Misalnya hasil dari Node komputasi upstream, sebagai informasi referensi konteks bagi to-do penanggung jawab:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Block Data_Data Node](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Tips}
Karena saat mengkonfigurasi antarmuka, workflow berada dalam status belum dieksekusi, sehingga Block data tidak menampilkan data spesifik. Hanya saat workflow di-trigger dan dieksekusi, pada antarmuka popup to-do baru dapat dilihat data alur yang relevan.
:::

##### Block Form

Pada antarmuka to-do setidaknya perlu dikonfigurasi satu Block form, sebagai keputusan akhir apakah workflow dilanjutkan atau tidak. Tidak mengkonfigurasi form akan menyebabkan alur tidak dapat dilanjutkan setelah dihentikan. Block form memiliki tiga tipe, yaitu:

- Form kustom
- Form tambah data
- Form update data

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tipe Form](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Form tambah data dan form update data perlu memilih tabel data yang menjadi dasarnya, setelah user to-do submit akan menggunakan nilai dalam form untuk menambah atau update data tabel data tertentu. Form kustom dapat secara bebas mendefinisikan form sementara yang tidak terkait dengan tabel data, nilai field setelah user to-do submit dapat digunakan pada Node berikutnya.

Tombol submit pada form dapat dikonfigurasi tiga tipe, yaitu:

- Lanjutkan alur setelah submit
- Hentikan alur setelah submit
- Hanya simpan nilai form sementara

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Form](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Ketiga tombol mewakili tiga status Node dalam pemrosesan alur, setelah submit status Node ini diubah menjadi "selesai", "ditolak", atau tetap dalam status "menunggu". Sebuah form setidaknya perlu mengkonfigurasi salah satu dari dua yang pertama, untuk menentukan arah pemrosesan alur selanjutnya.

Pada tombol "lanjutkan alur" Anda dapat mengkonfigurasi assignment untuk field form:

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Form_Set Nilai Form](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Node Manual_Konfigurasi Node_Konfigurasi Antarmuka_Tombol Form_Set Nilai Form Popup](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Setelah popup terbuka Anda dapat assign nilai untuk field mana pun pada form. Setelah form di-submit, akan menggunakan nilai tersebut sebagai nilai akhir field. Biasanya berguna saat melakukan review terhadap data tertentu, Anda dapat menggunakan beberapa tombol "lanjutkan alur" yang berbeda dalam form, setiap tombol mengatur nilai enum yang berbeda untuk field status serupa, untuk mencapai efek melanjutkan eksekusi alur berikutnya dan menggunakan nilai data yang berbeda.

## Block To-Do

Untuk pemrosesan manual, perlu juga ditambahkan list to-do pada halaman, untuk menampilkan task to-do, sehingga personil terkait dapat masuk ke pemrosesan task spesifik Node manual melalui list tersebut.

### Menambah Block

Anda dapat memilih "To-Do Workflow" dari Block pada halaman, untuk menambahkan Block list to-do:

![Node Manual_Tambah Block To-Do](https://static-docs.nocobase.com/198b417454cd73b704267bf30fe5e647.png)

Contoh Block list to-do:

![Node Manual_List To-Do](https://static-docs.nocobase.com/cfefb0d2c6a91c5c9dfa550d6b220f34.png)

### Detail To-Do

Selanjutnya personil terkait dapat mengklik task to-do yang sesuai, masuk ke popup to-do untuk melakukan pemrosesan manual:

![Node Manual_Detail To-Do](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Contoh

### Review Artikel

Misalkan artikel yang di-submit oleh user biasa perlu di-review oleh administrator sebelum dapat di-update menjadi status terpublikasi. Sebaliknya jika alur ditolak, artikel akan tetap dalam status draft (tidak dipublikasikan). Alur ini dapat diimplementasikan menggunakan form update pada Node manual.

Buat workflow yang di-trigger oleh "Tambah Artikel", dan tambahkan Node manual:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Orkestrasi Alur" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Pada Node manual konfigurasikan penanggung jawab sebagai administrator, pada antarmuka konfigurasi tambahkan Block berdasarkan data trigger, untuk menampilkan detail artikel yang baru ditambahkan:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Block Detail" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Pada antarmuka konfigurasi tambahkan Block berdasarkan form update data, pilih tabel artikel, untuk administrator memutuskan apakah review lulus atau tidak. Setelah review lulus, akan meng-update artikel terkait berdasarkan konfigurasi lainnya. Setelah form ditambahkan, secara default akan ada tombol "lanjutkan alur", yang dapat dianggap sebagai lulus saat diklik. Lalu tambahkan tombol "hentikan alur", digunakan untuk kasus review tidak lulus:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Form dan Aksi" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Untuk kasus melanjutkan alur, kita perlu meng-update status artikel. Di sini ada dua cara konfigurasi: pertama langsung menampilkan field status artikel pada form untuk dipilih operator. Cara ini lebih cocok untuk situasi yang perlu mengisi form secara aktif, seperti memberikan masukan, dll.:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Field Form" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Untuk menyederhanakan operasi operator, cara kedua adalah mengkonfigurasi assignment form pada tombol "lanjutkan alur". Pada assignment tambahkan field "status", dengan nilai "terpublikasi". Maka setelah operator mengklik tombol, artikel akan diupdate menjadi status terpublikasi:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Assignment Form" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Kemudian dari menu konfigurasi di pojok kanan atas Block form, pilih kondisi filter data yang akan diupdate. Di sini pilih tabel "Artikel", kondisi filter "ID `sama dengan` Variable Trigger / Data Trigger / ID":

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Kondisi Form" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Terakhir, Anda dapat memodifikasi judul setiap Block dan teks tombol terkait, serta teks petunjuk field form, agar antarmuka lebih ramah pengguna:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Konfigurasi Node_Form Final" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Tutup panel konfigurasi, klik tombol submit untuk menyimpan konfigurasi Node, maka workflow telah selesai dikonfigurasi. Setelah workflow ini diaktifkan, saat menambah artikel, akan secara otomatis memicu workflow ini, administrator dapat melihat workflow ini perlu diproses dari list task to-do, klik untuk melihat detail task to-do:

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_List To-Do" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Node Manual_Contoh_Review Artikel_Detail To-Do" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Administrator dapat melakukan penilaian manual berdasarkan detail artikel, apakah artikel ini dapat dipublikasikan. Jika ya, klik tombol "Lulus", artikel akan diupdate menjadi status terpublikasi. Jika tidak, klik tombol "Tolak", artikel akan tetap dalam status draft.

## Persetujuan Cuti

Misalkan karyawan perlu mengajukan cuti, perlu disetujui oleh atasan baru dapat berlaku, dan menghapus data cuti karyawan terkait. Dan baik disetujui atau ditolak, akan memanggil interface SMS melalui Node Request, mengirim SMS notifikasi terkait kepada karyawan (lihat bagian [HTTP Request](#_HTTP_请求)). Skenario ini dapat diimplementasikan menggunakan form kustom pada Node manual.

Buat workflow yang di-trigger oleh "Tambah Cuti", dan tambahkan Node manual. Mirip dengan alur review artikel sebelumnya, hanya saja di sini penanggung jawab adalah atasan. Pada antarmuka konfigurasi tambahkan Block berdasarkan data trigger, untuk menampilkan detail cuti yang baru ditambahkan. Tambahkan juga Block berdasarkan form kustom, untuk atasan memutuskan apakah review lulus. Pada form kustom tambahkan field apakah lulus, dan field alasan penolakan:

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Konfigurasi Node" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Berbeda dengan alur review artikel, karena kita perlu melanjutkan alur berdasarkan hasil persetujuan atasan, di sini kita hanya mengkonfigurasi satu tombol "lanjutkan alur" sebagai submit, tanpa menggunakan tombol "hentikan alur".

Pada saat yang sama setelah Node manual, kita dapat menggunakan Node kondisi untuk menentukan apakah atasan menyetujui pengajuan cuti tersebut. Pada cabang yang lulus tambahkan pemrosesan data penghapusan cuti, dan setelah cabang berakhir tambahkan Node Request, untuk mengirim SMS notifikasi kepada karyawan, sehingga mendapatkan alur lengkap berikut:

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Orkestrasi Alur" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Konfigurasi kondisi pada Node kondisi adalah "Node Manual / Data Form Kustom / Apakah nilai field lulus adalah 'lulus'":

<figure>
  <img alt="Node Manual_Contoh_Persetujuan Cuti_Kondisi" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Data pada Node Request juga dapat menggunakan variable form yang sesuai pada Node manual, untuk membedakan isi SMS untuk lulus dan ditolak. Dengan demikian seluruh konfigurasi alur selesai. Setelah workflow diaktifkan, ketika karyawan submit form pengajuan cuti, atasan dapat melakukan pemrosesan persetujuan pada task to-do, operasinya pada dasarnya mirip dengan alur review artikel.
