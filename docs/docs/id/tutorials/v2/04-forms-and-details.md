# Bab 4: Form dan Detail — Input, Tampilan, Selesai dalam Satu Langkah

Pada bab sebelumnya kita telah membangun daftar tiket dan menginput data uji menggunakan form sederhana. Pada bab ini kita akan **menyempurnakan pengalaman form** — mengoptimalkan layout field [Block form](/interface-builder/blocks/data-blocks/form), menambahkan [Block detail](/interface-builder/blocks/data-blocks/details), mengonfigurasi [aturan linkage](/interface-builder/linkage-rules), dan dapat menggunakan [riwayat perubahan](https://docs.nocobase.com/cn/record-history/) untuk melacak setiap modifikasi tiket.

:::tip
Fitur "[Riwayat](https://docs.nocobase.com/cn/record-history/)" pada bagian 4.4 termasuk dalam [versi profesional](https://www.nocobase.com/cn/commercial), melewati bagian ini tidak akan mempengaruhi pembelajaran bab selanjutnya.
:::

## 4.1 Menyempurnakan Form Tambah Tiket

Pada bab sebelumnya kita dengan cepat membuat form tambah baru yang berfungsi, sekarang mari menyempurnakannya — menyesuaikan urutan field, mengatur nilai default, mengoptimalkan layout. Jika Anda melewati bagian form cepat di bab sebelumnya, tidak masalah, di sini kita akan membuat form dari awal.

### Menambahkan Tombol Action "Tambah Baru"

1. Pastikan berada dalam mode UI Editor (switch di pojok kanan atas dalam keadaan aktif).
2. Masuk ke halaman "Daftar Tiket", klik **"[Action](/interface-builder/actions) (Actions)"** di bagian atas Block tabel.
3. Centang tombol Action **"Tambah"**.
4. Akan muncul tombol "Tambah" di atas tabel, klik akan membuka [popup](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Mengonfigurasi Form di Popup

1. Klik tombol "Tambah", buka popup.
2. Pada popup klik **"Buat [Block](/interface-builder/blocks) (Add block) → Block Data → Form (Tambah)"**.
3. Pilih **"[Tabel data](/data-sources/data-modeling/collection) saat ini (Current collection)"**. Popup sudah terhubung dengan konteks tabel data yang sesuai, tidak perlu ditentukan secara manual.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. Pada form klik **"[Field](/data-sources/data-modeling/collection-fields) (Fields)"**, centang field berikut:

| Field | Poin Konfigurasi |
|------|---------|
| Judul | Wajib (mengikuti global) |
| Deskripsi | Input teks besar |
| Status | Dropdown (akan diatur nilai default melalui aturan linkage) |
| Prioritas | Dropdown |
| Kategori | Field asosiasi, otomatis ditampilkan sebagai dropdown selector |
| Pengirim | Field asosiasi (akan diatur nilai default melalui aturan linkage) |
| Penangani | Field asosiasi |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Anda akan menemukan bahwa di samping field "Judul" sudah otomatis ada tanda bintang merah `*` — karena pada Bab 2 saat membuat field kita sudah mengatur sebagai wajib, form akan otomatis mewarisi aturan wajib di tingkat tabel data, tidak perlu dikonfigurasi lagi secara terpisah.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Tips**: Jika sebuah field tidak diatur sebagai wajib di tingkat tabel data, tetapi Anda ingin mewajibkannya pada form saat ini, Anda juga dapat mengaturnya secara terpisah di konfigurasi field.
> 
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Menambahkan Tombol Submit

1. Di bagian bawah Block form, klik **"Action (Actions)"**.
2. Centang tombol **"Submit"**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. Setelah pengguna mengisi form, klik submit untuk membuat tiket baru.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Aturan Linkage: Nilai Default dan Linkage Field

Beberapa field kita ingin diisi otomatis (seperti status default "Menunggu"), beberapa field perlu berubah secara dinamis berdasarkan kondisi (seperti tiket urgent wajib mengisi deskripsi). Saat ini bentuk fitur nilai default 2.0 masih dalam evolusi, tutorial ini secara konsisten menggunakan **aturan linkage** untuk mengonfigurasi nilai default dan linkage field.

1. Klik **Pengaturan Block** (ikon tiga garis horizontal) di pojok kanan atas Block form.
2. Temukan **"Aturan Linkage (Linkage rules)"**, klik untuk membuka panel konfigurasi di sidebar.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Mengatur Nilai Default

Mari atur nilai default untuk "Status" dan "Pengirim" terlebih dahulu:

1. Klik **"Tambah Aturan Linkage"**.
2. **Tidak menetapkan kondisi** (biarkan kosong) — aturan linkage tanpa kondisi akan langsung dieksekusi saat form dimuat.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Konfigurasi action (Actions):
   - Field Status → **Atur Nilai Default** → Menunggu
   - Field Pengirim → **Atur Nilai Default** → Pengguna saat ini

> **Perhatikan pemilihan nilai field**: saat mengatur nilai, pastikan terlebih dahulu memilih **"Form saat ini"** sebagai sumber data. Jika ini adalah field objek asosiasi (seperti kategori, pengirim, penangani, dan field many-to-one lainnya), harus memilih atribut objek itu sendiri, bukan sub-field setelah diperluas.
>
> Saat memilih variabel (seperti "Pengguna saat ini"), perlu **klik tunggal** untuk memilih variabel, lalu **klik ganda** untuk mengisinya ke kolom pilihan.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Jika ingin agar field tertentu tidak dapat dimodifikasi oleh pengirim (seperti status), Anda dapat mengatur **"Mode Tampilan (Display mode)"** menjadi **"Read-only (Readonly)"** di konfigurasi field.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Tiga mode tampilan**: Editable, Readonly (dilarang edit tetapi mempertahankan tampilan field), Easy-reading (hanya menampilkan teks).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Tiket Urgent Wajib Mengisi Deskripsi

Selanjutnya tambahkan satu aturan linkage bersyarat: ketika pengguna memilih prioritas "Mendesak", field deskripsi menjadi **wajib**, mengingatkan pengirim untuk menjelaskan situasi dengan jelas.

1. Klik **"Tambah Aturan Linkage"**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Konfigurasi aturan:
   - **Kondisi (Condition)**: Form saat ini / Prioritas **sama dengan** Mendesak
   - **Action (Actions)**: Field Deskripsi → atur sebagai **Wajib**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Simpan aturan.

Sekarang mari uji: pilih prioritas "Mendesak", di samping field deskripsi akan muncul tanda bintang merah `*`, menandakan wajib. Pilih prioritas lain akan kembali tidak wajib.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Akhirnya, sesuai dengan apa yang sudah kita pelajari, sesuaikan layout sedikit
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **Apa lagi yang bisa dilakukan aturan linkage?** Selain mengatur nilai default dan mengontrol kewajiban, juga dapat mengontrol show/hide field, dynamic assignment. Contohnya: ketika status adalah "Ditutup", sembunyikan field penangani. Akan dijelaskan saat kita menemui kasusnya di bab selanjutnya.

## 4.3 [Block Detail](/interface-builder/blocks/data-blocks/details)

Pada bab sebelumnya kita menambahkan tombol "Lihat" pada baris tabel, klik akan membuka drawer. Sekarang mari konfigurasi konten dalam drawer.

1. Pada tabel klik tombol **"Lihat"** pada salah satu baris, buka drawer.
2. Pada drawer klik **"Buat Block (Add block) → Block Data → Detail"**.
3. Pilih **"Tabel data saat ini (Current collection)"**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. Pada Block detail **"Field (Fields)"**, layout sebagai berikut:


| Area | Field |
|------|------|
| Atas | Judul, Status (gaya tag) |
| Body | Deskripsi (area teks besar) |
| Info Samping | Nama Kategori, Prioritas, Pengirim, Penangani, Waktu Pembuatan |

Bagaimana cara meletakkan judul besar?
Pilih Field > Markdown > Edit Markdown > pilih variabel di area edit > Record saat ini > Judul
Dengan demikian judul record dimasukkan secara dinamis ke Block Markdown.
Hapus teks default, gunakan sintaks Markdown, ubah menjadi gaya heading level 2 (yaitu tambahkan ## spasi di depan)

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

Field judul pada halaman sendiri bisa dihapus, sesuaikan layout form detail

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Tips**: Beberapa field dapat di-drag untuk diatur dalam baris yang sama, membuat layout lebih kompak dan menarik.


1. Pada **"Action (Actions)"** Block detail, centang tombol **"Edit"**, memudahkan untuk langsung masuk ke mode edit dari detail.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Mengonfigurasi Form Edit

Klik tombol "Edit", akan membuka popup baru — di dalamnya perlu menempatkan satu form edit. Field form edit hampir sama dengan form tambah baru, apakah harus mencentangnya lagi dari awal?

Tidak perlu. Ingat form tambah baru? Mari kita **simpan sebagai template** terlebih dahulu, form edit langsung merujuk ke template tersebut.

**Langkah Pertama: Kembali ke form tambah baru, simpan sebagai template**

1. Tutup popup saat ini, kembali ke daftar tiket, klik tombol "Tambah" untuk membuka form tambah baru.
2. Klik **Pengaturan Block** (ikon tiga garis horizontal) di pojok kanan atas Block form, temukan **"Simpan sebagai Template (Save as template)"**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Klik simpan, default adalah **"Reference"** — semua form yang merujuk template ini berbagi konfigurasi yang sama, modifikasi di satu tempat akan tersinkronisasi semua.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Form tiket kita tidak rumit, memilih "Reference" untuk pemeliharaan terpadu lebih praktis. Jika memilih "Duplicate", maka setiap form akan mendapat salinan independen, masing-masing dimodifikasi tidak saling mempengaruhi.

**Langkah Kedua: Rujuk template di popup edit**

1. Kembali ke drawer detail atau kolom Action tabel, klik tombol "Edit" untuk membuka popup edit.

Anda mungkin berpikir: langsung melalui **"Buat Block → Block Lainnya → Block Template"** untuk membuatnya saja? Coba dan Anda akan menemukan — yang dibuat dengan cara ini adalah **form tambah baru**, dan field tidak otomatis terisi. Ini adalah jebakan yang umum.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

Cara yang benar adalah:

2. Pada popup klik **"Buat Block (Add block) → Block Data → Form (Edit)"**, buat Block form edit secara normal terlebih dahulu.
3. Pada form edit klik **"Field (Fields) → Field Templates"**, pilih template yang baru saja disimpan.
4. Field akan langsung terisi semua, sama persis dengan form tambah baru.
5. Jangan lupa tambahkan tombol Action "Submit" agar pengguna dapat menyimpan setelah modifikasi.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

Ingin menambah field di kemudian hari? Cukup modifikasi sekali di template, form tambah baru dan edit akan terupdate secara sinkron.

### Quick Edit: Tidak Perlu Buka Popup untuk Mengubah Data

Selain edit popup, NocoBase juga mendukung **quick edit** langsung pada tabel — tidak perlu membuka popup apapun, mouse hover saja sudah bisa diubah.

Cara mengaktifkan ada di dua tempat:

- **Tingkat Block tabel**: klik **Pengaturan Block** (ikon tiga garis horizontal) Block tabel, temukan **"Quick editing"**, setelah diaktifkan semua field tabel mendukung quick edit.
- **Tingkat field individual**: klik konfigurasi field pada salah satu kolom, temukan **"Quick edit"**, dapat mengontrol per field apakah aktif.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Setelah diaktifkan, mouse hover ke cell tabel akan muncul ikon pensil kecil, klik akan muncul komponen edit field tersebut, modifikasi otomatis tersimpan.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **Untuk skenario apa yang cocok?** Quick edit sangat cocok untuk skenario yang membutuhkan modifikasi batch field seperti status, penangani, dll. Misalnya saat administrator browsing daftar tiket, dapat langsung klik kolom "Status" untuk dengan cepat mengubah tiket dari "Menunggu" menjadi "Sedang Diproses", tidak perlu membuka edit satu per satu.

## 4.4 Mengaktifkan Riwayat

:::info Plugin Komersial
"[Riwayat](https://docs.nocobase.com/cn/record-history/)" adalah Plugin [versi profesional](https://www.nocobase.com/cn/commercial) NocoBase, membutuhkan lisensi versi komersial untuk dapat digunakan. Jika Anda menggunakan versi komunitas, Anda dapat melewati bagian ini, tidak akan mempengaruhi bab selanjutnya.
:::

Hal terpenting dari sistem tiket adalah: **siapa mengubah apa kapan, harus dapat dilacak**. Plugin "Riwayat" NocoBase membantu kita secara otomatis mencatat setiap perubahan data.

### Mengonfigurasi Riwayat

1. Masuk ke **Pengaturan → Manajemen Plugin**, pastikan Plugin "Riwayat" (Record History) sudah diaktifkan.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Masuk ke halaman konfigurasi Plugin, klik **"Tambah Tabel Data"**, pilih **"Tiket"**.
3. Pilih field yang perlu dicatat: **judul, status, prioritas, penangani, deskripsi**, dan lainnya.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Saran**: Tidak perlu mencatat semua field. Field seperti ID, waktu pembuatan yang tidak akan dimodifikasi secara manual, tidak perlu dilacak. Hanya catat perubahan field yang bermakna untuk bisnis.

4. Saat ini kembali ke konfigurasi, klik **"Sinkronisasi Snapshot Data Riwayat"**, Plugin akan otomatis mencatat semua tiket yang ada sebagai record riwayat pertama, setiap modifikasi selanjutnya akan menambahkan record riwayat baru.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Melihat Riwayat di Halaman Detail

1. Kembali ke halaman drawer detail tiket (klik tombol "Lihat" pada baris tabel).
2. Pada drawer **"Buat Block (Add block) → Riwayat"**.
3. Pilih **"Tabel data saat ini"**, data pilih **"Record saat ini"**.
4. Bagian bawah halaman detail akan muncul timeline, dengan jelas menunjukkan setiap perubahan: siapa kapan mengubah field apa dari nilai apa menjadi nilai apa.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Dengan demikian, meskipun tiket telah ditangani oleh banyak orang, semua perubahan jelas terlihat.

## Ringkasan

Pada bab ini kita telah menyelesaikan siklus hidup data yang lengkap:

- **Form** — pengguna dapat mengirim tiket baru, field memiliki nilai default dan validasi
- **Aturan Linkage** — tiket urgent secara otomatis mewajibkan pengisian deskripsi
- **Block Detail** — menampilkan informasi lengkap tiket dengan jelas
- **Riwayat** — secara otomatis melacak setiap perubahan, audit tanpa khawatir (Plugin komersial, opsional)

Dari "bisa dilihat" hingga "bisa diisi" lalu "bisa dilacak" — sistem tiket kita sudah memiliki kegunaan dasar.

## Sumber Daya Terkait

- [Block Form](/interface-builder/blocks/data-blocks/form) — Konfigurasi detail Block form
- [Block Detail](/interface-builder/blocks/data-blocks/details) — Konfigurasi Block detail
- [Aturan Linkage](/interface-builder/linkage-rules) — Penjelasan aturan linkage field
